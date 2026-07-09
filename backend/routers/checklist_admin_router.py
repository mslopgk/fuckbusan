"""진단(체크리스트) 어드민 관리 — 목록/상세/삭제/통계.

진단대상(시민/전문가) · 대분류 · 지역 · 검색 필터. 기존 ChecklistResult 데이터 기반.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from database import get_db
import models
import schemas
from .user_router import get_current_user, require_admin

router = APIRouter(prefix="/api/admin/diagnoses", tags=["admin-diagnoses"])

# 진단 지역 registry (등록/수정/삭제 + 지역별 진단수/인원 집계)
regions_router = APIRouter(prefix="/api/admin/diagnosis-regions", tags=["admin-diagnosis-regions"])


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


# =============================================================================
# 진단 지역 registry — /api/admin/diagnosis-regions
# =============================================================================

def seed_diagnosis_regions(db: Session):
    """ChecklistResult.진단지역 의 distinct 값들 중 registry 에 없는 이름만 삽입.

    앱 기동 시 1회 호출 (idempotent). 진단 기록이 있는 지역은 자동으로 목록에 뜬다.
    """
    existing = {r.name for r in db.query(models.DiagnosisRegion.name).all()}
    names = [
        n for (n,) in db.query(models.ChecklistResult.진단지역)
        .filter(models.ChecklistResult.진단지역.isnot(None))
        .distinct().all()
        if n and n.strip() and n.strip() not in existing
    ]
    added = 0
    for n in names:
        db.add(models.DiagnosisRegion(name=n.strip()))
        added += 1
    if added:
        db.commit()
    return added


def _region_counts(db, name):
    q = db.query(models.ChecklistResult).filter(models.ChecklistResult.진단지역 == name)
    diagnosis_count = q.count()
    participant_count = (
        db.query(func.count(func.distinct(models.ChecklistResult.user_id)))
        .filter(models.ChecklistResult.진단지역 == name)
        .scalar()
    ) or 0
    return diagnosis_count, participant_count


def _region_out(db, r):
    dc, pc = _region_counts(db, r.name)
    return {
        "id": r.id, "name": r.name, "district_code": r.district_code or "",
        "latitude": float(r.latitude) if r.latitude is not None else None,
        "longitude": float(r.longitude) if r.longitude is not None else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "diagnosis_count": dc, "participant_count": pc,
    }


@regions_router.get("")
def list_regions(q: Optional[str] = None, page: int = 1, size: int = 10,
                 _=Depends(_admin), db: Session = Depends(get_db)):
    # 진단 기록에서 새로 생긴 지역을 목록 조회 시에도 자동 반영 (idempotent)
    try:
        seed_diagnosis_regions(db)
    except Exception:
        db.rollback()
    query = db.query(models.DiagnosisRegion)
    if q:
        query = query.filter(models.DiagnosisRegion.name.contains(q))
    query = query.order_by(models.DiagnosisRegion.id.asc())
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()
    return {"items": [_region_out(db, r) for r in rows], "total": total, "page": page, "size": size}


@regions_router.post("")
def create_region(body: schemas.DiagnosisRegionCreate, _=Depends(_admin), db: Session = Depends(get_db)):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="지역명을 입력해주세요")
    if db.query(models.DiagnosisRegion).filter(models.DiagnosisRegion.name == name).first():
        raise HTTPException(status_code=409, detail="이미 등록된 지역명입니다")
    r = models.DiagnosisRegion(
        name=name, district_code=(body.district_code or None),
        latitude=body.latitude, longitude=body.longitude,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _region_out(db, r)


@regions_router.put("/{region_id}")
def update_region(region_id: int, body: schemas.DiagnosisRegionUpdate,
                  _=Depends(_admin), db: Session = Depends(get_db)):
    r = db.query(models.DiagnosisRegion).filter(models.DiagnosisRegion.id == region_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="없음")
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="지역명을 입력해주세요")
        dup = db.query(models.DiagnosisRegion).filter(
            models.DiagnosisRegion.name == name, models.DiagnosisRegion.id != region_id).first()
        if dup:
            raise HTTPException(status_code=409, detail="이미 등록된 지역명입니다")
        r.name = name
    if body.district_code is not None:
        r.district_code = body.district_code or None
    if body.latitude is not None:
        r.latitude = body.latitude
    if body.longitude is not None:
        r.longitude = body.longitude
    db.commit()
    db.refresh(r)
    return _region_out(db, r)


@regions_router.delete("/{region_id}")
def delete_region(region_id: int, _=Depends(_admin), db: Session = Depends(get_db)):
    r = db.query(models.DiagnosisRegion).filter(models.DiagnosisRegion.id == region_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="없음")
    db.delete(r)  # 진단 기록(ChecklistResult)은 건드리지 않음
    db.commit()
    return {"ok": True, "deleted": region_id}
