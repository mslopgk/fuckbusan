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

def check_count():
    db = SessionLocal()
    count = db.query(models.DistrictInsight).count()
    print(f"Total DistrictInsight rows: {count}")
    
    # Check Busan Station specifically
    bs = db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like("%부산역%")).first()
    if bs:
        print(f"Found Busan Station: {bs.title}, {bs.latitude}, {bs.longitude}, {bs.category}")
    else:
        print("Busan Station NOT found.")
        
    db.close()

if __name__ == "__main__":
    check_count()
