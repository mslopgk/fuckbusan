import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
file_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")

df = pd.read_excel(file_path)

busan_station = df[df['진단지역'].astype(str).str.contains('부산역', na=False)]
print(f"Total Busan Station rows: {len(busan_station)}")
print(f"Busan Station with NaN Review: {busan_station['리뷰'].isna().sum()}")
print(f"Busan Station with NaN Image: {busan_station['이미지경로'].isna().sum()}")
print(f"Example Busan Station Image Path: {busan_station['이미지경로'].iloc[0]}")

beomil = df[df['진단지역'].astype(str).str.contains('범일초', na=False)]
print(f"Total Beomil rows: {len(beomil)}")
print(f"Beomil with NaN Review: {beomil['리뷰'].isna().sum()}")
print(f"Beomil with NaN Image: {beomil['이미지경로'].isna().sum()}")
