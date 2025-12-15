import sys
import os
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from database import SessionLocal

def patch():
    db = SessionLocal()
    try:
        # Dong-gu Fix
        db.execute(text("UPDATE district_insights SET district_code = '21020' WHERE title IN ('부산역 광장 노숙인 문제', '범일초등학교 통학로 안전')"))
        # Busanjin-gu Fix
        db.execute(text("UPDATE district_insights SET district_code = '21050' WHERE title = '서면역 혼잡 구간'"))
        
        db.commit()
        print("Patched district codes.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    patch()
