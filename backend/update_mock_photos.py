import sys
import os
import json

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal
import models

def main():
    db = SessionLocal()
    try:
        # Match titles from insert_mock_proposals.py
        p1 = db.query(models.NewProposal).filter(models.NewProposal.title.like("%전봇대%")).first()
        p2 = db.query(models.NewProposal).filter(models.NewProposal.title.like("%쓰레기통%")).first()
        p3 = db.query(models.NewProposal).filter(models.NewProposal.title.like("%쉘터%")).first()

        updates = 0
        if p1:
            p1.files = json.dumps(["/assets/proposal_1.png"])
            updates += 1
        if p2:
            p2.files = json.dumps(["/assets/proposal_2.png"])
            updates += 1
        if p3:
            p3.files = json.dumps(["/assets/proposal_3.png"])
            updates += 1

        # Fallback for the 4th if there's any other mock
        others = db.query(models.NewProposal).filter(~models.NewProposal.title.like("%전봇대%"), ~models.NewProposal.title.like("%쓰레기통%"), ~models.NewProposal.title.like("%쉘터%")).all()
        for o in others:
            if not o.files or o.files == '[]' or 'svg' in o.files:
                o.files = json.dumps(["/assets/proposal_1.png"])
                updates += 1

        db.commit()
        print(f"Successfully updated image files for {updates} mock proposals.")
    except Exception as e:
        db.rollback()
        print(f"Error updating: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
