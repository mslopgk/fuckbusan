import sys
import os

# Add backend to path ensuring we can import database and models
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from database import SessionLocal
import models

def verify():
    db = SessionLocal()
    try:
        print("--- Verification Results ---")
        # Check Busan Station
        busan_station = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%[부산역]%')).all()
        print(f"Busan Station ([부산역]) entries: {len(busan_station)}")
        if busan_station:
            print(f"Sample: {busan_station[0].title} | Code: {busan_station[0].district_code}")

        # Check Beomil Elementary School
        beomil = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%범일%')).all()
        print(f"Beomil ([범일]) entries: {len(beomil)}")
        if beomil:
            print(f"Sample: {beomil[0].title} | Code: {beomil[0].district_code}")
            
        # Check general district distribution for Dong-gu (21030)
        dong_gu = db.query(models.DistrictInsight).filter(models.DistrictInsight.district_code == '21030').count()
        print(f"Total entries for Dong-gu (21030): {dong_gu}")
        
    except Exception as e:
        print(f"Verification Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
