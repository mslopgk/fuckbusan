"""
Whitebox tests — report_router.py

Coverage targets:
  - Report CRUD (create, list, detail, update, delete)
  - Report filters: region / category / status / pagination
  - Report like toggle (normal / admin blocked / count sync)
  - Report comments (create / list / update / delete, ownership)
  - Proposal CRUD (create, list, detail, update, delete)
  - Proposal vote toggle (normal / admin blocked / count sync)
  - Proposal view (dedup / own-post skip / anon skip)
  - Proposal comments (threaded replies)
  - Cluster endpoints
"""
import pytest
from .conftest import bearer, make_report, make_proposal


# ─────────────────────────────────────────────────────────────
# Report creation
# ─────────────────────────────────────────────────────────────

class TestCreateReport:
    def test_anon_report_accepted(self, client):
        r = client.post("/api/reports/report", json={
            "title": "도로 파손", "category": "안전", "region": "해운대구",
        })
        assert r.status_code == 201
        assert "id" in r.json()

    def test_auth_report_binds_user(self, client, user, db, auth):
        r = client.post("/api/reports/report", json={
            "title": "도로 파손", "category": "안전", "region": "해운대구",
        }, headers=auth)
        assert r.status_code == 201
        from models import Report
        rpt = db.query(Report).filter(Report.id == r.json()["id"]).first()
        assert rpt.user_id == user.user_id

    def test_default_status_is_improvement_scheduled(self, client, db):
        r = client.post("/api/reports/report", json={"title": "테스트"})
        from models import Report
        rpt = db.query(Report).filter(Report.id == r.json()["id"]).first()
        assert rpt.status == "개선예정"
        assert rpt.progress_step == 1

    def test_coordinates_stored(self, client, db):
        r = client.post("/api/reports/report", json={
            "title": "위치제보", "lat": 35.1234, "lng": 129.5678,
        })
        from models import Report
        rpt = db.query(Report).filter(Report.id == r.json()["id"]).first()
        assert float(rpt.lat) == pytest.approx(35.1234, abs=1e-4)


# ─────────────────────────────────────────────────────────────
# Report listing and filters
# ─────────────────────────────────────────────────────────────

class TestListReports:
    def test_empty_returns_list(self, client):
        r = client.get("/api/reports/full")
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_all_reports(self, client, user, db):
        make_report(db, user_id=user.user_id, title="A")
        make_report(db, user_id=user.user_id, title="B")
        r = client.get("/api/reports/full")
        assert len(r.json()) == 2

    def test_filter_by_region(self, client, user, db):
        make_report(db, user_id=user.user_id, region="해운대구")
        make_report(db, user_id=user.user_id, region="동래구")
        r = client.get("/api/reports/full?region=해운대구")
        items = r.json()
        assert all(item["region"] == "해운대구" for item in items)
        assert len(items) == 1

    def test_filter_all_region_returns_all(self, client, user, db):
        make_report(db, user_id=user.user_id, region="해운대구")
        make_report(db, user_id=user.user_id, region="동래구")
        r = client.get("/api/reports/full?region=부산 전 지역")
        assert len(r.json()) == 2

    def test_filter_by_category(self, client, user, db):
        make_report(db, user_id=user.user_id, category="안전")
        make_report(db, user_id=user.user_id, category="환경")
        r = client.get("/api/reports/full?category=안전")
        assert all(item["category"] == "안전" for item in r.json())

    def test_filter_by_status(self, client, user, db):
        make_report(db, user_id=user.user_id, status="개선예정")
        make_report(db, user_id=user.user_id, status="개선완료")
        r = client.get("/api/reports/full?status=개선예정")
        assert all(item["status"] == "개선예정" for item in r.json())

    def test_pagination_returns_envelope(self, client, user, db):
        for i in range(5):
            make_report(db, user_id=user.user_id, title=f"제보{i}")
        r = client.get("/api/reports/full?page=1&size=2")
        body = r.json()
        assert "items" in body
        assert "total" in body
        assert body["total"] == 5
        assert len(body["items"]) == 2

    def test_pagination_page2(self, client, user, db):
        for i in range(5):
            make_report(db, user_id=user.user_id, title=f"제보{i}")
        r = client.get("/api/reports/full?page=2&size=2")
        body = r.json()
        assert len(body["items"]) == 2
        assert body["page"] == 2

    def test_pagination_last_page(self, client, user, db):
        for i in range(5):
            make_report(db, user_id=user.user_id, title=f"제보{i}")
        r = client.get("/api/reports/full?page=3&size=2")
        body = r.json()
        assert len(body["items"]) == 1

    def test_size_capped_at_100(self, client, user, db):
        for i in range(5):
            make_report(db, user_id=user.user_id)
        r = client.get("/api/reports/full?page=1&size=999")
        # should not crash; size is clamped
        assert r.status_code == 200


class TestReportMine:
    def test_returns_only_own(self, client, user, user2, db, auth):
        make_report(db, user_id=user.user_id, title="내꺼")
        make_report(db, user_id=user2.user_id, title="남꺼")
        r = client.get("/api/reports/mine", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 1
        assert items[0]["title"] == "내꺼"

    def test_requires_auth(self, client):
        r = client.get("/api/reports/mine")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Report detail
# ─────────────────────────────────────────────────────────────

class TestReportDetail:
    def test_increments_view_count(self, client, user, db):
        rpt = make_report(db, user_id=user.user_id)
        r = client.get(f"/api/reports/{rpt.id}")
        assert r.status_code == 200
        db.refresh(rpt)
        assert rpt.views == 1

    def test_not_found_404(self, client):
        r = client.get("/api/reports/99999")
        assert r.status_code == 404


# ─────────────────────────────────────────────────────────────
# Report update / delete
# ─────────────────────────────────────────────────────────────

class TestReportMutation:
    def test_owner_can_update(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.put(f"/api/reports/{rpt.id}", headers=auth,
                       json={"title": "수정된제목"})
        assert r.status_code == 200

    def test_non_owner_cannot_update(self, client, user, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        r = client.put(f"/api/reports/{rpt.id}", headers=auth2,
                       json={"title": "수정시도"})
        assert r.status_code == 403

    def test_admin_can_update_any(self, client, user, db, admin_auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.put(f"/api/reports/{rpt.id}", headers=admin_auth,
                       json={"title": "관리자수정"})
        assert r.status_code == 200

    def test_owner_can_delete(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.delete(f"/api/reports/{rpt.id}", headers=auth)
        assert r.status_code == 200

    def test_non_owner_cannot_delete(self, client, user, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        r = client.delete(f"/api/reports/{rpt.id}", headers=auth2)
        assert r.status_code == 403

    def test_delete_removes_report(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        client.delete(f"/api/reports/{rpt.id}", headers=auth)
        from models import Report
        assert db.query(Report).filter(Report.id == rpt.id).first() is None


# ─────────────────────────────────────────────────────────────
# Report like toggle
# ─────────────────────────────────────────────────────────────

class TestReportLike:
    def test_like_increments_count(self, client, user, user2, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/like", headers=auth2)
        assert r.status_code == 200
        assert r.json()["liked"] is True
        assert r.json()["likes_count"] == 1

    def test_second_like_toggles_off(self, client, user, user2, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        client.post(f"/api/reports/{rpt.id}/like", headers=auth2)
        r = client.post(f"/api/reports/{rpt.id}/like", headers=auth2)
        assert r.json()["liked"] is False
        assert r.json()["likes_count"] == 0

    def test_likes_count_never_goes_negative(self, client, user, user2, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/like", headers=auth2)
        r = client.post(f"/api/reports/{rpt.id}/like", headers=auth2)
        assert r.json()["likes_count"] == 0  # max(0, -1) = 0

    def test_admin_cannot_like(self, client, user, db, admin_auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/like", headers=admin_auth)
        assert r.status_code == 403

    def test_not_found(self, client, auth):
        r = client.post("/api/reports/99999/like", headers=auth)
        assert r.status_code == 404

    def test_unauthenticated(self, client, user, db):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/like")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Report comments
# ─────────────────────────────────────────────────────────────

class TestReportComments:
    def test_create_comment(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": "좋은 제보입니다!"})
        assert r.status_code == 201
        body = r.json()
        assert body["content"] == "좋은 제보입니다!"

    def test_comment_increments_count(self, client, user, user2, db, auth2):
        rpt = make_report(db, user_id=user.user_id)
        client.post(f"/api/reports/{rpt.id}/comments", headers=auth2,
                    json={"content": "댓글"})
        db.refresh(rpt)
        assert rpt.comments_count == 1

    def test_list_comments(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        for i in range(3):
            client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": f"댓글{i}"})
        r = client.get(f"/api/reports/{rpt.id}/comments")
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_comment_on_nonexistent_report(self, client, auth):
        r = client.post("/api/reports/99999/comments", headers=auth,
                        json={"content": "고스트"})
        assert r.status_code == 404

    def test_owner_can_delete_comment(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": "삭제할 댓글"})
        cid = r.json()["id"]
        r2 = client.delete(f"/api/reports/{rpt.id}/comments/{cid}", headers=auth)
        assert r2.status_code == 200

    def test_non_owner_cannot_delete_comment(self, client, user, user2, db, auth, auth2):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": "삭제시도"})
        cid = r.json()["id"]
        r2 = client.delete(f"/api/reports/{rpt.id}/comments/{cid}", headers=auth2)
        assert r2.status_code == 403

    def test_delete_comment_decrements_count(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": "지울 댓글"})
        cid = r.json()["id"]
        client.delete(f"/api/reports/{rpt.id}/comments/{cid}", headers=auth)
        db.refresh(rpt)
        assert rpt.comments_count == 0

    def test_owner_can_update_comment(self, client, user, db, auth):
        rpt = make_report(db, user_id=user.user_id)
        r = client.post(f"/api/reports/{rpt.id}/comments", headers=auth,
                        json={"content": "원본"})
        cid = r.json()["id"]
        r2 = client.put(f"/api/reports/{rpt.id}/comments/{cid}", headers=auth,
                        json={"content": "수정됨"})
        assert r2.status_code == 200
        assert r2.json()["content"] == "수정됨"


# ─────────────────────────────────────────────────────────────
# Report clusters
# ─────────────────────────────────────────────────────────────

class TestReportClusters:
    def test_empty_returns_empty(self, client):
        r = client.get("/api/reports/clusters")
        assert r.status_code == 200
        assert r.json() == []

    def test_groups_by_region(self, client, user, db):
        make_report(db, user_id=user.user_id, region="해운대구", lat=35.16, lng=129.16)
        make_report(db, user_id=user.user_id, region="해운대구", lat=35.17, lng=129.17)
        make_report(db, user_id=user.user_id, region="동래구", lat=35.20, lng=129.10)
        r = client.get("/api/reports/clusters")
        clusters = r.json()
        assert len(clusters) == 2
        haeundae = next(c for c in clusters if c["region"] == "해운대구")
        assert haeundae["count"] == 2

    def test_skips_reports_without_coords(self, client, db):
        import models
        rpt = models.Report(title="좌표없음", region="해운대구")
        db.add(rpt)
        db.commit()
        r = client.get("/api/reports/clusters")
        assert r.json() == []


# ─────────────────────────────────────────────────────────────
# Proposals
# ─────────────────────────────────────────────────────────────

class TestCreateProposal:
    def test_anon_proposal(self, client):
        r = client.post("/api/reports/new-proposal", json={
            "category": "안전", "title": "보행로 개선", "content": "내용",
            "region": "해운대구",
        })
        assert r.status_code == 201

    def test_auth_proposal_binds_user(self, client, user, db, auth):
        r = client.post("/api/reports/new-proposal", json={
            "category": "안전", "title": "보행로 개선", "content": "내용",
            "region": "해운대구",
        }, headers=auth)
        assert r.status_code == 201
        from models import NewProposal
        p = db.query(NewProposal).filter(NewProposal.id == r.json()["id"]).first()
        assert p.user_id == user.user_id

    def test_coordinates_stored(self, client, db):
        r = client.post("/api/reports/new-proposal", json={
            "category": "안전", "title": "위치제안", "content": "내용",
            "region": "해운대구", "lat": 35.1234, "lng": 129.5678,
        })
        from models import NewProposal
        p = db.query(NewProposal).filter(NewProposal.id == r.json()["id"]).first()
        assert float(p.lat) == pytest.approx(35.1234, abs=1e-4)


class TestListProposals:
    def test_empty(self, client):
        r = client.get("/api/reports/proposals")
        assert r.status_code == 200
        assert r.json() == []

    def test_is_mine_set_correctly(self, client, user, db, auth):
        make_proposal(db, user_id=user.user_id)
        r = client.get("/api/reports/proposals", headers=auth)
        assert r.json()[0]["is_mine"] is True

    def test_has_voted_false_by_default(self, client, user, db, auth):
        make_proposal(db, user_id=user.user_id)
        r = client.get("/api/reports/proposals", headers=auth)
        assert r.json()[0]["has_voted"] is False

    def test_anon_no_is_mine(self, client, user, db):
        make_proposal(db, user_id=user.user_id)
        r = client.get("/api/reports/proposals")
        assert r.json()[0]["is_mine"] is False


class TestProposalDetail:
    def test_found(self, client, user, db):
        p = make_proposal(db, user_id=user.user_id)
        r = client.get(f"/api/reports/proposals/{p.id}")
        assert r.status_code == 200
        assert r.json()["title"] == p.title

    def test_not_found(self, client):
        r = client.get("/api/reports/proposals/99999")
        assert r.status_code == 404


class TestProposalVote:
    def test_vote_increments_likes(self, client, user, user2, db, auth2):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/vote", headers=auth2)
        assert r.status_code == 200
        assert r.json()["has_voted"] is True
        assert r.json()["likes_count"] == 1

    def test_second_vote_toggles_off(self, client, user, user2, db, auth2):
        p = make_proposal(db, user_id=user.user_id)
        client.post(f"/api/reports/proposals/{p.id}/vote", headers=auth2)
        r = client.post(f"/api/reports/proposals/{p.id}/vote", headers=auth2)
        assert r.json()["has_voted"] is False
        assert r.json()["likes_count"] == 0

    def test_admin_cannot_vote(self, client, user, db, admin_auth):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/vote", headers=admin_auth)
        assert r.status_code == 403

    def test_requires_auth(self, client, user, db):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/vote")
        assert r.status_code == 401

    def test_not_found(self, client, auth):
        r = client.post("/api/reports/proposals/99999/vote", headers=auth)
        assert r.status_code == 404


class TestProposalView:
    def test_other_user_increments_count(self, client, user, user2, db, auth2):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/view", headers=auth2)
        assert r.json()["counted"] is True
        assert r.json()["views_count"] == 1

    def test_own_post_no_count(self, client, user, db, auth):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/view", headers=auth)
        assert r.json()["counted"] is False

    def test_anon_no_count(self, client, user, db):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/view")
        assert r.json()["counted"] is False

    def test_duplicate_view_not_counted(self, client, user, user2, db, auth2):
        p = make_proposal(db, user_id=user.user_id)
        client.post(f"/api/reports/proposals/{p.id}/view", headers=auth2)
        r = client.post(f"/api/reports/proposals/{p.id}/view", headers=auth2)
        assert r.json()["counted"] is False
        assert r.json()["views_count"] == 1

    def test_not_found(self, client):
        r = client.post("/api/reports/proposals/99999/view")
        assert r.status_code == 404


class TestProposalMutation:
    def test_owner_can_update(self, client, user, db, auth):
        p = make_proposal(db, user_id=user.user_id)
        r = client.put(f"/api/reports/proposals/{p.id}", headers=auth, json={
            "category": "환경", "title": "수정된제목", "content": "수정내용",
            "region": "동래구",
        })
        assert r.status_code == 200

    def test_non_owner_cannot_update(self, client, user, db, auth2):
        p = make_proposal(db, user_id=user.user_id)
        r = client.put(f"/api/reports/proposals/{p.id}", headers=auth2, json={
            "category": "환경", "title": "침범", "content": "침범",
            "region": "동래구",
        })
        assert r.status_code == 403

    def test_admin_can_update_any(self, client, user, db, admin_auth):
        p = make_proposal(db, user_id=user.user_id)
        r = client.put(f"/api/reports/proposals/{p.id}", headers=admin_auth, json={
            "category": "환경", "title": "관리자수정", "content": "내용",
            "region": "동래구",
        })
        assert r.status_code == 200

    def test_owner_can_delete(self, client, user, db, auth):
        p = make_proposal(db, user_id=user.user_id)
        r = client.delete(f"/api/reports/proposals/{p.id}", headers=auth)
        assert r.status_code == 200

    def test_delete_cascades_likes_and_comments(self, client, user, user2, db, auth, auth2):
        p = make_proposal(db, user_id=user.user_id)
        client.post(f"/api/reports/proposals/{p.id}/vote", headers=auth2)
        client.post(f"/api/reports/proposals/{p.id}/comments", headers=auth2,
                    json={"content": "댓글"})
        client.delete(f"/api/reports/proposals/{p.id}", headers=auth)
        from models import ProposalLike, ProposalComment
        assert db.query(ProposalLike).filter(ProposalLike.proposal_id == p.id).count() == 0
        assert db.query(ProposalComment).filter(ProposalComment.proposal_id == p.id).count() == 0


class TestProposalComments:
    def test_create_and_list(self, client, user, db, auth):
        p = make_proposal(db, user_id=user.user_id)
        client.post(f"/api/reports/proposals/{p.id}/comments", headers=auth,
                    json={"content": "최상위댓글"})
        r = client.get(f"/api/reports/proposals/{p.id}/comments")
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_threaded_reply(self, client, user, user2, db, auth, auth2):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/comments", headers=auth,
                        json={"content": "부모댓글"})
        parent_id = r.json()["id"]
        client.post(f"/api/reports/proposals/{p.id}/comments", headers=auth2,
                    json={"content": "대댓글", "parent_comment_id": parent_id})
        r2 = client.get(f"/api/reports/proposals/{p.id}/comments")
        top_level = r2.json()
        assert len(top_level) == 1
        assert len(top_level[0]["replies"]) == 1

    def test_non_owner_cannot_delete_comment(self, client, user, user2, db, auth, auth2):
        p = make_proposal(db, user_id=user.user_id)
        r = client.post(f"/api/reports/proposals/{p.id}/comments", headers=auth,
                        json={"content": "댓글"})
        cid = r.json()["id"]
        r2 = client.delete(f"/api/reports/proposals/{p.id}/comments/{cid}",
                           headers=auth2)
        assert r2.status_code == 403
