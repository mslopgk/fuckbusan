import sys
import os
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from database import SessionLocal

def drop():
    db = SessionLocal()
    try:
        db.execute(text("DROP TABLE IF EXISTS personas"))
        db.commit()
        print("Dropped personas table.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    drop()
