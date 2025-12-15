import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")
datalist_path = os.path.join(data_dir, "데이터리스트(대시보드, 공공데이터).xlsx")

print("--- Checking Busan Station Coordinates ---")
df_pub = pd.read_excel(public_path)
busan_rows = df_pub[df_pub['진단지역'].astype(str) == '부산역']
print(f"Total Busan Station rows: {len(busan_rows)}")
print(f"NaN Lat/Lng: {busan_rows[['위도', '경도']].isna().any(axis=1).sum()}")
print("Sample Coordinates:")
print(busan_rows[['위도', '경도']].head())
print("Coordinate Stats:")
print(busan_rows[['위도', '경도']].describe())

print("\n--- Checking DataList File for Beomil ---")
if os.path.exists(datalist_path):
    try:
        df_list = pd.read_excel(datalist_path)
        print("Columns:", df_list.columns.tolist())
        # Search for Beomil
        mask = df_list.apply(lambda row: row.astype(str).str.contains('범일').any(), axis=1)
        print(f"Rows with '범일' in DataList: {mask.sum()}")
        if mask.any():
            print(df_list[mask].iloc[0])
    except Exception as e:
        print(f"Error reading DataList: {e}")
else:
    print("DataList file not found.")
