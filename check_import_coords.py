import sys
import os

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from database import SessionLocal
import models

def check_coords():
    db = SessionLocal()
    try:
        # Check Busan Station
        results = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%[부산역]%')).limit(10).all()
        print(f"Checking 10 random Busan Station entries:")
        for r in results:
            print(f"Title: {r.title} | Lat: {r.latitude}, Lng: {r.longitude} | Code: {r.district_code}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_coords()
