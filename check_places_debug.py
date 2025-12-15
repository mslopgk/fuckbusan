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

def check():
    db = SessionLocal()
    try:
        results = db.query(models.DistrictInsight).all()
        print(f"Total Insights: {len(results)}")
        
        found_busan_station = False
        found_beomil = False
        
        for r in results:
            if '부산역' in r.title:
                found_busan_station = True
                print(f"FOUND: {r.title} (Lat: {r.latitude}, Lng: {r.longitude}, Code: {r.district_code})")
            if '범일초' in r.title:
                found_beomil = True
                print(f"FOUND: {r.title} (Lat: {r.latitude}, Lng: {r.longitude}, Code: {r.district_code})")
                
        if not found_busan_station:
            print("MISSING: Busan Station")
        if not found_beomil:
            print("MISSING: Beomil Elementary")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
