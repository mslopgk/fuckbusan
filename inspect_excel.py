import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
files = [f for f in os.listdir(data_dir) if f.endswith('.xlsx')]

for f in files:
    print(f"--- Processing {f} ---")
    try:
        df = pd.read_excel(os.path.join(data_dir, f))
        print(df.columns.tolist())
        print(df.head(2))
    except Exception as e:
        print(f"Error reading {f}: {e}")
