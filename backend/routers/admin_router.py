"""관리자 대시보드용 통계/요약 API."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
import models
from .user_router import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(user):
    if not user or user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")


@router.get("/stats")
def admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """관리자 대시보드 KPI."""
    _require_admin(current_user)
    return {
        "users_count": db.query(func.count(models.User.user_id)).scalar() or 0,
        "reports_count": db.query(func.count(models.Report.id)).scalar() or 0,
        "proposals_count": db.query(func.count(models.NewProposal.id)).scalar() or 0,
        "diagnoses_count": db.query(func.count(models.ChecklistResult.result_id)).scalar() or 0,
        "surveys_count": db.query(func.count(models.Survey.id)).scalar() or 0,
        "survey_responses_count": db.query(func.count(models.SurveyResponse.id)).scalar() or 0,
        "reports_by_status": _group_count(db, models.Report, models.Report.status),
        "reports_by_category": _group_count(db, models.Report, models.Report.category),
        "proposals_by_category": _group_count(db, models.NewProposal, models.NewProposal.category),
    }


def _group_count(db: Session, model, col):
    rows = db.query(col, func.count(model.id)).group_by(col).all()
    return [{"key": r[0], "count": r[1]} for r in rows if r[0]]


@router.get("/recent-activity")
def admin_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """최근 활동 — 제보/제안/진단 mix."""
    _require_admin(current_user)
    out = []
    for r in db.query(models.Report).order_by(desc(models.Report.created_at)).limit(limit).all():
        out.append({
            "kind": "report",
            "id": r.id,
            "title": r.title,
            "author": r.author_name,
            "region": r.region,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    for p in db.query(models.NewProposal).order_by(desc(models.NewProposal.created_at)).limit(limit).all():
        out.append({
            "kind": "proposal",
            "id": p.id,
            "title": p.title,
            "author": p.creator.nickname if p.creator else "익명",
            "region": p.region,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    for c in db.query(models.ChecklistResult).order_by(desc(models.ChecklistResult.created_at)).limit(limit).all():
        out.append({
            "kind": "diagnosis",
            "id": c.result_id,
            "title": f"{c.대분류 or ''} 진단 — {c.진단지역 or ''}",
            "author": c.ID,
            "region": c.진단지역,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    out.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return out[:limit]


@router.get("/reports")
def admin_list_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    status: Optional[str] = None,
):
    """관리자 — 모든 제보 + 필터."""
    _require_admin(current_user)
    q = db.query(models.Report)
    if status:
        q = q.filter(models.Report.status == status)
    rows = q.order_by(desc(models.Report.created_at)).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "author": r.author_name,
            "category": r.category,
            "region": r.region,
            "status": r.status,
            "progress_step": r.progress_step,
            "views": r.views or 0,
            "likes": r.likes_count or 0,
            "comments": r.comments_count or 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.put("/reports/{report_id}/status")
def admin_update_report_status(
    report_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    new_status = payload.get("status")
    new_step = payload.get("progress_step")
    if new_status:
        r.status = new_status
    if new_step is not None:
        r.progress_step = int(new_step)
    if "result_details" in payload:
        r.result_details = payload["result_details"]
    db.commit()
    return {"message": "상태가 업데이트되었습니다.", "status": r.status, "progress_step": r.progress_step}
