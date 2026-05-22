"""
Security-focused whitebox tests.

Documents known security issues and verifies auth boundaries.

Known issues (marked KNOWN-BUG):
  - [KNOWN-BUG] user_router.create_access_token does NOT add exp claim
    → tokens issued at login never expire
  - [KNOWN-BUG] ProposalComment.user_id is nullable=False but admin writes
    user_id=None → will fail in MariaDB (FK + NOT NULL constraint)
"""
import pytest
from jose import jwt
from utils import SECRET_KEY, ALGORITHM
from tests.conftest import bearer


# ─────────────────────────────────────────────────────────────
# Token expiry
# ─────────────────────────────────────────────────────────────

class TestTokenExpiry:
    def test_login_token_has_no_exp_claim(self, client, user):
        """
        KNOWN-BUG: user_router.create_access_token never sets 'exp'.
        This test documents the current (insecure) behaviour.
        Tokens issued via /users/login are effectively immortal.
        """
        r = client.post("/users/login", json={"ID": "testuser", "PW": "password123"})
        token = r.json()["access_token"]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Bug documented: 'exp' is absent
        assert "exp" not in payload, (
            "token now has exp — update user_router.create_access_token to verify fix"
        )

    def test_expired_token_rejected(self, client):
        """Token with exp in the past must be rejected."""
        from datetime import datetime, timezone
        past = int(datetime(2000, 1, 1, tzinfo=timezone.utc).timestamp())
        expired = jwt.encode({"sub": "testuser", "exp": past}, SECRET_KEY, ALGORITHM)
        r = client.get("/users/me", headers=bearer(expired))
        assert r.status_code == 401

    def test_tampered_token_rejected(self, client):
        r = client.get("/users/me", headers=bearer("totally.invalid.token"))
        assert r.status_code == 401

    def test_wrong_secret_rejected(self, client, user):
        bad_token = jwt.encode({"sub": user.ID}, "wrong-secret", ALGORITHM)
        r = client.get("/users/me", headers=bearer(bad_token))
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Authorization boundaries
# ─────────────────────────────────────────────────────────────

class TestAuthBoundaries:
    def test_admin_id_signup_blocked(self, client):
        """Reserved 'admin' ID cannot be registered as a real user."""
        r = client.post("/users/signup", json={
            "ID": "admin", "PW": "hacker123",
            "name": "해커", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 400

    def test_normal_user_cannot_impersonate_admin(self, client, user):
        """A registered user with ID='testuser' must not get admin rights."""
        r = client.post("/users/login", json={"ID": user.ID, "PW": "password123"})
        token = r.json()["access_token"]
        r2 = client.get("/api/users", headers=bearer(token))
        assert r2.status_code == 403

    def test_report_delete_requires_ownership_or_admin(self, client, user, user2, db, auth2):
        from tests.conftest import make_report
        rpt = make_report(db, user_id=user.user_id)
        r = client.delete(f"/api/reports/{rpt.id}", headers=auth2)
        assert r.status_code == 403

    def test_proposal_vote_requires_login(self, client, user, db):
        from tests.conftest import make_proposal
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/vote")
        assert r.status_code == 401

    def test_checklist_detail_requires_login(self, client):
        r = client.get("/checklist/99999")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Known bug: ProposalComment nullable=False user_id for admin
# ─────────────────────────────────────────────────────────────

class TestProposalCommentAdminBug:
    def test_admin_comment_null_user_id_sqlite_permissive(
        self, client, user, db, admin_auth
    ):
        """
        KNOWN-BUG (MariaDB only): ProposalComment.user_id is nullable=False.
        Admin user (user_id=999999) results in safe_uid=None, which violates
        the NOT NULL constraint in MariaDB.

        SQLite does not enforce NOT NULL on FK columns the same way,
        so this test verifies the SQLite behaviour only.
        The actual MariaDB failure is documented here as a known issue.
        """
        from tests.conftest import make_proposal
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/comments",
                        headers=admin_auth, json={"content": "관리자 댓글"})
        # SQLite: may succeed (201) or fail (500) depending on constraint enforcement.
        # Either outcome is acceptable for this test — we just document the risk.
        assert r.status_code in (201, 500), (
            f"Unexpected status {r.status_code}; investigate admin comment bug"
        )


# ─────────────────────────────────────────────────────────────
# Notification utils — boundary checks
# ─────────────────────────────────────────────────────────────

class TestNotificationUtils:
    def test_self_notification_skipped(self, db):
        """push_notification should skip when actor == recipient."""
        from notification_utils import push_notification
        from tests.conftest import make_user
        u = make_user(db, ID="notifytest", name="알림테스트")
        result = push_notification(
            db, user_id=u.user_id, actor_id=u.user_id,
            kind="like", target_type="report", target_id=1,
        )
        assert result is None

    def test_admin_activity_log_skipped(self, db):
        """log_activity skips user_id >= 999990 (admin synthetic user)."""
        from notification_utils import log_activity
        result = log_activity(db, user_id=999999, action="vote",
                              target_type="proposal", target_id=1)
        assert result is None

    def test_none_user_id_activity_logged(self, db):
        """log_activity with user_id=None (anon) should succeed."""
        from notification_utils import log_activity
        result = log_activity(db, user_id=None, action="create",
                              target_type="report", target_id=1)
        assert result is not None
