import sys
import os
from sqlalchemy import text
from database import engine

def verify_connection():
    print("Verifying database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Connection successful! Result: {result.scalar()}")
        return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    if verify_connection():
        sys.exit(0)
    else:
        sys.exit(1)
