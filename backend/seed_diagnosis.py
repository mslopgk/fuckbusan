"""
진단 데이터 시드 스크립트
Excel 4개 파일 → DB 삽입 + 이미지 로컬 다운로드

실행: cd backend && python3 seed_diagnosis.py
재실행 안전: 이미 내려받은 이미지/삽입된 행은 스킵
"""
import os, sys, json, ssl, urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

ROOT_DIR   = Path(current_dir).parent
UPLOAD_DIR = Path(current_dir) / "uploads" / "diagnosis"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

EXCEL_FILES = [
    (ROOT_DIR / "1차진단_일반인_251204.xlsx",  "시민"),
    (ROOT_DIR / "2차진단_일반인_251210.xlsx",  "시민"),
    (ROOT_DIR / "2차진단_전문가_251210.xlsx",  "전문가"),
    (ROOT_DIR / "3차진단_전문가_251217.xlsx",  "전문가"),
]

# 유형 컬럼 값 → 진단대상 매핑 (파일명보다 컬럼값 우선)
YUTYPE_MAP = {1: "전문가", 2: "시민"}

# 전문가 점수 텍스트 → 숫자
EXPERT_SCORE = {"적합": 5, "해당없음": 3, "부적합": 1}


def clean_str(v) -> str | None:
    """None 처리 + 공백/줄바꿈 정리"""
    if v is None:
        return None
    s = str(v).replace("\n", " ").replace("\r", "").strip()
    return s if s else None


# ── 1. Excel 파싱 ──────────────────────────────────────────────────────────────

def parse_excel_files() -> list[dict]:
    try:
        import openpyxl
    except ImportError:
        print("[ERROR] openpyxl 미설치: pip3 install openpyxl")
        sys.exit(1)

    groups: dict = {}

    for fpath, file_target in EXCEL_FILES:
        print(f"파싱: {fpath.name}")
        wb = openpyxl.load_workbook(fpath)
        ws = wb.active
        for r in range(2, ws.max_row + 1):
            row = [ws.cell(r, c).value for c in range(1, ws.max_column + 1)]
            data_no = row[3]
            if data_no is None:
                continue

            # 유형 컬럼(col5)으로 시민/전문가 판별, 없으면 파일명 기본값
            yutype = row[4]
            target = YUTYPE_MAP.get(yutype, file_target)

            if data_no not in groups:
                raw_dt = row[7]
                if isinstance(raw_dt, datetime):
                    dt = raw_dt
                elif isinstance(raw_dt, str):
                    try:
                        dt = datetime.strptime(raw_dt.strip(), "%Y.%m.%d %H:%M:%S")
                    except Exception:
                        dt = datetime.now()
                else:
                    dt = datetime.now()

                region = clean_str(row[0]) or "부산역"
                groups[data_no] = {
                    "data_no":    data_no,
                    "진단지역":   region,
                    "district_code": region,     # 지역명을 district_code로도 사용
                    "ID":         clean_str(row[1]),
                    "created_at": dt,
                    "위도":       float(row[8])  if isinstance(row[8],  (int, float)) else None,
                    "경도":       float(row[9])  if isinstance(row[9],  (int, float)) else None,
                    "대분류":     clean_str(row[10]),
                    "중분류":     clean_str(row[11]),
                    "리뷰":       clean_str(row[16]),
                    "image_url":  clean_str(row[17]) if row[17] and str(row[17]).startswith("http") else None,
                    "진단대상":   target,
                    "questions":  [],
                }

            groups[data_no]["questions"].append({
                "num":  row[12],
                "기준": clean_str(row[13]) or "",
                "raw":  row[15],
                "target": target,
            })

    records = []
    for g in groups.values():
        qs = g["questions"]

        answers = {}
        scores = []
        for q in qs:
            raw = q["raw"]
            if isinstance(raw, (int, float)):
                s = int(raw)
            elif isinstance(raw, str):
                s = EXPERT_SCORE.get(raw.strip(), 3)
            else:
                s = 3
            answers[str(q["num"])] = s
            scores.append(s)

        avg = round(sum(scores) / len(scores)) if scores else 0
        질문기준 = qs[0]["기준"] if qs else (g["중분류"] or "")

        records.append({
            "data_no":       g["data_no"],
            "진단지역":       g["진단지역"],
            "district_code": g["district_code"],
            "ID":             g["ID"],
            "created_at":    g["created_at"],
            "위도":           g["위도"],
            "경도":           g["경도"],
            "대분류":         g["대분류"],
            "중분류":         g["중분류"],
            "질문기준":       질문기준,
            "answers":       json.dumps(answers, ensure_ascii=False),
            "점수":           avg,
            "리뷰":           g["리뷰"],
            "image_url":     g["image_url"],
            "진단대상":       g["진단대상"],
        })

    citizen  = sum(1 for r in records if r["진단대상"] == "시민")
    expert   = sum(1 for r in records if r["진단대상"] == "전문가")
    print(f"  → 파싱 완료: 총 {len(records)}건 (시민 {citizen}, 전문가 {expert})")
    return records


# ── 2. 이미지 다운로드 ─────────────────────────────────────────────────────────

def download_images(records: list[dict]) -> dict[str, str]:
    unique_urls = list(dict.fromkeys(r["image_url"] for r in records if r["image_url"]))
    print(f"\n이미지 다운로드: {len(unique_urls)}개")

    url_to_local: dict[str, str] = {}
    ok = skip = fail = 0

    for i, url in enumerate(unique_urls, 1):
        fname = url.split("/")[-1]
        local = UPLOAD_DIR / fname
        rel   = f"/uploads/diagnosis/{fname}"
        url_to_local[url] = rel

        if local.exists():
            skip += 1
            continue

        try:
            # 공백 등 URL 비합법 문자 처리
            safe_url = url.replace(" ", "%20")
            req = urllib.request.Request(safe_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20, context=_ssl_ctx) as resp:
                local.write_bytes(resp.read())
            ok += 1
        except Exception as e:
            fail += 1
            url_to_local[url] = url      # 실패 시 원본 URL 유지
            print(f"  [FAIL] {fname}: {e}")

        if i % 100 == 0:
            print(f"  [{i}/{len(unique_urls)}] ok={ok} skip={skip} fail={fail}")

    print(f"  → 완료 {ok} / 스킵 {skip} / 실패 {fail}")
    return url_to_local


# ── 3. DB 삽입 ────────────────────────────────────────────────────────────────

def insert_records(records: list[dict], url_map: dict[str, str]):
    from database import SessionLocal
    import models

    db = SessionLocal()
    try:
        # 기존 시드 경로 수집 (중복 삽입 방지)
        existing = {
            row[0]
            for row in db.query(models.ChecklistResult.이미지경로).filter(
                models.ChecklistResult.이미지경로.like("/uploads/diagnosis/%")
            ).all()
        }
        print(f"\nDB 기존 시드 행: {len(existing)}건 — 동일 경로는 스킵")

        inserted = skipped = 0
        for rec in records:
            local_path = url_map.get(rec["image_url"], rec["image_url"]) if rec["image_url"] else None

            # 이미 있는 경로면 스킵
            if local_path and local_path in existing:
                skipped += 1
                continue

            db.add(models.ChecklistResult(
                진단지역      = rec["진단지역"],
                district_code = rec["district_code"],
                ID            = rec["ID"],
                created_at    = rec["created_at"],
                위도           = rec["위도"],
                경도           = rec["경도"],
                대분류         = rec["대분류"],
                중분류         = rec["중분류"],
                질문기준       = rec["질문기준"],
                answers       = rec["answers"],
                점수           = rec["점수"],
                리뷰           = rec["리뷰"],
                만족도         = None,
                이미지경로     = local_path,
                진단대상       = rec["진단대상"],
                user_id       = None,
            ))
            if local_path:
                existing.add(local_path)
            inserted += 1

        db.commit()
        citizen  = sum(1 for r in records if r["진단대상"] == "시민"   and (url_map.get(r["image_url"], r["image_url"]) if r["image_url"] else None) not in existing or inserted > 0)
        print(f"  → 삽입 {inserted} / 스킵 {skipped}")
    except Exception as e:
        db.rollback()
        print(f"[DB ERROR] {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        db.close()


# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== 진단 데이터 시드 시작 ===\n")
    records = parse_excel_files()
    url_map = download_images(records)
    insert_records(records, url_map)
    print("\n=== 완료 ===")
