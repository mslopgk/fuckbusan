import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal
import models

def main():
    db = SessionLocal()
    try:
        proposals = db.query(models.NewProposal).all()
        count = len(proposals)
        for p in proposals:
            p.user_id = 211
        db.commit()
        print(f"Successfully updated {count} proposals to user_id 211.")
    except Exception as e:
        db.rollback()
        print(f"Error updating: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
