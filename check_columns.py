import pandas as pd
import os

path = os.path.join(r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data", "2차진단_일반인_251210.xlsx")
try:
    df = pd.read_excel(path)
    print("Columns:", list(df.columns))
    print("First row:", df.iloc[0].to_dict())
except Exception as e:
    print(e)
