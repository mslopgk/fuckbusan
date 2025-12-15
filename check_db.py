import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for simplicity as configured in project (or MySQL if env set)
DATABASE_URL = "sqlite:///./test.db" # Default fallback
if os.getenv("USE_MYSQL") == "True":
    pass # Assume environment has it, but for now checking SQLite test.db or just creating session

# Actually, let's just use the logic from backend/database.py if possible, 
# but for a quick check, I'll assume sqlite:///./test.db is the active one 
# or try to import from backend.database

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from database import SessionLocal

def check_data():
    db = SessionLocal()
    keywords = ["서면", "부산역", "범일초등학교"]
    
    print("Checking for keywords:", keywords)
    
    try:
        # Assuming table is 'insights' based on MapCanvas.jsx logic (it consumes 'insights')
        # Check 'title', 'content', 'address' columns if they exist
        # First, let's see what tables exist or just try an opportunistic query
        
        # Checking 'insights' table
        result = db.execute(text("SELECT id, title, address FROM insights WHERE title LIKE :k1 OR title LIKE :k2 OR title LIKE :k3 OR address LIKE :k1 OR address LIKE :k2 OR address LIKE :k3"), 
                            {"k1": f"%{keywords[0]}%", "k2": f"%{keywords[1]}%", "k3": f"%{keywords[2]}%"})
        
        rows = result.fetchall()
        if rows:
            print(f"Found {len(rows)} matching records:")
            for row in rows:
                print(row)
        else:
            print("No matching records found in 'insights'.")
            
    except Exception as e:
        print("Error checking DB:", e)
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
