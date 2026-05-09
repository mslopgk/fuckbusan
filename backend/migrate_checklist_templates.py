"""
ChecklistTemplate migration: category_rows.csv + questions_rows.csv → checklist_templates table

Category depth structure:
  depth=1 → 대분류
  depth=2 → 중분류
  depth=3 → 소분류 (questions link here)
"""
import csv
import json
import pymysql
from datetime import datetime

DB = dict(host="127.0.0.1", port=3306, user="busan", password="busanpw",
          database="busan_design_db", charset="utf8mb4")

CAT_FILE  = "/Users/Kang/Desktop/fuckbusan/제목 없음/category_rows.csv"
QUES_FILE = "/Users/Kang/Desktop/fuckbusan/제목 없음/questions_rows.csv"


def load_categories():
    rows = []
    with open(CAT_FILE, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            rows.append({
                "idx":       int(r["idx"]),
                "user_type": int(r["user_type"]),
                "depth":     int(r["depth"]),
                "parent_id": int(r["parent_category_id"]) if r["parent_category_id"].strip() else None,
                "text":      r["text"].strip(),
            })
    return rows


def load_questions():
    rows = []
    with open(QUES_FILE, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if r["active"].strip() != "1" or r["deleted_at"].strip():
                continue
            rows.append({
                "idx":       int(r["idx"]),
                "parent_id": int(r["parent_category_id"]) if r["parent_category_id"].strip() else None,
                "text":      r["text"].strip(),
                "criteria":  r["criteria"].strip(),
                "user_type": int(r["user_type"]),
            })
    return rows


def build_tree(user_type: int, categories, questions):
    cats = [c for c in categories if c["user_type"] == user_type]
    ques = [q for q in questions if q["user_type"] == user_type]

    by_depth = {1: {}, 2: {}, 3: {}}
    for c in cats:
        d = c["depth"]
        if d in by_depth:
            by_depth[d][c["idx"]] = {
                "id":   c["idx"],
                "name": c["text"],
                **({"subcategories": []} if d == 1 else {}),
                **({"sub_subcategories": []} if d == 2 else {}),
                **({"questions": []} if d == 3 else {}),
            }

    # Attach questions → depth=3
    for q in ques:
        if q["parent_id"] in by_depth[3]:
            by_depth[3][q["parent_id"]]["questions"].append({
                "id":       q["idx"],
                "text":     q["text"],
                "criteria": q["criteria"],
            })

    # Attach depth=3 → depth=2
    for c in cats:
        if c["depth"] == 3 and c["parent_id"] in by_depth[2]:
            by_depth[2][c["parent_id"]]["sub_subcategories"].append(by_depth[3][c["idx"]])

    # Attach depth=2 → depth=1
    for c in cats:
        if c["depth"] == 2 and c["parent_id"] in by_depth[1]:
            by_depth[1][c["parent_id"]]["subcategories"].append(by_depth[2][c["idx"]])

    return list(by_depth[1].values())


def count_questions(tree):
    total = 0
    for top in tree:
        for mid in top.get("subcategories", []):
            for sub in mid.get("sub_subcategories", []):
                total += len(sub.get("questions", []))
    return total


def main():
    categories = load_categories()
    questions  = load_questions()

    trees = {
        "general": build_tree(2, categories, questions),
        "expert":  build_tree(1, categories, questions),
    }

    for mode, tree in trees.items():
        top = len(tree)
        mid = sum(len(t["subcategories"]) for t in tree)
        sub = sum(len(s["sub_subcategories"]) for t in tree for s in t["subcategories"])
        q   = count_questions(tree)
        print(f"[{mode}] 대분류 {top}, 중분류 {mid}, 소분류 {sub}, 질문 {q}")

    conn = pymysql.connect(**DB)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM checklist_templates WHERE kind='diagnosis'")
            print(f"Deleted existing diagnosis templates: {cur.rowcount} rows")

            for mode, title_kr in [("general", "일반 진단 체크리스트"), ("expert", "전문가 진단 체크리스트")]:
                cur.execute(
                    "INSERT INTO checklist_templates (kind, mode, title, payload, updated_at) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    ("diagnosis", mode, title_kr,
                     json.dumps(trees[mode], ensure_ascii=False),
                     datetime.now()),
                )
                print(f"Inserted: mode={mode}, questions={count_questions(trees[mode])}")

        conn.commit()
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
