import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
expert_path = os.path.join(data_dir, "2차진단_전문가_251210.xlsx")

df_exp = pd.read_excel(expert_path)
print("Expert Columns:", df_exp.columns.tolist())

# Find rows with '범일'
mask_beomil = df_exp.apply(lambda row: row.astype(str).str.contains('범일').any(), axis=1)
beomil_rows = df_exp[mask_beomil]
print(f"Beomil rows: {len(beomil_rows)}")

if not beomil_rows.empty:
    print("Sample Beomil Row:")
    print(beomil_rows.iloc[0])
    
    # Check what column contains '범일'
    row0 = beomil_rows.iloc[0]
    for col in df_exp.columns:
        if '범일' in str(row0[col]):
            print(f"Found '범일' in column: {col}")
