"""공공데이터 대시보드 API (PCPublicData).

실데이터 출처: data.go.kr, data.busan.go.kr, 행정안전부, TAAS, 문체부, 통계청 등.
시드: backend/public_data/seed_data.py
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models

router = APIRouter(prefix="/api/public-data", tags=["public-data"])


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
