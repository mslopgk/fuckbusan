import sys
import os
import json
from sqlalchemy import text
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import SessionLocal, engine
    import models
except ImportError:
    print("Error importing SessionLocal/models")
    sys.exit(1)

def seed():
    # Ensure tables exist (Re-create if dropped)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Personas with Local Images
    personas = [
        {
            "id": 1,
            "name": '김철수',
            "age": 72,
            "gender": '남성',
            "job": '은퇴 (전 자영업)',
            "district_code": '21050', # Busanjin-gu
            "year": '2026',
            "image_emoji": '👴',
            "image_url": '/assets/personas/persona_70m.png',
            "tags": ['산책', '안전', '공원'],
            "pain_points": ['경사로 보행 불편', '가로등 부족'],
            "stats": { "suggestion": 5, "report": 3, "diagnosis": 8 },
            "quote": '저녁에 공원 나갈 때마다 어두워서 발목을 삐끗할 뻔했어. 가로등 좀 더 밝게 안 되나?',
            "full_quote": '저녁에 공원 나갈 때마다 어두워서 발목을 삐끗할 뻔했어. 가로등 좀 더 밝게 안 되나?',
            "suggestions": ['가로등 조도 개선 요청', '경사로 핸드레일 설치'],
            "expected_effects": ['야간 보행 안전성 50% 향상', '노인 낙상 사고 예방']
        },
        {
            "id": 2,
            "name": '이영희',
            "age": 28,
            "gender": '여성',
            "job": '디자이너',
            "district_code": '21090', # Haeundae-gu
            "year": '2026',
            "image_emoji": '👩‍🎨',
            "image_url": '/assets/personas/persona_20f.png',
            "tags": ['문화', '출퇴근', '대중교통'],
            "pain_points": ['버스 배차 간격', '문화 시설 부족'],
            "stats": { "suggestion": 12, "report": 2, "diagnosis": 5 },
            "quote": '센텀 쪽 출퇴근 버스가 너무 꽉 차서 힘들어요. 아침마다 전쟁이라니까요.',
            "full_quote": '센텀 쪽 출퇴근 버스가 너무 꽉 차서 힘들어요. 아침마다 전쟁이라니까요.',
             "suggestions": ['출퇴근 시간대 버스 증차', '문화센터 프로그램 다양화'],
            "expected_effects": ['출퇴근 소요 시간 10분 단축', '주민 문화 만족도 증가']
        },
        {
            "id": 3,
            "name": '최민지',
            "age": 42,
            "gender": '여성',
            "job": '주부',
            "district_code": '21110', # Geumjeong-gu
            "year": '2026',
            "image_emoji": '👩',
            "image_url": '/assets/personas/persona_40f.png',
            "tags": ['학교', '장보기', '생활안전'],
            "pain_points": ['스쿨존 과속', '보도블럭 파손'],
            "stats": { "suggestion": 8, "report": 4, "diagnosis": 2 },
            "quote": '아이 학교 앞 횡단보도에서 차들이 너무 쌩쌩 달려요. 무서워요!',
            "full_quote": '아이 학교 앞 횡단보도에서 차들이 너무 쌩쌩 달려요. 무서워요!',
             "suggestions": ['스쿨존 과속 단속 카메라 설치', '보도블럭 전면 교체'],
            "expected_effects": ['어린이 교통사고 제로화', '보행 환경 개선']
        }
    ]
    
    print("Seeding Personas...")
    try:
        count = 0
        deleted = db.query(models.Persona).delete()
        print(f"Deleted {deleted} old personas.")
        
        for item in personas:
            new_record = models.Persona(
                district_code=item['district_code'],
                year="2026",
                name=item['name'],
                age=item['age'],
                gender=item['gender'],
                job=item['job'],
                image_emoji=item['image_emoji'],
                image_url=item['image_url'],
                quote=item['quote'],
                full_quote=item['full_quote'],
                # SQLAlchemy handles dict to JSON automatically if correctly typed, 
                # but models.py uses CheckConstraint/String usually in SQLite.
                # Assuming models.py uses JSON type (or MutableDict).
                # Safe approach: pass python objects, let SQLAlchemy/Driver handle it.
                tags=item['tags'],
                pain_points=item['pain_points'],
                stats=item['stats'],
                suggestions=item['suggestions'],
                expected_effects=item['expected_effects']
            )

            db.add(new_record)
            count += 1
        
        db.commit()
        print(f"Success! Added {count} personas.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
