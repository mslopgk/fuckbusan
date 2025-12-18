from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import ChecklistResult

# Use the same URL as database.py
SQLALCHEMY_DATABASE_URL = "sqlite:///backend/sql_app_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("=== Checklist Results Check ===")
try:
    results = db.query(ChecklistResult).all()
    if results:
        # Sort by ID desc
        sorted_results = sorted(results, key=lambda r: r.result_id, reverse=True)
        print(f"Total Results: {len(results)}")
        print("--- Top 5 Recent Results ---")
        for r in sorted_results[:5]:
             print(f"ID: {r.result_id} | Type: {r.district_code} | Pos: ({r.위도}, {r.경도}) | Addr: {r.진단지역}")
    else:
        print("No results found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
