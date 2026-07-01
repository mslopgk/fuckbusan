"""
Whitebox tests — checklist_router.py

Coverage targets:
  - submit: anon vs auth, data persistence
  - list: auth-gated (anon → [])
  - my: auth required
  - clusters: grouping by district
  - aggregate: category average
  - templates: 404 when empty, returns payload when present
  - recommendations: result_id path / district path / empty fallback
  - detail + update (ownership check)
"""
import pytest
import models


def make_checklist(db, *, user_id=None, user_str_id=None,
                   district="26110", category="보행환경", score=75,
                   lat=35.16, lng=129.16):
    c = models.ChecklistResult(
        user_id=user_id,
        ID=user_str_id,
        district_code=district,
        대분류=category,
        점수=score,
        위도=lat,
        경도=lng,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# ─────────────────────────────────────────────────────────────
# Submit
# ─────────────────────────────────────────────────────────────

class TestChecklistSubmit:
    def test_anon_submit_succeeds(self, client):
        r = client.post("/checklist/submit", json={
            "district_code": "26110", "대분류": "보행환경", "점수": 70,
        })
        assert r.status_code == 201
        assert "result_id" in r.json()

    def test_auth_submit_binds_user(self, client, user, db, auth):
        r = client.post("/checklist/submit", json={
            "district_code": "26110", "대분류": "보행환경", "점수": 70,
        }, headers=auth)
        assert r.status_code == 201
        rid = r.json()["result_id"]
        result = db.query(models.ChecklistResult).filter(
            models.ChecklistResult.result_id == rid
        ).first()
        assert result.user_id == user.user_id
        assert result.ID == user.ID

    def test_minimal_payload(self, client):
        r = client.post("/checklist/submit", json={})
        assert r.status_code == 201

    def test_full_payload(self, client, user, auth):
        r = client.post("/checklist/submit", json={
            "진단지역": "해운대구",
            "district_code": "26110",
            "위도": 35.1631,
            "경도": 129.1635,
            "대분류": "보행환경",
            "중분류": "보도",
            "점수": 88,
            "리뷰": "괜찮음",
            "만족도": "보통",
        }, headers=auth)
        assert r.status_code == 201


# ─────────────────────────────────────────────────────────────
# List
# ─────────────────────────────────────────────────────────────

class TestChecklistList:
    def test_anon_returns_empty(self, client, user, db):
        make_checklist(db, user_id=user.user_id)
        r = client.get("/checklist/list")
        assert r.status_code == 200
        assert r.json() == []

    def test_auth_returns_all(self, client, user, db, auth):
        for _ in range(3):
            make_checklist(db, user_id=user.user_id)
        r = client.get("/checklist/list", headers=auth)
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_limit_respected(self, client, user, db, auth):
        for _ in range(10):
            make_checklist(db, user_id=user.user_id)
        r = client.get("/checklist/list?limit=5", headers=auth)
        assert len(r.json()) == 5

    def test_limit_capped_at_500(self, client, user, db, auth):
        # Should not crash with limit > 500
        r = client.get("/checklist/list?limit=9999", headers=auth)
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────
# My checklist
# ─────────────────────────────────────────────────────────────

class TestMyChecklist:
    def test_returns_only_own(self, client, user, user2, db, auth):
        c = make_checklist(db, user_id=user.user_id, district="26110", score=77)
        make_checklist(db, user_id=user2.user_id, district="26110", score=88)
        r = client.get("/checklist/my", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 1
        # ChecklistResponse doesn't expose user_id; verify identity via result_id
        assert items[0]["result_id"] == c.result_id

    def test_requires_auth(self, client):
        r = client.get("/checklist/my")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────
# Clusters
# ─────────────────────────────────────────────────────────────

class TestChecklistClusters:
    def test_empty(self, client):
        r = client.get("/checklist/clusters")
        assert r.status_code == 200
        assert r.json() == []

    def test_groups_by_district(self, client, user, db):
        make_checklist(db, user_id=user.user_id, district="26110", lat=35.16, lng=129.16)
        make_checklist(db, user_id=user.user_id, district="26110", lat=35.17, lng=129.17)
        make_checklist(db, user_id=user.user_id, district="26140", lat=35.20, lng=129.10)
        r = client.get("/checklist/clusters")
        clusters = r.json()
        assert len(clusters) == 2
        c26110 = next(c for c in clusters if c["district"] == "26110")
        assert c26110["count"] == 2

    def test_skips_no_coords(self, client, db):
        c = models.ChecklistResult(district_code="26110", 점수=70)
        db.add(c)
        db.commit()
        r = client.get("/checklist/clusters")
        assert r.json() == []

    def test_avg_score_computed(self, client, user, db):
        make_checklist(db, user_id=user.user_id, district="26110", score=60)
        make_checklist(db, user_id=user.user_id, district="26110", score=80)
        r = client.get("/checklist/clusters")
        cluster = r.json()[0]
        assert cluster["avg_score"] == pytest.approx(70.0, abs=0.1)


# ─────────────────────────────────────────────────────────────
# Aggregate
# ─────────────────────────────────────────────────────────────

class TestChecklistAggregate:
    def test_empty(self, client):
        r = client.get("/checklist/aggregate")
        assert r.status_code == 200
        assert r.json() == []

    def test_groups_by_category(self, client, user, db):
        make_checklist(db, user_id=user.user_id, category="보행환경", score=80)
        make_checklist(db, user_id=user.user_id, category="보행환경", score=60)
        make_checklist(db, user_id=user.user_id, category="녹지환경", score=90)
        r = client.get("/checklist/aggregate")
        cats = {item["category"]: item for item in r.json()}
        assert "보행환경" in cats
        assert cats["보행환경"]["avg_score"] == pytest.approx(70.0, abs=0.1)
        assert cats["보행환경"]["count"] == 2

    def test_district_filter(self, client, user, db):
        make_checklist(db, user_id=user.user_id, district="26110", category="보행환경", score=80)
        make_checklist(db, user_id=user.user_id, district="26140", category="보행환경", score=40)
        r = client.get("/checklist/aggregate?district=26110")
        rows = r.json()
        assert len(rows) == 1
        assert rows[0]["avg_score"] == pytest.approx(80.0, abs=0.1)


# ─────────────────────────────────────────────────────────────
# Templates
# ─────────────────────────────────────────────────────────────

class TestChecklistTemplates:
    def test_404_when_no_template(self, client):
        r = client.get("/checklist/templates?mode=general")
        assert r.status_code == 404

    def test_returns_payload(self, client, db):
        t = models.ChecklistTemplate(
            kind="diagnosis", mode="general",
            title="일반 진단", payload={"categories": []},
        )
        db.add(t)
        db.commit()
        r = client.get("/checklist/templates?mode=general")
        assert r.status_code == 200
        assert "categories" in r.json()

    def test_expert_mode_separate_from_general(self, client, db):
        db.add(models.ChecklistTemplate(
            kind="diagnosis", mode="general",
            payload={"mode": "general"},
        ))
        db.commit()
        r = client.get("/checklist/templates?mode=expert")
        assert r.status_code == 404


class TestComprehensiveSurvey:
    def test_404_when_missing(self, client):
        r = client.get("/checklist/comprehensive-survey")
        assert r.status_code == 404

    def test_returns_payload(self, client, db):
        db.add(models.ChecklistTemplate(
            kind="survey", mode="comprehensive",
            payload=[{"id": 1, "text": "질문"}],
        ))
        db.commit()
        r = client.get("/checklist/comprehensive-survey")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ─────────────────────────────────────────────────────────────
# Recommendations
# ─────────────────────────────────────────────────────────────

class TestChecklistRecommendations:
    def test_empty_proposals(self, client, user, db):
        c = make_checklist(db, user_id=user.user_id, category="보행환경")
        r = client.get(f"/checklist/recommendations?result_id={c.result_id}")
        assert r.status_code == 200
        body = r.json()
        assert "proposals" in body
        assert body["proposals"] == []

    def test_result_id_not_found(self, client):
        r = client.get("/checklist/recommendations?result_id=99999")
        assert r.status_code == 404

    def test_district_fallback(self, client, user, db):
        make_checklist(db, user_id=user.user_id, district="26110", category="보행환경", score=30)
        r = client.get("/checklist/recommendations?district=26110")
        assert r.status_code == 200

    def test_recommends_matching_proposals(self, client, user, db, auth):
        make_checklist(db, user_id=user.user_id, district="26110", category="보행환경", score=30)
        p = models.NewProposal(
            user_id=user.user_id, category="보행환경", title="보행 개선",
            content="내용", region="26110", likes_count=5,
        )
        db.add(p)
        db.commit()
        r = client.get("/checklist/recommendations?district=26110")
        body = r.json()
        assert len(body["proposals"]) >= 1


# ─────────────────────────────────────────────────────────────
# Detail + Update
# ─────────────────────────────────────────────────────────────

class TestChecklistDetail:
    def test_owner_can_read(self, client, user, db, auth):
        c = make_checklist(db, user_id=user.user_id)
        r = client.get(f"/checklist/{c.result_id}", headers=auth)
        assert r.status_code == 200

    def test_not_found(self, client, auth):
        r = client.get("/checklist/99999", headers=auth)
        assert r.status_code == 404

    def test_requires_auth(self, client, user, db):
        c = make_checklist(db, user_id=user.user_id)
        r = client.get(f"/checklist/{c.result_id}")
        assert r.status_code == 401


class TestChecklistUpdate:
    def test_owner_can_update(self, client, user, db, auth):
        c = make_checklist(db, user_id=user.user_id, score=70)
        r = client.put(f"/checklist/{c.result_id}", headers=auth,
                       json={"점수": 90})
        assert r.status_code == 200
        db.refresh(c)
        assert c.점수 == 90

    def test_non_owner_cannot_update(self, client, user, user2, db, auth2):
        c = make_checklist(db, user_id=user.user_id, score=70)
        r = client.put(f"/checklist/{c.result_id}", headers=auth2,
                       json={"점수": 10})
        assert r.status_code == 403
