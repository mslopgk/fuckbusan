import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
file_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")

try:
    df = pd.read_excel(file_path)
    print(f"Columns: {df.columns.tolist()}")
    
    # Check for Busan Station and Beomil Elementary School
    busan_station = df[df['진단지역'].astype(str).str.contains('부산역', na=False)]
    beomil_school = df[df['진단지역'].astype(str).str.contains('범일초', na=False)]
    
    print(f"Rows with '부산역': {len(busan_station)}")
    print(f"Rows with '범일초': {len(beomil_school)}")
    
    if not busan_station.empty:
        print("Sample Busan Station row:", busan_station.iloc[0].to_dict())
    if not beomil_school.empty:
        print("Sample Beomil School row:", beomil_school.iloc[0].to_dict())
        
except Exception as e:
    print(f"Error: {e}")
