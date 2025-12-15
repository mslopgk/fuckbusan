import sys
import os
from sqlalchemy import text

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
    keywords = ['부산역', '범일초등학교', '범일초']
    
    print(f"Checking for keywords: {keywords}")
    
    found_any = False
    for kw in keywords:
        results = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like(f'%{kw}%')).all()
        if results:
            found_any = True
            print(f"\n[Term: {kw}] Found {len(results)} items:")
            for item in results:
                print(f" - ID: {item.id}")
                print(f"   Title: {item.title}")
                print(f"   Category: {item.category}")
                print(f"   District: {item.district_code}")
                print(f"   Coords: {item.latitude}, {item.longitude}")
        else:
            print(f"\n[Term: {kw}] No items found.")

    if not found_any:
        print("\nCRITICIAL: None of the requested locations exist in the DB.")
    
    db.close()

if __name__ == "__main__":
    check()
