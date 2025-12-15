import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")
expert_path = os.path.join(data_dir, "2차진단_전문가_251210.xlsx")

def check_sheets(path, name):
    try:
        xl = pd.ExcelFile(path)
        print(f"--- {name} Sheets ---")
        print(xl.sheet_names)
        
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            # Search for Beomil
            mask = df.apply(lambda row: row.astype(str).str.contains('범일').any(), axis=1)
            count = mask.sum()
            print(f"Sheet '{sheet}': {count} matches for '범일'")
            if count > 0:
                print("Sample match:")
                print(df[mask].iloc[0].values)
    except Exception as e:
        print(f"Error checking {name}: {e}")

check_sheets(public_path, "Public")
check_sheets(expert_path, "Expert")
