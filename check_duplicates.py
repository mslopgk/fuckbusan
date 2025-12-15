from sqlalchemy import func
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def check_duplicates():
    db = SessionLocal()
    try:
        # Group by distinctive fields to find duplicates
        # Assuming duplications are identical in title and description and date
        duplicates = db.query(
            models.DistrictInsight.title,
            models.DistrictInsight.description,
            func.count(models.DistrictInsight.id)
        ).group_by(
            models.DistrictInsight.title,
            models.DistrictInsight.description
        ).having(func.count(models.DistrictInsight.id) > 1).all()

        print(f"Found {len(duplicates)} sets of duplicate entries.")
        
        total_dupes = 0
        for title, desc, count in duplicates:
            print(f"Title: {title} | Count: {count}")
            total_dupes += (count - 1)
            
        print(f"Total redundant records to delete: {total_dupes}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_duplicates()
