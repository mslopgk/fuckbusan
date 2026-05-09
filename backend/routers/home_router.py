"""홈 화면 KPI / 카드 데이터 — DB 집계."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from database import get_db
import models

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("/stats")
def home_stats(db: Session = Depends(get_db)):
    return {
        "reports_count": db.query(func.count(models.Report.id)).scalar() or 0,
        "proposals_count": db.query(func.count(models.NewProposal.id)).scalar() or 0,
        "diagnoses_count": db.query(func.count(models.ChecklistResult.result_id)).scalar() or 0,
        "citizens_count": db.query(func.count(models.Persona.id)).scalar() or 0,
    }


@router.get("/citizens")
def home_citizens(db: Session = Depends(get_db)):
    rows = db.query(models.Persona).limit(8).all()
    out = []
    for p in rows:
        tags = p.tags
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        out.append({
            "id": p.id,
            "name": p.name,
            "age": p.age or 0,
            "tags": tags or [],
            "desc": p.quote or "",
        })
    return out


@router.get("/archives")
def home_archives(db: Session = Depends(get_db)):
    """우수 사례 — 좋아요 많은 제안 top 6."""
    rows = (
        db.query(models.NewProposal)
        .order_by(models.NewProposal.likes_count.desc())
        .limit(6)
        .all()
    )
    result = []
    for p in rows:
        files = []
        if p.files:
            try:
                files = json.loads(p.files) if isinstance(p.files, str) else p.files
            except Exception:
                files = []
        result.append({
            "id": p.id,
            "title": p.title,
            "desc": (p.content or "")[:80],
            "img": files[0] if files else None,
        })
    return result
