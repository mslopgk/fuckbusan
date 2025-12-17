from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Use the same URL as database.py
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

tables = ["district_analysis", "district_insights", "personas"]
years = ["2024", "2025", "2026"]

print("=== DB Check Report ===")
try:
    for table in tables:
        print(f"\nTable: {table}")
        # Check total count
        try:
            total = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"  Total Rows: {total}")
            
            # Check by year
            for year in years:
                count = db.execute(text(f"SELECT COUNT(*) FROM {table} WHERE year = '{year}'")).scalar()
                print(f"  Rows for {year}: {count}")
        except Exception as e:
            print(f"  Error reading table {table}: {e}")

finally:
    db.close()
