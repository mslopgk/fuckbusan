import pandas as pd
import os
import sys

# Add backend to path CORRECTLY
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')
sys.path.append(backend_dir)

from database import SessionLocal
import models

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")

def investigate():
    print("=== 1. FILE ANALYSIS ===")
    if os.path.exists(public_path):
        df = pd.read_excel(public_path)
        print(f"Total Rows: {len(df)}")
        
        # Search for Seomyeon
        seomyeon_keywords = ['서면', '전포', '부산진구', '부전']
        mask_seomyeon = df['진단지역'].astype(str).apply(lambda x: any(k in x for k in seomyeon_keywords))
        print(f"Rows matching Seomyeon keywords ({seomyeon_keywords}): {mask_seomyeon.sum()}")
        if mask_seomyeon.sum() > 0:
            print("Sample Seomyeon Location:", df[mask_seomyeon]['진단지역'].iloc[0])

        # Search for any 'Dong-gu' places that are NOT Busan Station
        donggu_keywords = ['동구', '범일', '범천', '좌천', '수정']
        mask_donggu = df['진단지역'].astype(str).apply(lambda x: any(k in x for k in donggu_keywords))
        print(f"Rows matching Dong-gu keywords ({donggu_keywords}): {mask_donggu.sum()}")
        if mask_donggu.sum() > 0:
            print("Sample Dong-gu Locations:", df[mask_donggu]['진단지역'].unique())
            
    else:
        print("Public Excel file not found!")

    print("\n=== 2. DATABASE ANALYSIS ===")
    db = SessionLocal()
    try:
        # Check Seomyeon in DB (exclude Busan Station by title if needed, but Busan Station is forced to 21030 now)
        # Seomyeon is 21050
        seomyeon_entries = db.query(models.DistrictInsight).filter(
            models.DistrictInsight.district_code == '21050'
        ).all()
        print(f"Total Entries for Busanjin-gu/Seomyeon (21050): {len(seomyeon_entries)}")
        
        # Check if they look like Seomyeon data
        if seomyeon_entries:
            print(f"Sample Title: {seomyeon_entries[0].title}")
            coords = [(round(e.latitude,5), round(e.longitude,5)) for e in seomyeon_entries[:5]]
            print(f"Sample Coords: {coords}")
            
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    investigate()
