import pandas as pd
import os

def search_excel(filename, terms):
    path = os.path.join(r"c:\Users\kang\Desktop\디자인진흥원 v6\busan_data", filename)
    print(f"--- Scanning {filename} ---")
    try:
        if filename.endswith(".xlsx"):
            df = pd.read_excel(path)
        elif filename.endswith(".csv"):
            try:
                df = pd.read_csv(path, encoding='euc-kr')
            except:
                df = pd.read_csv(path, encoding='utf-8')
        else:
            print("Skipping non-excel/csv file.")
            return

        print(f"Loaded {len(df)} rows.")
        print("Columns:", list(df.columns))
        # Print first valid row
        if not df.empty:
            print("First row:", df.iloc[0].to_dict())
        
        # Search
        found = False
        for term in terms:
            mask = df.apply(lambda x: x.astype(str).str.contains(term, na=False)).any(axis=1)
            matching_rows = df[mask]
            if not matching_rows.empty:
                found = True
                print(f"[FOUND] '{term}' in {len(matching_rows)} rows.")
                print("Match sample:")
                print(matching_rows.iloc[0].to_dict())
                print("-" * 20)
        
        if not found:
            print("No matches found.")

    except Exception as e:
        print(f"Error reading {filename}: {e}")

if __name__ == "__main__":
    terms = ["부산역", "범일초"]
    files = ["2차진단_일반인_251210.xlsx", "2차진단_전문가_251210.xlsx", "공공디자인 진단 플랫폼 데이터시트_양식 (1).csv"]
    for f in files:
        search_excel(f, terms)
