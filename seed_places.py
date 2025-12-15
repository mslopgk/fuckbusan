import sys
import os
from sqlalchemy import text
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
try:
    from database import SessionLocal
except ImportError:
    print("Error importing SessionLocal")
    sys.exit(1)

def seed():
    db = SessionLocal()
    
    # 1. Seomyeon (Commercial/Traffic)
    # 2. Busan Station (Transport/Crowd)
    # 3. Beomil Elementary (School Zone/Safety)
    
    seeds = [
        {
            "title": "서면역 혼잡 구간",
            "content": "유동인구가 많은 서면역 주변 보행 환경 개선이 시급합니다.",
            "category": "safety", 
            "category_db": "diagnosis",
            "district_code": "21050", # Busanjin-gu (Frontend Code)
            "address": "부산광역시 부산진구 서면로 68",
            "latitude": 35.1578,
            "longitude": 129.0593,
            "severity": "high",
            "proposer": "김철수",
            "image_url": "https://images.unsplash.com/photo-1555400038-19eb7db6b6b7?auto=format&fit=crop&q=80&w=300&h=200",
            "date": datetime.now()
        },
        {
            "title": "부산역 광장 노숙인 문제",
            "content": "부산역 광장 주변 환경 정비 및 노숙인 지원 대책이 필요합니다.",
            "category_db": "survey",
            "district_code": "21020", # Dong-gu (Frontend Code)
            "address": "부산광역시 동구 중앙대로 206",
            "latitude": 35.1152,
            "longitude": 129.0422,
            "severity": "medium",
            "proposer": "박영희",
            "image_url": "https://images.unsplash.com/photo-1617182239335-51f672322426?auto=format&fit=crop&q=80&w=300&h=200",
            "date": datetime.now()
        },
        {
            "title": "범일초등학교 통학로 안전",
            "content": "범일초등학교 앞 횡단보도 신호등 설치 및 과속 방지턱 보강.",
            "category_db": "diagnosis",
            "district_code": "21020", # Dong-gu (Frontend Code)
            "address": "부산광역시 동구 범일동 123", # Mock detailed addr
            "latitude": 35.1388, # Approx
            "longitude": 129.0598, # Approx
            "severity": "high",
            "proposer": "이민수",
            "image_url": "https://images.unsplash.com/photo-1585671756209-44cb362624ac?auto=format&fit=crop&q=80&w=300&h=200",
            "date": datetime.now()
        }
    ]
    
    print("Seeding data...")
    try:
        for item in seeds:
            # Check if exists
            exists = db.execute(text("SELECT id FROM district_insights WHERE title = :title"), {"title": item["title"]}).fetchone()
            if not exists:
                print(f"Inserting {item['title']}")
                
                query = text("""
                    INSERT INTO district_insights (title, description, category, district_code, year, type, latitude, longitude, severity, proposer, image_url, date)
                    VALUES (:title, :content, :category, :district_code, :year, 'danger', :lat, :lng, :severity, :proposer, :img, :date)
                """)
                db.execute(query, {
                    "title": item["title"],
                    "content": item["content"],
                    "category": item["category_db"], 
                    "district_code": item["district_code"], 
                    "year": "2026",
                    "lat": item["latitude"],
                    "lng": item["longitude"],
                    "severity": item["severity"],
                    "proposer": item["proposer"],
                    "img": item["image_url"],
                    "date": datetime.now().strftime("%Y-%m-%d")
                })

            else:
                print(f"Skipping {item['title']} (Exists)")
        
        db.commit()
        print("Success!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
