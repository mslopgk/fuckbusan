from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json
import random
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Use the same URL as database.py
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

import models

def seed_data():
    print("Seeding data for 2026...")
    
    # 1. District Analysis
    districts = [
        "21310", "21150", "21140", "21130", "21120", "21110", "21100", 
        "21090", "21080", "21070", "21060", "21050", "21040", "21030", "21020", "21010"
    ]
    
    # Check if data already exists
    existing = db.query(models.DistrictAnalysis).filter_by(year="2026").first()
    if existing:
        print("Data for 2026 already exists. Skipping analysis seed.")
    else:
        for code in districts:
            analysis = models.DistrictAnalysis(
                year="2026",
                district_code=code,
                housing_score=random.randint(60, 95),
                env_score=random.randint(60, 95),
                transport_score=random.randint(60, 95),
                safety_score=random.randint(60, 95),
                culture_score=random.randint(60, 95),
                industry_score=random.randint(60, 95),
                welfare_score=random.randint(60, 95),
                education_score=random.randint(60, 95)
            )
            db.add(analysis)
        print("Added District Analysis data.")

    # 2. Insights
    existing_insights = db.query(models.DistrictInsight).filter_by(year="2026").first()
    if existing_insights:
         print("Insights for 2026 already exists. Skipping.")
    else:
        # Generic insights for all
        common_insight = models.DistrictInsight(
            year="2026",
            district_code="all",
            category="safety",
            type="info",
            title="야간 보행 안전도 상승",
            description="전반적으로 야간 보행 안전도가 상승했습니다.",
            # importance removed
            severity="low",
            date="2026-01-15",
            proposer="System",
            icon="shield", # Added reasonable defaults
            latitude=35.1795543,
            longitude=129.0756416
        )
        db.add(common_insight)
        
        busanjin = models.DistrictInsight(
            year="2026",
            district_code="21050", 
            category="transport",
            type="info",
            title="서면 교차로 교통 개선",
            description="서면 교차로 주변 교통 혼잡이 개선되고 있습니다.",
            # importance removed
            severity="medium",
            date="2026-02-20",
            proposer="Traffic Dept",
            icon="car",
            latitude=35.1544,
            longitude=129.0604
        )
        db.add(busanjin)
        print("Added District Insights.")

    # 3. Personas
    existing_personas = db.query(models.Persona).filter_by(year="2026").first()
    if existing_personas:
        print("Personas for 2026 already exists. Skipping.")
    else:
        # Sample Persona 1
        p1 = models.Persona(
            year="2026",
            district_code="21050",
            name="김영희",
            age=72,
            gender="female",
            job="은퇴자",
            tags=json.dumps(["#산책", "#공원", "#안전"]),
            quote="공원 산책을 즐기는 어르신",
            full_quote="매일 아침 시민공원을 산책하며 하루를 시작합니다. 공원 주변 보행로가 정비되어 걷기 편해졌지만, 야간 조명은 아직 부족하다고 느낍니다.",
            pain_points=json.dumps(["야간 조명 부족", "벤치 부족"]),
            suggestions=json.dumps(["공원 조명 추가 설치", "쉼터 확충"]),
            expected_effects=json.dumps(["야간 산책 안전 확보", "노인 여가 활동 증진"]),
            image_url="/assets/personas/grandma.png",
            image_emoji="👵",
            stats=json.dumps({"health": 80, "social": 60})
        )
        db.add(p1)
        
        # Sample Persona 2
        p2 = models.Persona(
            year="2026",
            district_code="21090",
            name="박지성",
            age=34,
            gender="male",
            job="직장인",
            tags=json.dumps(["#출퇴근", "#지하철", "#편의성"]),
            quote="지하철로 출퇴근하는 직장인",
            full_quote="해운대에서 센텀시티로 출퇴근합니다. 지하철역 접근성은 좋으나 환승 구간이 복잡합니다.",
            pain_points=json.dumps(["복잡한 환승 동선", "출퇴근 시간 혼잡"]),
            suggestions=json.dumps(["환승 유도선 개선", "배차 간격 조정"]),
            expected_effects=json.dumps(["이동 시간 단축", "대중교통 이용 만족도 향상"]),
            image_url="/assets/personas/worker.png",
            image_emoji="👨‍💼",
            stats=json.dumps({"mobility": 90, "stress": 40})
        )
        db.add(p2)
        print("Added Personas.")

    db.commit()
    print("Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_data()
