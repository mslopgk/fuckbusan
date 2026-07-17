import pandas as pd
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add backend to path to import database session
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
try:
    from database import SessionLocal
except ImportError:
    print("Could not import SessionLocal from backend.database")
    SessionLocal = None

def import_excel():
    file_path = './busan_data/데이터리스트(대시보드, 공공데이터).xlsx'
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        # Load Excel
        print("Loading Excel file...")
        df = pd.read_excel(file_path, sheet_name=0) # Read first sheet
        
        # Check columns
        print("Columns:", df.columns.tolist())
        
        # Keywords to look for
        keywords = ["서면", "부산역", "범일초등학교"]
        
        # Search for these keywords in any text column
        found_records = []
        
        for index, row in df.iterrows():
            row_str = str(row.values)
            for k in keywords:
                if k in row_str:
                    found_records.append(row)
                    break
        
        print(f"Found {len(found_records)} matching records in Excel.")
        
        if len(found_records) > 0 and SessionLocal:
            db = SessionLocal()
            print("Checking if records already exist in DB...")
            
            for row in found_records:
                # Map columns (Adjust based on actual Excel headers)
                # Assumed structure: Title, Content, Address, Latitude, Longitude, etc.
                # Use 'Title' or similar for uniqueness check
                title = row.get('제목', row.get('title', 'Unknown Title'))
                
                # Check exist
                exists = db.execute(text("SELECT id FROM insights WHERE title = :title"), {"title": title}).fetchone()
                
                if not exists:
                    print(f"Inserting: {title}")
                    # Construct Insert
                    # This requires knowing the exact schema of 'insights' table and excel columns mapping
                    # For now, I'll print the row data so I (the agent) can see the structure and write a proper insert query
                    print(row.to_dict())
                else:
                    print(f"Skipping existing: {title}")
            
            db.close()
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import_excel()
