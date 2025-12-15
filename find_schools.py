import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")

df = pd.read_excel(public_path)

# Search for '초등'
mask_elem = df.apply(lambda row: row.astype(str).str.contains('초등').any(), axis=1)
elem_rows = df[mask_elem]
print(f"Rows with '초등': {len(elem_rows)}")

if not elem_rows.empty:
    print("Sample '초등' locations:")
    print(elem_rows['진단지역'].unique())
    print("Sample '초등' values in all columns:")
    print(elem_rows.iloc[0])

# detailed check on Busan Station
busan_rows = df[df['진단지역'].astype(str) == '부산역']
print(f"Exact match '부산역' rows: {len(busan_rows)}")
if not busan_rows.empty:
    print(f"Sample '부산역' row: {busan_rows.iloc[0]['진단지역']}")
    print(f"Encoded: {busan_rows.iloc[0]['진단지역'].encode('utf-8')}")
