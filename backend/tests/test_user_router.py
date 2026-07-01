"""
Whitebox tests — user_router.py

Coverage targets:
  - signup: validation branches (ID length, PW length, reserved "admin", duplicate)
  - login: admin shortcut, normal user, wrong password
  - get_current_user: valid token, admin synthetic user, missing token
  - /users/me, update profile, reset-password
  - find-id / find-pw
  - Admin-only: GET/PUT/DELETE /api/users
"""
import pytest
from .conftest import bearer, make_user


# ─────────────────────────────────────────────────────────────
# Signup
# ─────────────────────────────────────────────────────────────

class TestSignup:
    def test_success(self, client):
        r = client.post("/users/signup", json={
            "ID": "newuser", "PW": "secret123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 201
        assert r.json()["message"] == "회원가입 성공"

    def test_id_too_short(self, client):
        r = client.post("/users/signup", json={
            "ID": "abc", "PW": "secret123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 400
        assert "4자" in r.json()["detail"]

    def test_pw_too_short(self, client):
        r = client.post("/users/signup", json={
            "ID": "validid", "PW": "123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 400
        assert "6자" in r.json()["detail"]

    def test_reserved_admin_id(self, client):
        r = client.post("/users/signup", json={
            "ID": "admin", "PW": "secret123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 400
        assert "사용할 수 없는" in r.json()["detail"]

    def test_duplicate_id(self, client, user):
        r = client.post("/users/signup", json={
            "ID": user.ID, "PW": "secret123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 400
        assert "이미 존재" in r.json()["detail"]

    def test_optional_fields_default_none(self, client):
        r = client.post("/users/signup", json={
            "ID": "newuser2", "PW": "secret123",
            "name": "홍길동", "phone_num": "010-0000-0000",
            "district_code": "26110",
        })
        assert r.status_code == 201


# ─────────────────────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────────────────────

class TestLogin:
    def test_success(self, client, user):
        r = client.post("/users/login", json={"ID": "testuser", "PW": "password123"})
        assert r.status_code == 200
        body = r.json()
        assert body["token_type"] == "bearer"
        assert body["user_name"] == user.name
        assert body["district_code"] == user.district_code
        assert "access_token" in body

    def test_admin_shortcut(self, client):
        r = client.post("/users/login", json={"ID": "admin", "PW": "admin1234"})
        assert r.status_code == 200
        body = r.json()
        assert body["district_code"] == "admin"
        assert body["user_name"] == "관리자"

    def test_wrong_password(self, client, user):
        r = client.post("/users/login", json={"ID": "testuser", "PW": "wrongpass"})
        assert r.status_code == 401

    def test_nonexistent_user(self, client):
        r = client.post("/users/login", json={"ID": "ghost", "PW": "password"})
        assert r.status_code == 401

    def test_admin_wrong_password(self, client):
        r = client.post("/users/login", json={"ID": "admin", "PW": "wrongadminpw"})
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# /users/me
# ─────────────────────────────────────────────────────────────

class TestGetMe:
    def test_authenticated(self, client, user, auth):
        r = client.get("/users/me", headers=auth)
        assert r.status_code == 200
        body = r.json()
        assert body["ID"] == user.ID
        assert body["name"] == user.name

    def test_unauthenticated(self, client):
        r = client.get("/users/me")
        assert r.status_code == 401

    def test_invalid_token(self, client):
        r = client.get("/users/me", headers=bearer("notavalidtoken"))
        assert r.status_code == 401

    def test_admin_synthetic_user(self, client, admin_auth):
        r = client.get("/users/me", headers=admin_auth)
        assert r.status_code == 200
        body = r.json()
        assert body["ID"] == "admin"

    def test_birth_date_defaults_empty_string(self, client, user, auth):
        r = client.get("/users/me", headers=auth)
        assert r.json()["birth_date"] == ""


# ─────────────────────────────────────────────────────────────
# PUT /users/me — profile update
# ─────────────────────────────────────────────────────────────

class TestUpdateProfile:
    def test_update_name(self, client, user, auth):
        r = client.put("/users/me", headers=auth, json={"name": "새이름"})
        assert r.status_code == 200
        assert r.json()["name"] == "새이름"

    def test_update_phone(self, client, user, auth):
        r = client.put("/users/me", headers=auth, json={"phone_num": "010-9999-8888"})
        assert r.status_code == 200
        assert r.json()["phone_num"] == "010-9999-8888"

    def test_update_birth_date(self, client, user, auth):
        r = client.put("/users/me", headers=auth, json={"birth_date": "1990-01-01"})
        assert r.status_code == 200

    def test_partial_update_only_provided_fields(self, client, db, user, auth):
        original_phone = user.phone_num
        r = client.put("/users/me", headers=auth, json={"name": "새이름"})
        assert r.status_code == 200
        db.refresh(user)
        assert user.phone_num == original_phone  # unchanged

    def test_unauthenticated(self, client):
        r = client.put("/users/me", json={"name": "new"})
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# PUT /users/reset-password
# ─────────────────────────────────────────────────────────────

class TestResetPassword:
    def test_success(self, client, user, auth):
        r = client.put("/users/reset-password", headers=auth,
                       json={"new_pw": "newpass456"})
        assert r.status_code == 200
        # Verify login with new password works
        r2 = client.post("/users/login",
                         json={"ID": user.ID, "PW": "newpass456"})
        assert r2.status_code == 200

    def test_empty_new_pw(self, client, auth):
        r = client.put("/users/reset-password", headers=auth, json={})
        assert r.status_code == 400
        assert "비밀번호" in r.json()["detail"]

    def test_unauthenticated(self, client):
        r = client.put("/users/reset-password", json={"new_pw": "newpass"})
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Find ID / Find PW
# ─────────────────────────────────────────────────────────────

class TestFindId:
    def test_found(self, client, user):
        r = client.post("/users/find-id", json={
            "name": user.name, "phone_num": user.phone_num
        })
        assert r.status_code == 200
        assert r.json()["ID"] == user.ID

    def test_not_found(self, client):
        r = client.post("/users/find-id", json={
            "name": "없는사람", "phone_num": "010-0000-0000"
        })
        assert r.status_code == 404

    def test_name_mismatch(self, client, user):
        r = client.post("/users/find-id", json={
            "name": "틀린이름", "phone_num": user.phone_num
        })
        assert r.status_code == 404


class TestFindPw:
    def test_returns_temp_password(self, client, user):
        r = client.post("/users/find-pw", json={
            "ID": user.ID, "phone_num": user.phone_num
        })
        assert r.status_code == 200
        body = r.json()
        assert "temp_password" in body
        assert len(body["temp_password"]) == 10

    def test_temp_password_usable_for_login(self, client, user):
        r = client.post("/users/find-pw", json={
            "ID": user.ID, "phone_num": user.phone_num
        })
        temp_pw = r.json()["temp_password"]
        r2 = client.post("/users/login", json={"ID": user.ID, "PW": temp_pw})
        assert r2.status_code == 200

    def test_not_found(self, client):
        r = client.post("/users/find-pw", json={
            "ID": "ghost", "phone_num": "010-0000-0000"
        })
        assert r.status_code == 404


# ─────────────────────────────────────────────────────────────
# Admin endpoints — GET/PUT/DELETE /api/users
# ─────────────────────────────────────────────────────────────

class TestAdminUsers:
    def test_list_all_users_admin(self, client, user, admin_auth):
        r = client.get("/api/users", headers=admin_auth)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert any(u["ID"] == user.ID for u in r.json())

    def test_list_users_forbidden_for_normal_user(self, client, auth):
        r = client.get("/api/users", headers=auth)
        assert r.status_code == 403

    def test_list_users_unauthenticated(self, client):
        r = client.get("/api/users")
        assert r.status_code == 401

    def test_delete_user_admin(self, client, user, db, admin_auth):
        uid = user.user_id
        r = client.delete(f"/api/users/{uid}", headers=admin_auth)
        assert r.status_code == 200
        from models import User
        assert db.query(User).filter(User.user_id == uid).first() is None

    def test_delete_nonexistent_user(self, client, admin_auth):
        r = client.delete("/api/users/99999", headers=admin_auth)
        assert r.status_code == 404

    def test_delete_user_forbidden_for_normal_user(self, client, user, auth):
        r = client.delete(f"/api/users/{user.user_id}", headers=auth)
        assert r.status_code == 403

    def test_filter_by_user_type(self, client, user, admin_auth):
        r = client.get(f"/api/users?user_type={user.district_code}", headers=admin_auth)
        assert r.status_code == 200
        for u in r.json():
            assert u["district_code"] == user.district_code

    def test_filter_no_match_returns_empty(self, client, admin_auth):
        r = client.get("/api/users?user_type=NONEXISTENT", headers=admin_auth)
        assert r.status_code == 200
        assert r.json() == []
