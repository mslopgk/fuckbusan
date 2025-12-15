import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
expert_path = os.path.join(data_dir, "2차진단_전문가_251210.xlsx")

def check_expert_locations():
    if os.path.exists(expert_path):
        df = pd.read_excel(expert_path)
        print("Unique Locations found in EXPERT file:")
        print(df['진단지역'].unique())
        print(f"Total Rows: {len(df)}")
    else:
        print("Expert file not found")

if __name__ == "__main__":
    check_expert_locations()
