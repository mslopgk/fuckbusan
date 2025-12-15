import pandas as pd
import os
import glob

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
csv_files = glob.glob(os.path.join(data_dir, "*.csv"))

print(f"Checking {len(csv_files)} CSV files...")

for f in csv_files:
    try:
        # Try reading with different encodings
        try:
            df = pd.read_csv(f, encoding='utf-8')
        except:
            df = pd.read_csv(f, encoding='cp949')
            
        print(f"--- {os.path.basename(f)} ---")
        # Search for '범일' or '초등'
        mask = df.apply(lambda row: row.astype(str).str.contains('범일|초등').any(), axis=1)
        count = mask.sum()
        print(f"Matches: {count}")
        if count > 0:
            print("Sample match:")
            print(df[mask].iloc[0].values)
            
    except Exception as e:
        print(f"Error reading {os.path.basename(f)}: {e}")
