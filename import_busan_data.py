import pandas as pd
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import SessionLocal, engine
    import models
except ImportError:
    print("Error importing SessionLocal/models")
    sys.exit(1)

def import_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    path = os.path.join(r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data", "2차진단_일반인_251210.xlsx")
    print(f"Reading {path}...")
    df = pd.read_excel(path)
    
    # Filter for target locations
    targets = ['부산역', '범일초']
    mask = df['진단지역'].astype(str).apply(lambda x: any(t in x for t in targets))
    target_df = df[mask]
    
    print(f"Found {len(target_df)} rows for targets.")
    
    if len(target_df) == 0:
        print("No target rows found. Checking whole file...")
        # Fallback to check if names are different
        print(df['진단지역'].unique())
        return

    # Clear existing manual entries for these (to avoid duplication with previous correction)
    print("Clearing manual correction entries...")
    db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%부산역%')).delete(synchronize_session=False)
    db.query(models.DistrictInsight).filter(models.DistrictInsight.title.like('%범일초%')).delete(synchronize_session=False)
    db.commit()

    count = 0
    for _, row in target_df.iterrows():
        # Map Category
        cat_raw = str(row['중분류']) if '중분류' in row else ''
        cat_code = 'sidewalk' # default
        
        # Simple mapping heuristic
        if '광장' in cat_raw or '부산역' in str(row['진단지역']):
            cat_code = 'plaza'
        elif '학교' in cat_raw or '범일초' in str(row['진단지역']):
            cat_code = 'sidewalk' # School zone usually implies sidewalk/safety
        
        # Map Severity from Score (assuming 5 point scale or similar)
        # Check '점수' column.
        score = row['점수'] if '점수' in row else 3
        severity = 'medium'
        try:
            score = float(score)
            if score <= 2: severity = 'high'
            elif score >= 4: severity = 'low'
        except:
            pass

        # District Code
        d_code = '21050' # Default
        loc_name = str(row['진단지역'])
        if '부산역' in loc_name: d_code = '21020' # Dong-gu
        if '범일초' in loc_name: d_code = '21020' # Dong-gu
        
        # Image
        # If image path is local, we might need a placeholder or keep it
        img = row['이미지경로'] if '이미지경로' in row else ''
        if pd.isna(img): img = ''
        
        new_item = models.DistrictInsight(
            district_code=d_code,
            year="2026",
            type="info",
            title=f"[{row['진단지역']}] {row.get('질문_기준', '시민 의견')}",
            description=f"{row.get('리뷰', '')} (질문: {row.get('질문_내용', '')})",
            category=cat_code,
            severity=severity,
            latitude=float(row['위도']),
            longitude=float(row['경도']),
            date=str(row.get('등록일시', datetime.now().strftime("%Y-%m-%d"))),
            proposer="시민참여자",
            image_url=img,
            icon="map-pin"
        )
        db.add(new_item)
        count += 1
    
    db.commit()
    print(f"Successfully imported {count} items.")
    db.close()

if __name__ == "__main__":
    import_data()
