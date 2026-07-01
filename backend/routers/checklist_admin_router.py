"""진단(체크리스트) 어드민 관리 — 목록/상세/삭제/통계.

진단대상(시민/전문가) · 대분류 · 지역 · 검색 필터. 기존 ChecklistResult 데이터 기반.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database import get_db
import models
from .user_router import get_current_user, require_admin

router = APIRouter(prefix="/api/admin/diagnoses", tags=["admin-diagnoses"])


def _admin(user=Depends(get_current_user)):
    require_admin(user)
    return user


def _author_map(db, ids):
    out = {}
    if not ids:
        return out
    for u in db.query(models.User.user_id, models.User.name).filter(models.User.user_id.in_(list(ids))).all():
        out[u.user_id] = u.name
    return out


def _ser(c, author=None):
    return {
        "result_id": c.result_id, "target": c.진단대상 or "시민",
        "region": c.진단지역 or "", "district_code": c.district_code or "",
        "category": c.대분류 or "", "sub_category": c.중분류 or "",
        "title": c.질문기준 or "", "score": c.점수, "satisfaction": c.만족도 or "",
        "review": c.리뷰 or "", "author": author or c.ID or "익명",
        "lat": float(c.위도) if c.위도 is not None else None,
        "lng": float(c.경도) if c.경도 is not None else None,
        "image": c.이미지경로 or "",
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("")
def list_diagnoses(target: Optional[str] = None, category: Optional[str] = None,
                   region: Optional[str] = None, q: Optional[str] = None,
                   page: int = 1, size: int = 10, _=Depends(_admin), db: Session = Depends(get_db)):
    query = db.query(models.ChecklistResult)
    if target and target != "전체":
        query = query.filter(models.ChecklistResult.진단대상 == target)
    if category and category != "전체":
        query = query.filter(models.ChecklistResult.대분류 == category)
    if region:
        query = query.filter(models.ChecklistResult.진단지역.contains(region))
    if q:
        query = query.filter(models.ChecklistResult.질문기준.contains(q))
    query = query.order_by(models.ChecklistResult.result_id.desc())
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()
    amap = _author_map(db, {r.user_id for r in rows if r.user_id})
    return {"items": [_ser(r, amap.get(r.user_id)) for r in rows], "total": total, "page": page, "size": size}


@router.get("/stats")
def stats(_=Depends(_admin), db: Session = Depends(get_db)):
    total = db.query(models.ChecklistResult).count()
    by_target = dict(db.query(models.ChecklistResult.진단대상, func.count())
                     .group_by(models.ChecklistResult.진단대상).all())
    by_cat = dict(db.query(models.ChecklistResult.대분류, func.count())
                  .group_by(models.ChecklistResult.대분류).all())
    avg_score = db.query(func.avg(models.ChecklistResult.점수)).scalar()
    return {
        "total": total,
        "citizen": by_target.get("시민", 0), "expert": by_target.get("전문가", 0),
        "by_category": {k or "기타": v for k, v in by_cat.items()},
        "avg_score": round(float(avg_score), 1) if avg_score else None,
    }


@router.get("/{result_id}")
def detail(result_id: int, _=Depends(_admin), db: Session = Depends(get_db)):
    c = db.query(models.ChecklistResult).filter(models.ChecklistResult.result_id == result_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="없음")
    amap = _author_map(db, {c.user_id} if c.user_id else set())
    d = _ser(c, amap.get(c.user_id))
    d["answers"] = c.answers
    return d


@router.delete("/{result_id}")
def delete(result_id: int, _=Depends(_admin), db: Session = Depends(get_db)):
    c = db.query(models.ChecklistResult).filter(models.ChecklistResult.result_id == result_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="없음")
    db.delete(c)
    db.commit()
    return {"ok": True, "deleted": result_id}
