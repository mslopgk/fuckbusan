"""2025 진단(1~3차) xlsx → checklist_result 임포트 (재실행 안전 / 프로덕션 재사용용).

- 앱 canonical 형태(= /checklist/submit, seed_diagnosis.py와 동일): Data No.(세션) 단위 1행,
  answers = {"질문Num": 점수} JSON, 점수 = 세션 평균(반올림), 전문가 텍스트 점수는
  적합→5 / 해당없음→3 / 부적합→1 매핑 (기존 진단대상='전문가' 행 컨벤션과 동일).
- 중복 방지(멱등): DB의 (a) 이미지경로 basename, (b) (ID, created_at) 쌍과 대조.
  세션이 어느 한 키로든 이미 존재하면 스킵 — per-question 형태(/uploads/checklist/)로
  들어간 과거 임포트와도 충돌하지 않음.
- 이미지: S3 링크를 로컬(uploads/diagnosis/)로 다운로드(중복 URL 1회, 8-thread),
  실패 시 S3 URL 유지. 이미 DB에 있는 세션이라도 로컬 파일이 없으면 내려받아 복구.
- user_id: users.ID 문자열 매칭되면 연결, 없으면 NULL(ID 문자열은 유지).

실행:
  cd backend && python3 import_diagnosis_2025.py --dir /path/to/xlsx_dir [--dry-run]
"""
import argparse
import concurrent.futures as cf
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

CUR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CUR)

UPLOAD_DIR = Path(CUR) / "uploads" / "diagnosis"
WEB_PREFIX = "/uploads/diagnosis/"

FILES = [
    ("1차진단_일반인_251204.xlsx", "시민"),
    ("2차진단_일반인_251210.xlsx", "시민"),
    ("2차진단_전문가_251210.xlsx", "전문가"),
    ("3차진단_전문가_251217.xlsx", "전문가"),
]
YUTYPE_MAP = {1: "전문가", 2: "시민"}
EXPERT_SCORE = {"적합": 5, "해당없음": 3, "부적합": 1}

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def clean(v):
    if v is None:
        return None
    s = str(v).replace("\r", "").replace("\n", " ").strip()
    return s or None


def parse_dt(v):
    if isinstance(v, datetime):
        return v.replace(microsecond=0)
    if isinstance(v, str):
        s = v.strip()
        for fmt in ("%Y.%m.%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y.%m.%d %H:%M"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                pass
    raise ValueError(f"등록일시 파싱 실패: {v!r}")


def parse_sessions(xlsx_dir: Path):
    import openpyxl

    sessions = {}  # data_no -> dict
    row_counts = {}
    for fname, default_target in FILES:
        fpath = xlsx_dir / fname
        if not fpath.exists():
            print(f"[WARN] 파일 없음, 건너뜀: {fpath}")
            continue
        wb = openpyxl.load_workbook(fpath, read_only=True)
        ws = wb.active
        n = 0
        for row in ws.iter_rows(min_row=2, values_only=True):
            data_no = row[3]
            if data_no is None:
                continue
            n += 1
            target = YUTYPE_MAP.get(row[4], default_target)
            if data_no not in sessions:
                region = clean(row[0]) or "부산역"
                url = clean(row[17])
                sessions[data_no] = {
                    "file": fname,
                    "진단지역": region,
                    "district_code": region,
                    "ID": clean(row[1]),
                    "created_at": parse_dt(row[7]),
                    "위도": float(row[8]) if isinstance(row[8], (int, float)) else None,
                    "경도": float(row[9]) if isinstance(row[9], (int, float)) else None,
                    "대분류": clean(row[10]),
                    "중분류": clean(row[11]),
                    "질문기준": clean(row[13]) or clean(row[11]) or "",
                    "리뷰": clean(row[16]),
                    "image_url": url if url and url.startswith("http") else None,
                    "진단대상": target,
                    "answers": {},
                    "scores": [],
                }
            s = sessions[data_no]
            raw = row[15]
            if isinstance(raw, (int, float)):
                score = int(raw)
            elif isinstance(raw, str):
                score = EXPERT_SCORE.get(raw.strip(), 3)
            else:
                score = 3
            s["answers"][str(row[12])] = score
            s["scores"].append(score)
        wb.close()
        row_counts[fname] = n
        print(f"파싱: {fname} — {n}행")
    return sessions, row_counts


def load_existing_keys(db):
    """DB에 이미 있는 세션 판별키: 이미지 basename + (ID, created_at)."""
    import models

    basenames, id_dt = set(), set()
    q = db.query(
        models.ChecklistResult.이미지경로,
        models.ChecklistResult.ID,
        models.ChecklistResult.created_at,
    )
    for img, uid, dt in q.all():
        if img:
            basenames.add(img.rstrip("/").split("/")[-1])
        if uid and dt:
            id_dt.add((uid, dt.replace(microsecond=0)))
    return basenames, id_dt


def download_one(url):
    fname = url.split("/")[-1]
    local = UPLOAD_DIR / fname
    if local.exists() and local.stat().st_size > 0:
        return url, WEB_PREFIX + fname, "cached"
    try:
        req = urllib.request.Request(url.replace(" ", "%20"),
                                     headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25, context=_ssl_ctx) as resp:
            data = resp.read()
        local.write_bytes(data)
        return url, WEB_PREFIX + fname, "downloaded"
    except Exception as e:
        return url, url, f"failed: {e}"  # 실패 시 S3 URL 유지


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="xlsx 4개가 있는 디렉토리")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    from database import SessionLocal
    import models

    xlsx_dir = Path(args.dir)
    sessions, row_counts = parse_sessions(xlsx_dir)
    print(f"\n총 세션(Data No.) {len(sessions)}건 / 원본 행 {sum(row_counts.values())}건")

    db = SessionLocal()
    try:
        basenames, id_dt = load_existing_keys(db)
        print(f"DB 기존 행 키: 이미지 basename {len(basenames)}개, (ID,시각) {len(id_dt)}쌍")

        to_insert, skipped = [], {}
        for dn, s in sorted(sessions.items()):
            bn = s["image_url"].split("/")[-1] if s["image_url"] else None
            dup = (bn and bn in basenames) or ((s["ID"], s["created_at"]) in id_dt)
            if dup:
                skipped[s["file"]] = skipped.get(s["file"], 0) + 1
            else:
                to_insert.append((dn, s))

        print("\n[중복 분석] 파일별 세션 스킵/삽입 예정:")
        for fname, _ in FILES:
            ins = sum(1 for _, s in to_insert if s["file"] == fname)
            print(f"  {fname}: skip={skipped.get(fname, 0)} insert={ins}")

        # 이미지: 삽입 대상 세션 + (복구) 기존 행이 가리키는데 로컬에 없는 파일
        urls = {s["image_url"] for _, s in to_insert if s["image_url"]}
        heal_urls = set()
        for dn, s in sessions.items():
            if not s["image_url"]:
                continue
            bn = s["image_url"].split("/")[-1]
            if bn in basenames and not (UPLOAD_DIR / bn).exists():
                heal_urls.add(s["image_url"])
        all_urls = sorted(urls | heal_urls)
        print(f"\n이미지: 신규 {len(urls)}개, 로컬 누락 복구 {len(heal_urls)}개")

        url_map = {}
        dl = fail = cached = 0
        if args.dry_run:
            for u in all_urls:
                bn = u.split("/")[-1]
                if (UPLOAD_DIR / bn).exists():
                    cached += 1
                else:
                    dl += 1
                url_map[u] = WEB_PREFIX + bn
            print(f"[dry-run] 다운로드 예정 {dl} / 이미 로컬 {cached}")
        else:
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            with cf.ThreadPoolExecutor(max_workers=8) as ex:
                for url, local_path, status in ex.map(download_one, all_urls):
                    url_map[url] = local_path
                    if status == "downloaded":
                        dl += 1
                    elif status == "cached":
                        cached += 1
                    else:
                        fail += 1
                        print(f"  [IMG FAIL] {url.split('/')[-1]}: {status}")
            print(f"이미지 결과: 다운로드 {dl} / 이미 로컬 {cached} / 실패(S3 유지) {fail}")

        if args.dry_run:
            print(f"\n[dry-run] 삽입 예정 {len(to_insert)}건 / 스킵 {sum(skipped.values())}건 — DB 변경 없음")
            return

        # user_id 매핑
        uid_map = {u.ID: u.user_id for u in db.query(models.User).all() if u.ID}

        inserted = 0
        for dn, s in to_insert:
            scores = s["scores"]
            img = url_map.get(s["image_url"], s["image_url"]) if s["image_url"] else None
            db.add(models.ChecklistResult(
                진단지역=s["진단지역"],
                district_code=s["district_code"],
                ID=s["ID"],
                user_id=uid_map.get(s["ID"]),
                created_at=s["created_at"],
                위도=s["위도"],
                경도=s["경도"],
                대분류=s["대분류"],
                중분류=s["중분류"],
                질문기준=s["질문기준"],
                answers=json.dumps(s["answers"], ensure_ascii=False),
                점수=round(sum(scores) / len(scores)) if scores else None,
                리뷰=s["리뷰"],
                만족도=None,
                이미지경로=img,
                진단대상=s["진단대상"],
            ))
            inserted += 1
        db.commit()
        print(f"\n=== 완료: 삽입 {inserted} / 스킵 {sum(skipped.values())} / "
              f"이미지 다운로드 {dl} (복구 포함) / 실패 {fail} ===")
    finally:
        db.close()


if __name__ == "__main__":
    main()
