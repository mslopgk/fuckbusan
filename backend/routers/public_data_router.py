"""공공데이터 대시보드 API (PCPublicData).

실데이터 출처: data.go.kr, data.busan.go.kr, 행정안전부, TAAS, 문체부, 통계청 등.
시드: backend/public_data/seed_data.py
"""
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from .user_router import get_current_user, require_admin

router = APIRouter(prefix="/api/public-data", tags=["public-data"])


def _admin(user=Depends(get_current_user)):
    require_admin(user)
    return user


@router.get("/overview")
def overview(region: str = "부산진구", db: Session = Depends(get_db)):
    """대시보드 1회 로드용 통합 페이로드."""
    districts = db.query(models.PublicDistrict).all()
    trend = (db.query(models.PublicPopTrend)
             .order_by(models.PublicPopTrend.year.asc()).all())
    stats = (db.query(models.PublicThemeStat)
             .order_by(models.PublicThemeStat.sort_order.asc()).all())
    layers = (db.query(models.PublicLayer)
              .order_by(models.PublicLayer.sort_order.asc()).all())

    region_row = next((d for d in districts if d.region == region), None)

    return {
        "region": region,
        "region_summary": ({
            "population": region_row.population,
            "accidents": region_row.accidents,
            "libraries": region_row.libraries,
        } if region_row else None),
        "pop_trend": [{"year": t.year, "value": t.value} for t in trend],
        "theme_stats": [{
            "theme": s.theme, "region": s.region, "metric": s.metric,
            "value_text": s.value_text, "unit": s.unit, "year": s.year,
            "note": s.note, "source": s.source,
        } for s in stats],
        "layers": [{
            "key": l.key, "label": l.label, "region": l.region,
            "count": l.count, "source": l.source,
        } for l in layers],
        # 16개 구·군 비교용 (프론트에서 지표 선택해 정렬/트리맵)
        "districts": [{
            "region": d.region,
            "population": d.population,
            "accidents": d.accidents,
            "acc_deaths": d.acc_deaths,
            "acc_injuries": d.acc_injuries,
            "libraries": d.libraries,
        } for d in districts],
    }


# ── 어드민: 공공데이터(테마 지표) 목록 관리 CRUD ──────────────────────────────

def _stat_ser(s: "models.PublicThemeStat") -> dict:
    return {"id": s.id, "theme": s.theme, "region": s.region, "metric": s.metric,
            "value_text": s.value_text, "unit": s.unit, "year": s.year, "note": s.note,
            "source": s.source, "sort_order": s.sort_order or 0,
            "created_at": s.created_at.isoformat() if getattr(s, "created_at", None) else None}


class ThemeStatIn(BaseModel):
    theme: str
    region: Optional[str] = "부산"
    metric: str
    value_text: Optional[str] = ""
    unit: Optional[str] = None
    year: Optional[str] = None
    note: Optional[str] = None
    source: Optional[str] = None
    sort_order: Optional[int] = 0


class ThemeStatPatch(BaseModel):
    theme: Optional[str] = None
    region: Optional[str] = None
    metric: Optional[str] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    year: Optional[str] = None
    note: Optional[str] = None
    source: Optional[str] = None
    sort_order: Optional[int] = None


class ThemeStatBulkEntry(BaseModel):
    year: str
    value: Optional[str] = ""


class ThemeStatBulkIn(BaseModel):
    theme: Optional[str] = "공공데이터"
    metric: str
    region: Optional[str] = "부산"
    unit: Optional[str] = None
    note: Optional[str] = None
    source: Optional[str] = None
    entries: list[ThemeStatBulkEntry] = []


@router.get("/admin/stats")
def admin_list_stats(theme: Optional[str] = None, region: Optional[str] = None,
                     q: Optional[str] = None, page: int = 1, size: int = 10,
                     _=Depends(_admin), db: Session = Depends(get_db)):
    query = db.query(models.PublicThemeStat)
    if theme and theme != "전체":
        query = query.filter(models.PublicThemeStat.theme == theme)
    if region:
        query = query.filter(models.PublicThemeStat.region.contains(region))
    if q:
        query = query.filter(models.PublicThemeStat.metric.contains(q))
    query = query.order_by(models.PublicThemeStat.sort_order.asc(), models.PublicThemeStat.id.asc())
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()
    return {"items": [_stat_ser(s) for s in rows], "total": total, "page": page, "size": size}


@router.post("/admin/stats")
def admin_create_stat(body: ThemeStatIn, _=Depends(_admin), db: Session = Depends(get_db)):
    s = models.PublicThemeStat(**body.dict())
    db.add(s)
    db.commit()
    db.refresh(s)
    return _stat_ser(s)


@router.patch("/admin/stats/{sid}")
def admin_update_stat(sid: int, body: ThemeStatPatch, _=Depends(_admin), db: Session = Depends(get_db)):
    s = db.query(models.PublicThemeStat).filter(models.PublicThemeStat.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="없음")
    for k, v in body.dict(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return _stat_ser(s)


@router.delete("/admin/stats/{sid}")
def admin_delete_stat(sid: int, _=Depends(_admin), db: Session = Depends(get_db)):
    s = db.query(models.PublicThemeStat).filter(models.PublicThemeStat.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="없음")
    db.delete(s)
    db.commit()
    return {"ok": True, "deleted": sid}


@router.post("/admin/stats/bulk")
def admin_bulk_stats(body: ThemeStatBulkIn, _=Depends(_admin), db: Session = Depends(get_db)):
    """데이터추가(다년도) — (theme, metric, region, unit) 공유 + 연도별 값.
    동일 (theme, metric, region, year) 는 값/단위/비고/출처만 갱신, 없으면 신규 생성."""
    if not (body.metric or "").strip():
        raise HTTPException(status_code=400, detail="데이터명(metric)은 필수입니다.")
    theme = (body.theme or "공공데이터").strip()
    metric = body.metric.strip()
    region = (body.region or "부산").strip()
    created = updated = 0
    result_ids = []
    for e in body.entries:
        year = (e.year or "").strip()
        if not year:
            continue
        s = (db.query(models.PublicThemeStat)
             .filter(models.PublicThemeStat.theme == theme,
                     models.PublicThemeStat.metric == metric,
                     models.PublicThemeStat.region == region,
                     models.PublicThemeStat.year == year)
             .first())
        value_text = (e.value or "").strip()
        if s:
            s.value_text = value_text
            s.unit = body.unit
            s.note = body.note
            s.source = body.source
            updated += 1
        else:
            s = models.PublicThemeStat(
                theme=theme, metric=metric, region=region, year=year,
                value_text=value_text, unit=body.unit, note=body.note,
                source=body.source, sort_order=0)
            db.add(s)
            created += 1
        db.flush()
        result_ids.append(s.id)
    db.commit()
    return {"ok": True, "created": created, "updated": updated, "ids": result_ids}


# ── 어드민: CSV 업로드로 테마 지표 일괄 upsert ────────────────────────────────
#
# CSV 형식 (헤더 필수, utf-8 또는 utf-8-sig/엑셀):
#   theme,region,metric,value_text,year,note,source,sort_order
#   안전,부산진구,방범용 CCTV,"1,130대",2025,,data.busan.go.kr,1
#
# upsert 키 = (theme, region, metric). 동일 조합이 있으면 값만 갱신, 없으면 신규 생성.
# theme, metric 은 필수. 잘못된 행은 스킵하고 errors 에 사유와 함께 리포트.

# 별칭 허용(한글 헤더도 수용) — 왼쪽 표준키, 값은 허용 별칭 목록
_CSV_ALIASES = {
    "theme": ["theme", "테마", "카테고리"],
    "region": ["region", "지역"],
    "metric": ["metric", "지표", "지표명", "지표키"],
    "value_text": ["value_text", "value", "값", "표시값"],
    "unit": ["unit", "단위"],
    "year": ["year", "연도", "년도"],
    "note": ["note", "비고", "부가"],
    "source": ["source", "출처"],
    "sort_order": ["sort_order", "order", "정렬", "정렬순서", "정렬 순서"],
}


def _norm_header(name: str) -> Optional[str]:
    key = (name or "").strip().lstrip("﻿").lower()
    for std, aliases in _CSV_ALIASES.items():
        if key in [a.lower() for a in aliases]:
            return std
    return None


def _parse_xlsx_rows(raw: bytes):
    """xlsx(첫 시트) → 행 리스트(list[list[str]]). openpyxl 필요."""
    import openpyxl  # 지연 임포트 (미설치 시 상위에서 CSV 폴백)
    wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    ws = wb.active
    rows = []
    for r in ws.iter_rows(values_only=True):
        rows.append(["" if c is None else str(c) for c in r])
    wb.close()
    return rows


@router.post("/admin/upload-csv")
async def admin_upload_csv(file: UploadFile = File(...), _=Depends(_admin),
                           db: Session = Depends(get_db)):
    """공공데이터(테마 지표) 파일 업로드 → (theme, region, metric) 기준 upsert.
    CSV 및 XLSX(openpyxl 설치 시) 지원. Figma "엑셀 업로드" 대응."""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    fname = (file.filename or "").lower()
    # xlsx 시그니처(PK zip) 또는 확장자 → 엑셀 파싱 시도
    is_xlsx = fname.endswith(".xlsx") or raw[:2] == b"PK"
    all_rows = None
    if is_xlsx:
        try:
            all_rows = _parse_xlsx_rows(raw)
        except ModuleNotFoundError:
            raise HTTPException(status_code=400,
                                detail="엑셀(xlsx) 파싱 라이브러리(openpyxl)가 없습니다. CSV로 저장 후 업로드하세요.")
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"엑셀 파일을 읽을 수 없습니다: {e}")

    if all_rows is None:
        # CSV: utf-8-sig 로 BOM 제거(엑셀 대비), 실패 시 cp949(한글 엑셀) 폴백
        try:
            text_data = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                text_data = raw.decode("cp949")
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="인코딩을 해석할 수 없습니다. UTF-8 CSV 또는 엑셀(xlsx)로 저장하세요.")
        all_rows = list(csv.reader(io.StringIO(text_data)))

    reader = iter(all_rows)
    try:
        header = next(reader)
    except StopIteration:
        raise HTTPException(status_code=400, detail="헤더가 없습니다.")

    # 헤더 → 표준키 인덱스 매핑
    col = {}
    for i, h in enumerate(header):
        std = _norm_header(h)
        if std and std not in col:
            col[std] = i
    if "theme" not in col or "metric" not in col:
        raise HTTPException(status_code=400,
                            detail="필수 컬럼 누락: theme(테마), metric(지표명) 은 반드시 포함되어야 합니다.")

    def cell(row, key):
        idx = col.get(key)
        if idx is None or idx >= len(row):
            return None
        v = (row[idx] or "").strip()
        return v or None

    created = updated = skipped = 0
    errors = []
    # 같은 업로드 내 중복 키는 마지막 값 우선 — 세션 캐시로 조회
    cache = {}

    for lineno, row in enumerate(reader, start=2):  # 2 = 헤더 다음 줄
        if not any((c or "").strip() for c in row):
            continue  # 빈 줄 스킵
        theme = cell(row, "theme")
        metric = cell(row, "metric")
        if not theme or not metric:
            skipped += 1
            errors.append({"row": lineno, "reason": "theme 또는 metric 값이 비어 있음"})
            continue
        region = cell(row, "region") or "부산"
        sort_raw = cell(row, "sort_order")
        try:
            sort_order = int(float(sort_raw)) if sort_raw else 0
        except ValueError:
            sort_order = 0
        fields = {
            "value_text": cell(row, "value_text") or "",
            "unit": cell(row, "unit"),
            "year": cell(row, "year"),
            "note": cell(row, "note"),
            "source": cell(row, "source"),
            "sort_order": sort_order,
        }

        ckey = (theme, region, metric)
        try:
            s = cache.get(ckey)
            if s is None:
                s = (db.query(models.PublicThemeStat)
                     .filter(models.PublicThemeStat.theme == theme,
                             models.PublicThemeStat.region == region,
                             models.PublicThemeStat.metric == metric)
                     .first())
            if s:
                for k, v in fields.items():
                    setattr(s, k, v)
                updated += 1
            else:
                s = models.PublicThemeStat(theme=theme, region=region, metric=metric, **fields)
                db.add(s)
                created += 1
            cache[ckey] = s
        except Exception as e:  # noqa: BLE001
            skipped += 1
            errors.append({"row": lineno, "reason": f"저장 오류: {e}"})

    db.commit()
    return {
        "ok": True,
        "filename": file.filename,
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "total_processed": created + updated,
        "errors": errors[:50],  # 과도한 응답 방지
    }
