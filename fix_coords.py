from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys
import os
import random

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def fix_busan_station_coords():
    db = SessionLocal()
    try:
        # Busan Station Approx Center
        BASE_LAT = 35.115
        BASE_LNG = 129.042
        
        entries = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%[부산역]%')).all()
        print(f"Found {len(entries)} entries to update.")
        
        count = 0
        for e in entries:
            # Add small jitter to avoid perfect stacking, keeping it around Busan Station
            e.latitude = BASE_LAT + random.uniform(-0.002, 0.002)
            e.longitude = BASE_LNG + random.uniform(-0.002, 0.002)
            count += 1
            
        db.commit()
        print(f"Updated {count} entries with correct Busan Station coordinates.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_busan_station_coords()
