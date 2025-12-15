import sys
import os

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from database import SessionLocal
import models

def analyze_busan_station():
    db = SessionLocal()
    try:
        entries = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%[부산역]%')).all()
        print(f"Total Entries: {len(entries)}")
        
        coords = set()
        coord_list = []
        for e in entries:
            coords.add((round(e.latitude, 5), round(e.longitude, 5)))
            coord_list.append((e.latitude, e.longitude))
            
        print(f"Unique Coordinates (rounded): {len(coords)}")
        print("Sample Unique Coords:")
        for c in list(coords)[:5]:
            print(c)
            
        # Check if they are generally in Seomyeon (35.15+, 129.05+)
        seomyeon_count = sum(1 for lat, lng in coord_list if lat > 35.14)
        print(f"Entries north of 35.14 (likely Seomyeon): {seomyeon_count}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    analyze_busan_station()
