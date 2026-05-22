"""
Whitebox tests — home_router.py + dashboard.py

Coverage targets:
  - /api/home/stats: counts from real DB rows
  - /api/home/citizens: persona list, JSON-string tags
  - /api/home/archives: top proposals by likes_count
  - /api/dashboard/score: no-data fallback, grade calculation (S/A/B/C)
  - /api/dashboard/analysis: district filter
  - /api/dashboard/insights: year + district filter
  - /api/dashboard/personas: year filter + JSON tag parsing
"""
import pytest
import models


# ─────────────────────────────────────────────────────────────
# /api/home/stats
# ─────────────────────────────────────────────────────────────

class TestHomeStats:
    def test_all_zeros_empty_db(self, client):
        r = client.get("/api/home/stats")
        assert r.status_code == 200
        body = r.json()
        assert body["reports_count"] == 0
        assert body["proposals_count"] == 0
        assert body["diagnoses_count"] == 0
        assert body["citizens_count"] == 0

    def test_counts_actual_rows(self, client, user, db):
        from tests.conftest import make_report, make_proposal
        make_report(db, user_id=user.user_id)
        make_report(db, user_id=user.user_id)
        make_proposal(db, user_id=user.user_id)
        db.add(models.ChecklistResult(district_code="26110"))
        db.commit()
        r = client.get("/api/home/stats")
        body = r.json()
        assert body["reports_count"] == 2
        assert body["proposals_count"] == 1
        assert body["diagnoses_count"] == 1


# ─────────────────────────────────────────────────────────────
# /api/home/citizens
# ─────────────────────────────────────────────────────────────

class TestHomeCitizens:
    def test_empty_db(self, client):
        r = client.get("/api/home/citizens")
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_persona_list(self, client, db):
        db.add(models.Persona(
            district_code="26110", year="2024",
            name="김민준", age=35, job="직장인",
            image_emoji="👨", quote="평범한 직장인",
            full_quote="부산 해운대에 사는 평범한 직장인입니다.",
            tags=["직장인", "대중교통"],
            pain_points=[], suggestions=[], expected_effects=[], stats={},
        ))
        db.commit()
        r = client.get("/api/home/citizens")
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 1
        assert items[0]["name"] == "김민준"
        assert isinstance(items[0]["tags"], list)

    def test_json_string_tags_parsed(self, client, db):
        """tags stored as JSON string → should be returned as list."""
        import json
        p = models.Persona(
            district_code="26110", year="2024",
            name="이영희", age=28, job="교사",
            image_emoji="👩", quote="교사",
            full_quote="부산의 교사입니다.",
            pain_points=[], suggestions=[], expected_effects=[], stats={},
        )
        p.tags = json.dumps(["교사", "버스"])  # stored as string
        db.add(p)
        db.commit()
        r = client.get("/api/home/citizens")
        tags = r.json()[0]["tags"]
        assert isinstance(tags, list)
        assert "교사" in tags

    def test_limited_to_8(self, client, db):
        for i in range(12):
            db.add(models.Persona(
                district_code="26110", year="2024",
                name=f"시민{i}", age=30, job="직장인",
                image_emoji="👤", quote="인용구",
                full_quote="전체인용구",
                tags=[], pain_points=[], suggestions=[],
                expected_effects=[], stats={},
            ))
        db.commit()
        r = client.get("/api/home/citizens")
        assert len(r.json()) <= 8


# ─────────────────────────────────────────────────────────────
# /api/home/archives
# ─────────────────────────────────────────────────────────────

class TestHomeArchives:
    def test_empty(self, client):
        r = client.get("/api/home/archives")
        assert r.status_code == 200
        assert r.json() == []

    def test_sorted_by_likes(self, client, user, db):
        from tests.conftest import make_proposal
        p1 = make_proposal(db, user_id=user.user_id, title="인기없음")
        p2 = make_proposal(db, user_id=user.user_id, title="인기있음")
        p2.likes_count = 10
        db.commit()
        r = client.get("/api/home/archives")
        items = r.json()
        assert items[0]["title"] == "인기있음"

    def test_limited_to_6(self, client, user, db):
        for i in range(10):
            p = models.NewProposal(
                user_id=user.user_id, category="안전",
                title=f"제안{i}", content="내용", region="해운대구",
                likes_count=i,
            )
            db.add(p)
        db.commit()
        r = client.get("/api/home/archives")
        assert len(r.json()) <= 6

    def test_desc_truncated_to_80_chars(self, client, user, db):
        p = models.NewProposal(
            user_id=user.user_id, category="안전",
            title="제안", content="가" * 200, region="해운대구",
        )
        db.add(p)
        db.commit()
        r = client.get("/api/home/archives")
        assert len(r.json()[0]["desc"]) <= 80


# ─────────────────────────────────────────────────────────────
# /api/dashboard/score
# ─────────────────────────────────────────────────────────────

class TestDashboardScore:
    def test_no_data_returns_zero_na(self, client):
        r = client.get("/api/dashboard/score?year=2024")
        assert r.status_code == 200
        body = r.json()
        assert body["score"] == 0
        assert body["grade"] == "N/A"

    @pytest.mark.parametrize("score,expected_grade", [
        (95.0, "S"),
        (85.0, "A"),
        (75.0, "B"),
        (60.0, "C"),
    ])
    def test_grade_thresholds(self, client, db, score, expected_grade):
        db.add(models.DistrictAnalysis(
            district_code="26110", year="2024",
            housing_score=score, env_score=score,
            transport_score=score, safety_score=score,
            culture_score=score, industry_score=score,
            welfare_score=score, education_score=score,
        ))
        db.commit()
        r = client.get("/api/dashboard/score?year=2024&district=26110")
        assert r.json()["grade"] == expected_grade

    def test_district_filter(self, client, db):
        for code in ("26110", "26140"):
            db.add(models.DistrictAnalysis(
                district_code=code, year="2024",
                housing_score=80, env_score=80,
                transport_score=80, safety_score=80,
                culture_score=80, industry_score=80,
                welfare_score=80, education_score=80,
            ))
        db.commit()
        r = client.get("/api/dashboard/score?year=2024&district=26110")
        assert r.status_code == 200
        # Only one district → score should equal that district's safety_score
        assert r.json()["score"] == pytest.approx(80.0, abs=0.1)


# ─────────────────────────────────────────────────────────────
# /api/dashboard/analysis
# ─────────────────────────────────────────────────────────────

class TestDashboardAnalysis:
    def test_empty(self, client):
        r = client.get("/api/dashboard/analysis?year=2024")
        assert r.status_code == 200
        assert r.json() == []

    def test_all_districts(self, client, db):
        for code in ("26110", "26140"):
            db.add(models.DistrictAnalysis(
                district_code=code, year="2024",
                housing_score=80, env_score=70, transport_score=60, safety_score=90,
                culture_score=75, industry_score=65, welfare_score=85, education_score=55,
            ))
        db.commit()
        r = client.get("/api/dashboard/analysis?year=2024")
        assert len(r.json()) == 2

    def test_district_filter_comma_separated(self, client, db):
        for code in ("26110", "26140", "26170"):
            db.add(models.DistrictAnalysis(
                district_code=code, year="2024",
                housing_score=80, env_score=70, transport_score=60, safety_score=90,
                culture_score=75, industry_score=65, welfare_score=85, education_score=55,
            ))
        db.commit()
        r = client.get("/api/dashboard/analysis?year=2024&district=26110,26140")
        assert len(r.json()) == 2

    def test_wrong_year_returns_empty(self, client, db):
        db.add(models.DistrictAnalysis(
            district_code="26110", year="2024",
            housing_score=80, env_score=70, transport_score=60, safety_score=90,
            culture_score=75, industry_score=65, welfare_score=85, education_score=55,
        ))
        db.commit()
        r = client.get("/api/dashboard/analysis?year=2099")
        assert r.json() == []


# ─────────────────────────────────────────────────────────────
# /api/dashboard/insights
# ─────────────────────────────────────────────────────────────

class TestDashboardInsights:
    def test_empty(self, client):
        r = client.get("/api/dashboard/insights?year=2024")
        assert r.status_code == 200
        assert r.json() == []

    def test_year_filter(self, client, db):
        for year in ("2024", "2023"):
            db.add(models.DistrictInsight(
                district_code="26110", year=year,
                type="danger", title=f"인사이트{year}",
                description="설명", latitude=35.16, longitude=129.16,
            ))
        db.commit()
        r = client.get("/api/dashboard/insights?year=2024")
        assert len(r.json()) == 1
        assert r.json()[0]["title"] == "인사이트2024"

    def test_district_filter(self, client, db):
        for code in ("26110", "26140"):
            db.add(models.DistrictInsight(
                district_code=code, year="2024",
                type="info", title=f"인사이트{code}",
                description="설명", latitude=35.16, longitude=129.16,
            ))
        db.commit()
        r = client.get("/api/dashboard/insights?year=2024&district=26110")
        assert len(r.json()) == 1


# ─────────────────────────────────────────────────────────────
# /api/dashboard/personas
# ─────────────────────────────────────────────────────────────

class TestDashboardPersonas:
    def test_empty(self, client):
        r = client.get("/api/dashboard/personas?year=2024")
        assert r.status_code == 200
        assert r.json() == []

    def test_year_filter(self, client, db):
        for year in ("2024", "2023"):
            db.add(models.Persona(
                district_code="26110", year=year,
                name=f"시민{year}", age=30, job="직장인",
                image_emoji="👤", quote="인용구", full_quote="전체인용구",
                tags=[], pain_points=[], suggestions=[],
                expected_effects=[], stats={},
            ))
        db.commit()
        r = client.get("/api/dashboard/personas?year=2024")
        assert len(r.json()) == 1
