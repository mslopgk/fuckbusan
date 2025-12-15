import pandas as pd
import os

data_dir = r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data"
public_path = os.path.join(data_dir, "2차진단_일반인_251210.xlsx")
expert_path = os.path.join(data_dir, "2차진단_전문가_251210.xlsx")

print("--- Public Data Analysis ---")
df_pub = pd.read_excel(public_path)
# Check Busan Station format
busan_rows = df_pub[df_pub['진단지역'].astype(str).str.contains('부산역', na=False)]
if not busan_rows.empty:
    print("Unique '진단지역' values containing '부산역':")
    print(busan_rows['진단지역'].unique())
else:
    print("No '부산역' found in Public data.")

# Search for Beomil in Public
mask_beomil = df_pub.apply(lambda row: row.astype(str).str.contains('범일').any(), axis=1)
beomil_rows = df_pub[mask_beomil]
print(f"Rows with '범일' anywhere in Public data: {len(beomil_rows)}")
if not beomil_rows.empty:
    print("Sample Beomil row locations:")
    print(beomil_rows['진단지역'].unique())

print("\n--- Expert Data Analysis ---")
if os.path.exists(expert_path):
    df_exp = pd.read_excel(expert_path)
    mask_beomil_exp = df_exp.apply(lambda row: row.astype(str).str.contains('범일').any(), axis=1)
    print(f"Rows with '범일' anywhere in Expert data: {len(mask_beomil_exp)}")
    if not mask_beomil_exp.empty:
        print("Sample Beomil row locations (Expert):")
        if '진단지역' in df_exp.columns:
            print(df_exp[mask_beomil_exp]['진단지역'].unique())
else:
    print("Expert file not found.")
