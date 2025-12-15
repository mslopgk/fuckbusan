import sys
import os

# Add backend to path CORRECTLY
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from sqlalchemy import func
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def remove_duplicates():
    db = SessionLocal()
    try:
        # 1. Identify IDs to keep (min ID for each group)
        # Groups based on Title, Description, Date (and district/coords to be safe)
        subquery = db.query(
            func.min(models.DistrictInsight.id).label('min_id')
        ).group_by(
            models.DistrictInsight.title,
            models.DistrictInsight.description,
            models.DistrictInsight.date,
            models.DistrictInsight.district_code 
        )
        
        ids_to_keep = [row.min_id for row in subquery.all()]
        unique_count = len(ids_to_keep)
        print(f"Keeping {unique_count} unique records.")
        
        if not ids_to_keep:
            print("No records found.")
            return

        # 2. Delete all others
        # Using a slightly different approach for mass deletion efficiency if needed, 
        # but standard IN clause is fine for ~1500 records.
        
        total_records = db.query(models.DistrictInsight).count()
        duplicates_count = total_records - unique_count
        
        if duplicates_count > 0:
            stmt = models.DistrictInsight.__table__.delete().where(
                models.DistrictInsight.id.notin_(ids_to_keep)
            )
            result = db.execute(stmt)
            db.commit()
            print(f"Deleted {result.rowcount} duplicate records.")
        else:
            print("No duplicates found.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_duplicates()
