from database import SessionLocal, engine
import models
import random
import json

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

DISTRICTS = {
    '21310': '기장군', '21150': '사상구', '21140': '수영구', '21130': '연제구',
    '21120': '강서구', '21110': '금정구', '21100': '사하구', '21090': '해운대구',
    '21080': '북구', '21070': '남구', '21060': '동래구', '21050': '부산진구',
    '21040': '영도구', '21030': '서구', '21020': '동구', '21010': '중구'
}

YEARS = ['2024', '2025', '2026']

def seed_data():
    db = SessionLocal()
    
    # 1. Clear existing data
    print("Clearing existing data...")
    db.query(models.DistrictAnalysis).delete()
    db.query(models.DistrictInsight).delete()
    db.query(models.Persona).delete()
    db.commit()

    print("Seeding new data...")
    
    for year in YEARS:
        for code, name in DISTRICTS.items():
            # --- Analysis Data ---
            # Random scores 50~90
            analysis = models.DistrictAnalysis(
                district_code=code,
                year=year,
                housing_score=random.uniform(50, 95),
                env_score=random.uniform(50, 95),
                transport_score=random.uniform(40, 90),
                safety_score=random.uniform(60, 98),
                culture_score=random.uniform(40, 85),
                industry_score=random.uniform(30, 80),
                welfare_score=random.uniform(50, 90),
                education_score=random.uniform(60, 95)
            )
            db.add(analysis)

            # --- Insights ---
            # 10 random insights per district
            for i in range(10):
                type_ = random.choice(['danger', 'warning', 'info'])
                insight = models.DistrictInsight(
                    district_code=code,
                    year=year,
                    type=type_,
                    title=f"[{type_.upper()}] {name} 주요 이슈 #{i+1}",
                    description=f"{year}년도 {name} 데이터 분석 결과, 시민들의 안전 신고가 급증하고 있습니다.",
                    icon=type_
                )
                db.add(insight)

            # --- Personas ---
            # 15 random personas per district
            archetypes = [
                {
                    "job": "대학생", "age_range": (20, 29), "emoji": "🧑‍🎓", 
                    "quote": "밤길이 너무 어두워서 무서워요.",
                    "tags": ["#대학생", "#야간보행", "#안전"],
                    "pain_points": ["가로등 부족", "CCTV 사각지대"],
                    "suggestions": ["스마트 가로등 설치", "안심 귀갓길 조성"]
                },
                {
                    "job": "주부", "age_range": (30, 49), "emoji": "👩‍🦱", 
                    "quote": "아이들 통학로가 위험해요.",
                    "tags": ["#학부모", "#통학로", "#교통안전"],
                    "pain_points": ["불법주정차", "보도블럭 파손"],
                    "suggestions": ["어린이보호구역 강화", "보행로 정비"]
                },
                {
                    "job": "어르신", "age_range": (65, 80), "emoji": "👴", 
                    "quote": "경사로가 가파라서 다니기 힘들어요.",
                    "tags": ["#실버세대", "#보행약자", "#편의시설"],
                    "pain_points": ["급경사 계단", "벤치 부족"],
                    "suggestions": ["핸드레일 설치", "쉼터 조성"]
                },
                {
                    "job": "자영업자", "age_range": (40, 60), "emoji": "🏪", 
                    "quote": "가게 앞 쓰레기 무단투기가 심각해요.",
                    "tags": ["#소상공인", "#환경", "#청결"],
                    "pain_points": ["무단투기", "악취"],
                    "suggestions": ["CCTV 설치", "분리수거함 확충"]
                },
                {
                    "job": "직장인", "age_range": (25, 45), "emoji": "💼",
                    "quote": "출퇴근길 건널목 신호가 너무 짧아요.",
                    "tags": ["#출퇴근", "#교통", "#보행환경"],
                    "pain_points": ["신호주기 짧음", "무단횡단"],
                    "suggestions": ["스마트 횡단보도 도입", "신호 체계 개선"]
                },
                {
                    "job": "관광객", "age_range": (20, 40), "emoji": "📸",
                    "quote": "안내 표지판이 잘 안 보여서 길 찾기가 어려워요.",
                    "tags": ["#관광", "#길찾기", "#안내체계"],
                    "pain_points": ["표지판 노후화", "외국어 안내 부족"],
                    "suggestions": ["다국어 정비", "웨이파인딩 시스템"]
                },
                {
                    "job": "초등학생", "age_range": (8, 13), "emoji": "🎒",
                    "quote": "학교 가는 길에 큰 차들이 쌩쌩 달려서 무서워요.",
                    "tags": ["#아동", "#스쿨존", "#안전"],
                    "pain_points": ["과속 차량", "안전펜스 미비"],
                    "suggestions": ["안전펜스 설치", "과속단속 카메라"]
                },
                {
                    "job": "휠체어 사용자", "age_range": (20, 60), "emoji": "🧑‍🦽",
                    "quote": "보도 턱이 높아서 이동하기 불편합니다.",
                    "tags": ["#장애인", "#무장애", "#접근성"],
                    "pain_points": ["높은 턱", "좁은 보도"],
                    "suggestions": ["경사로 설치", "보도폭 확장"]
                }
            ]
            
            for _ in range(15):
                arch = random.choice(archetypes)
                persona = models.Persona(
                    district_code=code,
                    year=year,
                    name=f"김{random.choice(['철수', '영희', '민수', '지은', '준호', '서연', '하준', '지우', '성민', '예진'])}",
                    age=random.randint(*arch['age_range']),
                    gender=random.choice(['남성', '여성']),
                    job=arch['job'],
                    image_emoji=arch['emoji'],
                    quote=arch['quote'],
                    full_quote=f"저는 {name}에 사는 {arch['job']}입니다. {arch['quote']} 우리 동네가 더 안전해졌으면 좋겠어요.",
                    tags=json.dumps(arch['tags']),
                    pain_points=arch['pain_points'], # SQLAlchemy JSON type handles list automatically
                    suggestions=arch['suggestions'],
                    expected_effects=["주민 만족도 상승", "안전사고 감소", "도시 미관 개선", "지역 경제 활성화"],
                    stats={"suggestion": random.randint(10, 100), "report": random.randint(5, 50)}
                )
                db.add(persona)

    db.commit()
    print("Seeding completed!")
    db.close()

if __name__ == "__main__":
    seed_data()
