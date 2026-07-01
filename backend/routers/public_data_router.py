"""공공데이터 대시보드 API (PCPublicData).

실데이터 출처: data.go.kr, data.busan.go.kr, 행정안전부, TAAS, 문체부, 통계청 등.
시드: backend/public_data/seed_data.py
"""
from fastapi import APIRouter, Depends, HTTPException
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
            "value_text": s.value_text, "year": s.year, "note": s.note, "source": s.source,
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
            "value_text": s.value_text, "year": s.year, "note": s.note,
            "source": s.source, "sort_order": s.sort_order or 0}


class ThemeStatIn(BaseModel):
    theme: str
    region: Optional[str] = "부산"
    metric: str
    value_text: Optional[str] = ""
    year: Optional[str] = None
    note: Optional[str] = None
    source: Optional[str] = None
    sort_order: Optional[int] = 0


class ThemeStatPatch(BaseModel):
    theme: Optional[str] = None
    region: Optional[str] = None
    metric: Optional[str] = None
    value_text: Optional[str] = None
    year: Optional[str] = None
    note: Optional[str] = None
    source: Optional[str] = None
    sort_order: Optional[int] = None


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
