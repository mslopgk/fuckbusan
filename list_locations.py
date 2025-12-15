import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")

def check_locations():
    if os.path.exists(public_path):
        df = pd.read_excel(public_path)
        print("Unique Locations found in file:")
        print(df['진단지역'].unique())
        print(f"Total Rows: {len(df)}")
    else:
        print("File not found")

if __name__ == "__main__":
    check_locations()
