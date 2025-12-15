import os
import sys
import pandas as pd
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from datetime import datetime

# Setup absolute path to import models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = r"c:\Users\kang\Desktop\디자인진흥원 v1\busan_data"
FILE_PUBLIC = "2차진단_일반인_251210.xlsx"
FILE_EXPERT = "2차진단_전문가_251210.xlsx"

def import_data():
    print("Initializing Database...")
    # Drop all tables to ensure schema update
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data (Redundant if dropped, but safe)
        print("Clearing existing data...")
        db.query(models.Persona).delete()
        db.query(models.DistrictInsight).delete()
        db.query(models.DistrictAnalysis).delete()
        db.commit()

        # Load Excel Files
        print("Loading Excel files...")
        public_path = os.path.join(BASE_DIR, FILE_PUBLIC)
        if not os.path.exists(public_path):
             print(f"File not found: {public_path}")
             return

        df_public = pd.read_excel(public_path)
        print(f"Loaded {len(df_public)} rows from {FILE_PUBLIC}")

        # Complete List of Busan Districts
        BUSAN_DISTRICTS = [
            {"id": "21010", "name": "중구"}, {"id": "21020", "name": "서구"}, {"id": "21030", "name": "동구"},
            {"id": "21040", "name": "영도구"}, {"id": "21050", "name": "부산진구"}, {"id": "21060", "name": "동래구"},
            {"id": "21070", "name": "남구"}, {"id": "21080", "name": "북구"}, {"id": "21090", "name": "해운대구"},
            {"id": "21100", "name": "사하구"}, {"id": "21110", "name": "금정구"}, {"id": "21120", "name": "강서구"},
            {"id": "21130", "name": "연제구"}, {"id": "21140", "name": "수영구"}, {"id": "21150", "name": "사상구"},
            {"id": "21310", "name": "기장군"}
        ]
        
        # Mapping from common names/places to District ID
        DISTRICT_MAPPING = {d['name']: d['id'] for d in BUSAN_DISTRICTS}
        DISTRICT_MAPPING.update({
            "부산역": "21030", "초량": "21030",
            "서면": "21050", "전포": "21050", "부전": "21050",
            "광안리": "21140", "수영": "21140",
            "해운대": "21090", "센텀": "21090",
            "자갈치": "21010", "남포": "21010",
            "사상": "21150", "덕천": "21080"
        })

        def get_district_code(raw_name):
            if pd.isna(raw_name): return "21050" 
            s = str(raw_name).strip()
            if s in DISTRICT_MAPPING: return DISTRICT_MAPPING[s]
            for name, code in DISTRICT_MAPPING.items():
                if name in s: return code
            return "21050" 

        def correct_district_by_coords(code, lat, lng):
            if pd.isna(lat) or pd.isna(lng): return code
            # If mapped to Dong-gu (21030) but Lat > 35.155 (Deep in Seomyeon), move to Busanjin-gu
            # Beomil is around 35.14~35.15, keeping it in Dong-gu (21030) if possible
            if code == '21030' and lat > 35.155:
                return '21050'
            return code

        # ID example: 'NYJ76300'
        # We need distinct list of users to create Personas
        print("Processing Personas...")
        
        # Group by ID
        users = df_public.groupby('ID').agg({
            '진단지역': 'first',
            '리뷰': lambda x: list(x.dropna()),
            '점수': 'mean',
            '위도': 'mean',
            '경도': 'mean'
        }).reset_index()

        personas = []
        for idx, row in users.iterrows():
            # Generate Persona Attributes
            raw_code = get_district_code(row['진단지역'])
            # Apply Spatial Correction
            district_code = correct_district_by_coords(raw_code, row['위도'], row['경도'])
            
            avg_score = row['점수']
            pain_points = row['리뷰'][:5] # Top 5 reviews
            
            # Synthetic attributes
            age = random.choice([20, 30, 40, 50, 60])
            jobs = ['직장인', '학생', '주부', '자영업자', '프리랜서']
            job = random.choice(jobs)
            name = f"시민 {row['ID'][-4:]}" # Anonymized Name

            persona = models.Persona(
                name=name,
                age=age,
                job=job,
                district_code=str(district_code),
                year="2026", # Target Year
                image_emoji=random.choice(['👩', '👨', '🧑', '👵', '👴']),
                tags=["안전", "보행환경", "조명"], # Default tags
                quote=pain_points[0] if pain_points else "안전한 부산을 원합니다.",
                full_quote=f"저는 {district_code}에 살고 있는데, {pain_points[0] if pain_points else '불편한 점이 많습니다.'}",
                pain_points=pain_points,
                suggestions=["조명 개선", "보도 블록 정비", "CCTV 설치"],
                expected_effects=["보행 안전 확보", "범죄 예방", "도시 미관 개선"],
                stats={"safety_score": int(avg_score * 20), "satisfaction": int(avg_score * 20)}
            )
            db.add(persona)
        
        print(f"Created {len(users)} personas.")

        # Complete List of Busan Districts
        BUSAN_DISTRICTS = [
            {"id": "21010", "name": "중구"}, {"id": "21020", "name": "서구"}, {"id": "21030", "name": "동구"},
            {"id": "21040", "name": "영도구"}, {"id": "21050", "name": "부산진구"}, {"id": "21060", "name": "동래구"},
            {"id": "21070", "name": "남구"}, {"id": "21080", "name": "북구"}, {"id": "21090", "name": "해운대구"},
            {"id": "21100", "name": "사하구"}, {"id": "21110", "name": "금정구"}, {"id": "21120", "name": "강서구"},
            {"id": "21130", "name": "연제구"}, {"id": "21140", "name": "수영구"}, {"id": "21150", "name": "사상구"},
            {"id": "21310", "name": "기장군"}
        ]
        
        # Mapping from common names/places to District ID
        DISTRICT_MAPPING = {d['name']: d['id'] for d in BUSAN_DISTRICTS}
        # Add special cases found in data
        DISTRICT_MAPPING.update({
            "부산역": "21030", # Dong-gu
            "초량": "21030",
            "서면": "21050", # Busanjin-gu
            "전포": "21050",
            "부전": "21050",
            "광안리": "21140", # Suyeong-gu
            "해운대": "21090", # Haeundae-gu
            "센텀": "21090",
            "자갈치": "21010", # Jung-gu
            "남포": "21010",
            "사상": "21150", # Sasang-gu
            "덕천": "21080", # Buk-gu
            "범일초": "21030", # Dong-gu
            "범일": "21030",
        })

        def get_district_code(raw_name):
            if pd.isna(raw_name): return "21050" # Default?
            s = str(raw_name).strip()
            # Direct match
            if s in DISTRICT_MAPPING: return DISTRICT_MAPPING[s]
            # Partial match (e.g. "부산진구 부전동")
            for name, code in DISTRICT_MAPPING.items():
                if name in s:
                    return code
            return "21050" # Default to Busanjin-gu (Center) or known valid if unknown

        def correct_district_by_coords(code, lat, lng):
            # If mapped to Dong-gu (21030) but Lat > 35.14, it's likely Busanjin-gu (Seomyeon)
            # Busan Station: ~35.115, Seomyeon: ~35.157
            if code == '21030' and lat > 35.14:
                return '21050'
            # Add more spatial rules if needed
            return code

        # Helper function to process insights from dataframe
        def process_insights(df, source_type):
            count = 0
            
            for idx, row in df.iterrows():
                # Skip if no coordinates
                if pd.isna(row['위도']) or pd.isna(row['경도']):
                    continue
                    
                # Determine Severity based on Score (Numeric or String)
                score_val = row['점수']
                is_high_severity = False
                
                if isinstance(score_val, (int, float)):
                    if score_val <= 2:
                        is_high_severity = True
                elif isinstance(score_val, str):
                    if "부적합" in score_val:
                        is_high_severity = True
                
                # Correctly map the district code
                raw_district = row['진단지역']
                mapped_code = get_district_code(raw_district)
                # Apply Spatial Correction
                final_code = correct_district_by_coords(mapped_code, float(row['위도']), float(row['경도']))

                # FORCE CORRECTION for key locations
                if '부산역' in str(raw_district):
                    final_code = '21030' # Dong-gu
                elif '범일' in str(raw_district):
                    final_code = '21030' # Dong-gu

                # Enhance Title with Location Name
                loc_name = str(raw_district) if pd.notna(raw_district) else ""
                title_text = f"[{loc_name}] {row['대분류']} - {row['중분류']} 문제"

                insight = models.DistrictInsight(
                    district_code=final_code,
                    year="2026", # Target Year
                    type='issue', # Default
                    title=title_text,
                    description=row['리뷰'] if pd.notna(row['리뷰']) else "내용 없음",
                    image_url=row['이미지경로'] if '이미지경로' in row and pd.notna(row['이미지경로']) else None,
                    severity='High' if is_high_severity else 'Medium',
                    date=str(row['등록일시']) if '등록일시' in row else str(datetime.now()),
                    proposer=f"{'전문가' if source_type == 'diagnosis' else '시민'} {str(row['ID'])[-4:]}",
                    latitude=float(row['위도']),
                    longitude=float(row['경도']),
                    category=source_type # 'survey' or 'diagnosis'
                )
                db.add(insight)
                count += 1
            return count

        # Process Public Insights (Survey)
        print("Processing Public Insights...")
        df_public_insights = df_public.dropna(subset=['리뷰', '이미지경로'])
        public_count = process_insights(df_public_insights, 'survey')
        print(f"Created {public_count} public insights.")

        # Load and Process Expert Insights (Diagnosis)
        print("Loading Expert Excel file...")
        expert_path = os.path.join(BASE_DIR, FILE_EXPERT)
        if os.path.exists(expert_path):
            df_expert = pd.read_excel(expert_path)
            print(f"Loaded {len(df_expert)} rows from {FILE_EXPERT}")
            expert_count = process_insights(df_expert, 'diagnosis')
            print(f"Created {expert_count} expert insights.")
        else:
            print(f"Expert file not found: {expert_path}")

        analysis_data = {}
        # Real data processing (as before)
        district_scores = df_public.groupby(['진단지역', '대분류'])['점수'].mean().reset_index()
        
        # Simple Mapping Strategy
        category_map = {
            '보도 (공공공간)': 'transport_score',
            '위생시설': 'env_score',
            '공공공간': 'culture_score',
            '안내시설': 'welfare_score',
            # Add more if found
        }

        # Mapping for Real Data
        for idx, row in district_scores.iterrows():
            d_code = str(row['진단지역'])
            # Basic mapping if d_code matches district name, optional
            # But the real data has '부산역' which is not a district code. 
            # We map '부산역' to '21030' (Dong-gu) for the sake of the dashboard
            if d_code == '부산역': 
                d_code = '21030'
            elif d_code == '광안리':
                d_code = '21140'
            
            cat = row['대분류']
            score_100 = (row['점수'] / 5.0) * 100
            
            if d_code not in analysis_data:
                analysis_data[d_code] = {}
            if cat in category_map:
                analysis_data[d_code][category_map[cat]] = score_100

        # Augment with Dummy Data for ALL Districts and Years
        YEARS = ['2026', '2025', '2024']
        
        # Approximate centers for map jittering (Lat, Lng) - simplified as offsets from a base valid point or just range
        # Since we don't have exact shapes, we'll just use the expert data points as seeds if available, 
        # or fall back to a rough Busan bounding box jittered. 
        # Better: distinct base coordinates for each district hardcoded to avoid "sea" points.
        DISTRICT_COORDS = {
            "21010": (35.106, 129.032), "21020": (35.097, 129.024), "21030": (35.129, 129.045), # Joong, Seo, Dong
            "21040": (35.091, 129.068), "21050": (35.163, 129.053), "21060": (35.204, 129.083), # Yeongdo, Jin, Dongrae
            "21070": (35.136, 129.084), "21080": (35.197, 128.990), "21090": (35.163, 129.163), # Nam, Buk, Haeundae
            "21100": (35.104, 128.975), "21110": (35.243, 129.092), "21120": (35.212, 128.980), # Saha, Geumjeong, Gangseo
            "21130": (35.176, 129.079), "21140": (35.145, 129.113), "21150": (35.152, 128.991), # Yeonje, Suyeong, Sasang
            "21310": (35.244, 129.222)  # Gijang
        }

        FACILITY_TYPES = ['교통', '공공공간', '위생', '문화', '산업', '안전']

        for year_idx, year in enumerate(YEARS):
            print(f"Generating data for year {year}...")
            
            # Trend modifier: 2026 is baseline, 2025 is slightly lower, 2024 lower
            # To simulate improvement over time
            trend_mod = year_idx * -2.5 # 0 for 2026, -2.5 for 2025, -5.0 for 2024
            
            for dist in BUSAN_DISTRICTS:
                d_code = dist['id']
                d_center = DISTRICT_COORDS.get(d_code, (35.179, 129.075)) # Default Busan Center
                
                # 1. District Analysis
                # If real data exists for 2026 (index 0), use it. Else generate.
                # For 2025/2024, adjust the 2026 score or generate new.
                
                existing_scores = analysis_data.get(d_code, {})
                
                def get_score_for_year(key):
                    base = existing_scores.get(key, random.uniform(65, 85))
                    # Add meaningful jitter + trend
                    # Older years have slightly lower scores to show progress
                    val = base + trend_mod + random.uniform(-2, 2)
                    return max(0, min(100, val))

                analysis = models.DistrictAnalysis(
                    district_code=d_code,
                    year=year,
                    housing_score=get_score_for_year('housing_score'),
                    env_score=get_score_for_year('env_score'),
                    transport_score=get_score_for_year('transport_score'),
                    safety_score=get_score_for_year('safety_score'),
                    culture_score=get_score_for_year('culture_score'),
                    industry_score=get_score_for_year('industry_score'),
                    welfare_score=get_score_for_year('welfare_score'),
                    education_score=get_score_for_year('education_score')
                )
                db.add(analysis)

                # 2. Dummy Personas (5-8 per district per year)
                for i in range(random.randint(5, 8)):
                    p_age = random.choice([20, 30, 40, 50, 60, 70])
                    p_name = f"{dist['name']} 시민 {i+1}"
                    
                    dummy_persona = models.Persona(
                        name=p_name,
                        age=p_age,
                        job=random.choice(['자영업자', '회사원', '학생', '주부', '은퇴자', '프리랜서', '교육자']),
                        district_code=d_code,
                        year=year,
                        image_emoji=random.choice(['👩', '👨', '🧑', '👵', '👴', '👱‍♀️', '👱']),
                        tags=[random.choice(FACILITY_TYPES) for _ in range(random.randint(1, 3))],
                        quote=f"{year}년 {dist['name']}의 변화를 기대합니다.",
                        full_quote=f"저는 {dist['name']}에 {random.randint(1,20)}년째 거주 중입니다. {year}년에는 특히 보행 환경과 야간 안전이 개선되기를 희망합니다.",
                        pain_points=[f"{random.choice(['가로등', '보도블록', 'CCTV', '공원', '버스정류장'])} 개선 필요", "쓰레기 투기 문제"],
                        suggestions=["안심 귀갓길 조성", "문화 시설 확충"],
                        expected_effects=["삶의 질 향상", "안전한 마을 만들기"],
                        stats={"safety_score": int(random.uniform(50, 90)), "satisfaction": int(random.uniform(50, 90))}
                    )
                    db.add(dummy_persona)

                # 3. Dummy Insights / Map Pins (To populate map for all years)
                # Generate 3-5 random insights per district per year
                for i in range(random.randint(3, 5)):
                    # Jitter coordinates around center
                    lat = d_center[0] + random.uniform(-0.015, 0.015)
                    lng = d_center[1] + random.uniform(-0.015, 0.015)
                    
                    cat_type = random.choice(FACILITY_TYPES)
                    source = random.choice(['survey', 'diagnosis'])
                    is_high = random.random() < 0.3 # 30% chance of High severity
                    
                    title = f"[{cat_type}] {dist['name']} {random.choice(['보행 불편', '시설 노후', '안전 우려', '위생 문제', '조명 부족'])}"
                    
                    dummy_insight = models.DistrictInsight(
                        district_code=d_code,
                        year=year,
                        type='issue',
                        title=title,
                        description=f"{year}년 현장 점검 결과, {cat_type} 관련 개선이 시급합니다.",
                        image_url=None, # No image for dummy
                        severity='High' if is_high else 'Medium',
                        date=datetime.now().replace(year=int(year)).strftime("%Y-%m-%d"),
                        proposer=f"{'전문가' if source == 'diagnosis' else '시민'} 패널",
                        latitude=lat,
                        longitude=lng,
                        category=source
                    )
                    db.add(dummy_insight)

        print(f"Created analysis, Personas, and Insights for {len(BUSAN_DISTRICTS)} districts across {len(YEARS)} years.")
        db.commit()
        print("Data Import Completed successfully.")

    except Exception as e:
        import traceback
        with open("import_error.log", "w", encoding="utf-8") as f:
             f.write(traceback.format_exc())
             f.write(f"\nError importing data: {e}")
        print(f"Error importing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_data()
