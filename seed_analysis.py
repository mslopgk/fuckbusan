import sys
import os
from sqlalchemy import text
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import SessionLocal
    import models
except ImportError:
    print("Error importing SessionLocal/models")
    sys.exit(1)

def seed():
    db = SessionLocal()
    
    # Mock Data from api.js (mapped to DB columns)
    data = [
        { "code": '21310', "housing": 75, "env": 82, "transport": 65, "safety": 88, "culture": 70, "welfare": 72 }, # 기장군
        { "code": '21150', "housing": 65, "env": 70, "transport": 60, "safety": 75, "culture": 60, "welfare": 68 }, # 사상구
        { "code": '21140', "housing": 80, "env": 85, "transport": 75, "safety": 90, "culture": 85, "welfare": 80 }, # 수영구
        { "code": '21130', "housing": 78, "env": 80, "transport": 72, "safety": 85, "culture": 78, "welfare": 75 }, # 연제구
        { "code": '21120', "housing": 72, "env": 78, "transport": 68, "safety": 82, "culture": 70, "welfare": 72 }, # 강서구
        { "code": '21110', "housing": 76, "env": 82, "transport": 74, "safety": 86, "culture": 75, "welfare": 78 }, # 금정구
        { "code": '21100', "housing": 68, "env": 72, "transport": 65, "safety": 78, "culture": 65, "welfare": 70 }, # 사하구
        { "code": '21090', "housing": 85, "env": 88, "transport": 80, "safety": 92, "culture": 90, "welfare": 85 }, # 해운대구
        { "code": '21080', "housing": 70, "env": 75, "transport": 68, "safety": 80, "culture": 68, "welfare": 72 }, # 북구
        { "code": '21070', "housing": 75, "env": 80, "transport": 72, "safety": 85, "culture": 75, "welfare": 78 }, # 남구
        { "code": '21060', "housing": 82, "env": 84, "transport": 78, "safety": 88, "culture": 82, "welfare": 80 }, # 동래구
        { "code": '21050', "housing": 74, "env": 76, "transport": 85, "safety": 72, "culture": 88, "welfare": 82 }, # 부산진구
        { "code": '21040', "housing": 65, "env": 70, "transport": 62, "safety": 75, "culture": 65, "welfare": 70 }, # 영도구
        { "code": '21030', "housing": 68, "env": 72, "transport": 60, "safety": 76, "culture": 70, "welfare": 74 }, # 서구
        { "code": '21020', "housing": 70, "env": 74, "transport": 80, "safety": 72, "culture": 72, "welfare": 76 }, # 동구
        { "code": '21010', "housing": 72, "env": 76, "transport": 75, "safety": 80, "culture": 85, "welfare": 78 }, # 중구
    ]
    
    print("Seeding Analysis Data...")
    try:
        count = 0
        for item in data:
            # Check existence
            exists = db.query(models.DistrictAnalysis).filter_by(district_code=item['code'], year="2026").first()
            if not exists:
                new_record = models.DistrictAnalysis(
                    district_code=item['code'],
                    year="2026",
                    housing_score=item['housing'],
                    env_score=item['env'],
                    transport_score=item['transport'],
                    safety_score=item['safety'],
                    culture_score=item['culture'],
                    welfare_score=item['welfare'],
                    industry_score=70.0, # Default
                    education_score=75.0 # Default
                )
                db.add(new_record)
                count += 1
        
        db.commit()
        print(f"Success! Added {count} records.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
