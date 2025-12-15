import sys
import os
import json
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
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Cleaner: Remove existing bad data to avoid duplicates/confusion
    print("Removing old entries...")
    db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%부산역%')).delete(synchronize_session=False)
    db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%범일초등학교%')).delete(synchronize_session=False)
    db.commit()

    # 2. Insert Correct Data
    items = [
        {
            "district_code": "21020", # Dong-gu
            "title": "부산역 광장 노숙인 및 치안 문제",
            "category": "plaza", # Matches MENU_ITEMS
            "severity": "high",
            "latitude": 35.115225,
            "longitude": 129.042243,
            "content": "부산역 광장 내 노숙인 문제와 야간 치안 불안으로 인한 시민 불편 호소.",
            "proposer": "김철수",
            "image_url": "https://images.unsplash.com/photo-1596423737523-286c4f09f067?q=80&w=600&auto=format&fit=crop" # Plaza/Station image
        },
        {
            "district_code": "21020", # Dong-gu (Beomil-dong is in Dong-gu mostly, checking school location)
            # Beomil Elementary is actually in Dong-gu. 
            "title": "범일초등학교 통학로 안전 펜스 파손",
            "category": "sidewalk", # Matches MENU_ITEMS
            "severity": "medium",
            "latitude": 35.1388, 
            "longitude": 129.0598,
            "content": "범일초등학교 정문 앞 보도 펜스가 파손되어 아이들이 차도로 튀어나올 위험이 있음.",
            "proposer": "이영희",
            "image_url": "https://images.unsplash.com/photo-1574357278720-d80d195f2692?q=80&w=600&auto=format&fit=crop" # Sidewalk/School image
        }
    ]

    print("Inserting new entries...")
    for item in items:
        new_insight = models.DistrictInsight(
            district_code=item['district_code'],
            year="2026", # Added
            type="warning", # Added default
            title=item['title'],
            description=item['content'], # Changed from content
            category=item['category'],
            severity=item['severity'],
            latitude=item['latitude'],
            longitude=item['longitude'],
            date=datetime.now().strftime("%Y-%m-%d"),
            proposer=item['proposer'],
            image_url=item['image_url'],
            icon="map-pin" # Added default
        )
        db.add(new_insight)
    
    db.commit()
    print("Success: Corrected 부산역 and 범일초등학교 data.")
    db.close()

if __name__ == "__main__":
    seed()
