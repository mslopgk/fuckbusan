import sys
import os
import random

# Add backend to path CORRECTLY
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from database import SessionLocal
import models

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
            # Update coordinate only if it's far off (e.g. Seomyeon area > 35.14)
            if e.latitude > 35.14:
                # Add small jitter
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
