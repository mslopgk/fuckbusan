"""통합 검색 API — 제보·제안·설문 across keyword search."""
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from database import get_db
import models

router = APIRouter(prefix="/api/search", tags=["search"])


def _safe_snippet(text: Optional[str], q: str, n: int = 80) -> str:
    if not text:
        return ""
    t = str(text)
    if not q:
        return t[:n]
    lo = t.lower()
    pos = lo.find(q.lower())
    if pos < 0:
        return t[:n]
    start = max(0, pos - 20)
    end = min(len(t), pos + len(q) + 60)
    return t[start:end]


@router.get("")
def unified_search(
    q: str,
    type: Optional[str] = None,  # all|report|proposal|survey
    region: Optional[str] = None,
    limit: int = 30,
    db: Session = Depends(get_db),
):
    """제목/본문/지역에 q LIKE 매칭. type=all이면 전체 union."""
    q = (q or "").strip()
    out: List[dict] = []
    if not q:
        return out

    pat = f"%{q}%"
    types = [type] if type and type != "all" else ["report", "proposal", "survey"]

    if "report" in types:
        rq = db.query(models.Report).filter(
            or_(
                models.Report.title.ilike(pat),
                models.Report.content.ilike(pat),
                models.Report.region.ilike(pat),
                models.Report.category.ilike(pat),
            )
        )
        if region:
            rq = rq.filter(models.Report.region == region)
        for r in rq.order_by(desc(models.Report.created_at)).limit(limit).all():
            out.append({
                "type": "report",
                "id": r.id,
                "title": r.title or "",
                "snippet": _safe_snippet(r.content or r.title, q),
                "region": r.region,
                "category": r.category,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

    if "proposal" in types:
        pq = db.query(models.NewProposal).filter(
            or_(
                models.NewProposal.title.ilike(pat),
                models.NewProposal.content.ilike(pat),
                models.NewProposal.region.ilike(pat),
                models.NewProposal.category.ilike(pat),
            )
        )
        if region:
            pq = pq.filter(models.NewProposal.region == region)
        for p in pq.order_by(desc(models.NewProposal.created_at)).limit(limit).all():
            out.append({
                "type": "proposal",
                "id": p.id,
                "title": p.title or "",
                "snippet": _safe_snippet(p.content or p.title, q),
                "region": p.region,
                "category": p.category,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            })

    if "survey" in types:
        sq = db.query(models.Survey).filter(
            or_(
                models.Survey.title.ilike(pat),
                models.Survey.description.ilike(pat),
            )
        )
        for s in sq.order_by(desc(models.Survey.created_at)).limit(limit).all():
            out.append({
                "type": "survey",
                "id": s.id,
                "title": s.title or "",
                "snippet": _safe_snippet(s.description or s.title, q),
                "region": None,
                "category": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })

    # newest first across types
    out.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return out[:limit]


@router.get("/suggest")
def search_suggest(
    q: str,
    limit: int = 8,
    db: Session = Depends(get_db),
):
    """타이핑 자동완성 — 제목 prefix 매칭만."""
    q = (q or "").strip()
    if not q or len(q) < 1:
        return []
    pat = f"{q}%"
    out = []
    for r in db.query(models.Report.title).filter(models.Report.title.ilike(pat)).limit(limit).all():
        if r[0]:
            out.append({"type": "report", "title": r[0]})
    for p in db.query(models.NewProposal.title).filter(models.NewProposal.title.ilike(pat)).limit(limit).all():
        if p[0]:
            out.append({"type": "proposal", "title": p[0]})
    return out[:limit]
