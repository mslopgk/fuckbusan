"""관리자 대시보드용 통계/요약 API."""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from database import get_db
import models, schemas
from .user_router import get_current_user
from notification_utils import push_notification, log_activity

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
    from sqlalchemy.orm import joinedload
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
    proposals = (
        db.query(models.NewProposal)
        .options(joinedload(models.NewProposal.creator))
        .order_by(desc(models.NewProposal.created_at))
        .limit(limit)
        .all()
    )
    for p in proposals:
        out.append({
            "kind": "proposal",
            "id": p.id,
            "title": p.title,
            "author": (p.creator.nickname or p.creator.name) if p.creator else "익명",
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
    region: Optional[str] = None,
    category: Optional[str] = None,
    page: Optional[int] = None,
    size: int = 50,
):
    """관리자 — 모든 제보 + 필터 + 페이지네이션."""
    _require_admin(current_user)
    q = db.query(models.Report)
    if status and status != "전체":
        q = q.filter(models.Report.status == status)
    if region and region != "전체":
        q = q.filter(models.Report.region == region)
    if category and category != "전체":
        q = q.filter(models.Report.category == category)
    q = q.order_by(desc(models.Report.created_at))

    total = q.count()
    if page is not None:
        size = max(1, min(size, 200))
        rows = q.offset((page - 1) * size).limit(size).all()
    else:
        rows = q.all()

    items = [
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

    if page is not None:
        return {"items": items, "total": total, "page": page, "size": size}
    return items


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
    old_status = r.status
    new_status = payload.get("status")
    new_step = payload.get("progress_step")
    if new_status:
        r.status = new_status
    if new_step is not None:
        r.progress_step = int(new_step)
    if "result_details" in payload:
        r.result_details = payload["result_details"]
    # 작성자에게 알림
    if r.user_id and new_status and new_status != old_status:
        push_notification(
            db,
            user_id=r.user_id,
            kind="status",
            target_type="report",
            target_id=r.id,
            title=f"제보 상태가 '{new_status}'로 업데이트되었습니다.",
            body=r.title or "",
        )
    log_activity(db, user_id=None, action="admin_update_status", target_type="report", target_id=r.id,
                 meta={"from": old_status, "to": new_status})
    db.commit()
    return {"message": "상태가 업데이트되었습니다.", "status": r.status, "progress_step": r.progress_step}


# =============================================================================
# 통계 트렌드
# =============================================================================

def _date_bucket_key(dt: datetime, period: str) -> str:
    if not dt:
        return ""
    if period == "month":
        return dt.strftime("%Y-%m")
    if period == "week":
        # ISO week
        y, w, _ = dt.isocalendar()
        return f"{y}-W{w:02d}"
    return dt.strftime("%Y-%m-%d")


@router.get("/trends")
def admin_trends(
    metric: str = "reports",
    period: str = "month",  # day | week | month
    range_days: int = 90,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """metric별 시계열. metric=reports|proposals|diagnoses|surveys."""
    _require_admin(current_user)
    metric_map = {
        "reports": (models.Report, models.Report.created_at),
        "proposals": (models.NewProposal, models.NewProposal.created_at),
        "diagnoses": (models.ChecklistResult, models.ChecklistResult.created_at),
        "surveys": (models.Survey, models.Survey.created_at),
    }
    if metric not in metric_map:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 metric: {metric}")
    Model, dt_col = metric_map[metric]
    cutoff = datetime.now() - timedelta(days=max(1, min(range_days, 365)))
    rows = db.query(dt_col).filter(dt_col >= cutoff).all()
    buckets = {}
    for (dt,) in rows:
        if not dt:
            continue
        k = _date_bucket_key(dt, period)
        buckets[k] = buckets.get(k, 0) + 1
    series = sorted(buckets.items(), key=lambda x: x[0])
    return {
        "metric": metric,
        "period": period,
        "range_days": range_days,
        "total": sum(buckets.values()),
        "series": [{"bucket": k, "count": v} for k, v in series],
    }


@router.get("/category-distribution")
def admin_category_distribution(
    target: str = "reports",  # reports | proposals
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    if target == "reports":
        rows = db.query(models.Report.category, func.count(models.Report.id)).group_by(models.Report.category).all()
    elif target == "proposals":
        rows = db.query(models.NewProposal.category, func.count(models.NewProposal.id)).group_by(models.NewProposal.category).all()
    else:
        raise HTTPException(status_code=400, detail="target must be reports|proposals")
    return [{"category": r[0] or "(미분류)", "count": r[1]} for r in rows]


@router.get("/district-leaderboard")
def admin_district_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """구별 활동량 순위 (제보+제안+진단)."""
    _require_admin(current_user)
    counts: dict = {}
    for region, c in db.query(models.Report.region, func.count(models.Report.id)).group_by(models.Report.region).all():
        if region:
            counts.setdefault(region, {"region": region, "reports": 0, "proposals": 0, "diagnoses": 0})
            counts[region]["reports"] = c
    for region, c in db.query(models.NewProposal.region, func.count(models.NewProposal.id)).group_by(models.NewProposal.region).all():
        if region:
            counts.setdefault(region, {"region": region, "reports": 0, "proposals": 0, "diagnoses": 0})
            counts[region]["proposals"] = c
    for region, c in db.query(models.ChecklistResult.진단지역, func.count(models.ChecklistResult.result_id)).group_by(models.ChecklistResult.진단지역).all():
        if region:
            counts.setdefault(region, {"region": region, "reports": 0, "proposals": 0, "diagnoses": 0})
            counts[region]["diagnoses"] = c
    out = []
    for v in counts.values():
        v["total"] = v["reports"] + v["proposals"] + v["diagnoses"]
        out.append(v)
    out.sort(key=lambda x: x["total"], reverse=True)
    return out


# =============================================================================
# 사용자 관리
# =============================================================================

@router.get("/users")
def admin_list_users(
    q: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    qry = db.query(models.User)
    if q:
        pat = f"%{q}%"
        qry = qry.filter(or_(models.User.ID.ilike(pat), models.User.name.ilike(pat), models.User.nickname.ilike(pat)))
    if district:
        qry = qry.filter(models.User.district_code == district)
    rows = qry.order_by(desc(models.User.created_at)).limit(min(limit, 500)).all()
    return [
        {
            "user_id": u.user_id,
            "ID": u.ID,
            "name": u.name,
            "nickname": u.nickname,
            "phone_num": u.phone_num,
            "district_code": u.district_code,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in rows
    ]


@router.delete("/reports/{report_id}")
def admin_delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    db.query(models.ReportComment).filter(models.ReportComment.report_id == report_id).delete()
    db.query(models.ReportLike).filter(models.ReportLike.report_id == report_id).delete()
    db.query(models.ReportImage).filter(models.ReportImage.report_id == report_id).delete()
    title = r.title
    db.delete(r)
    log_activity(db, user_id=None, action="admin_delete", target_type="report", target_id=report_id, meta={"title": title})
    db.commit()
    return {"message": "삭제되었습니다."}


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    u = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if u.ID == "admin":
        raise HTTPException(status_code=400, detail="관리자 계정은 삭제할 수 없습니다.")
    log_activity(db, user_id=None, action="admin_delete_user", target_type="user", target_id=user_id, meta={"ID": u.ID})
    db.delete(u)
    db.commit()
    return {"message": "사용자가 삭제되었습니다."}


@router.patch("/users/{user_id}")
def admin_patch_user(
    user_id: int,
    payload: schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    u = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    for k in ("nickname", "phone_num", "district_code"):
        v = getattr(payload, k, None)
        if v is not None:
            setattr(u, k, v)
    log_activity(db, user_id=None, action="admin_patch_user", target_type="user", target_id=user_id,
                 meta=payload.dict(exclude_unset=True))
    db.commit()
    return {"message": "사용자가 수정되었습니다."}


# =============================================================================
# 제안 관리
# =============================================================================

@router.get("/proposals")
def admin_list_proposals(
    category: Optional[str] = None,
    region: Optional[str] = None,
    page: Optional[int] = None,
    size: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    _require_admin(current_user)
    base_q = db.query(models.NewProposal)
    if category and category != "전체":
        base_q = base_q.filter(models.NewProposal.category == category)
    if region:
        base_q = base_q.filter(models.NewProposal.region == region)

    total = base_q.count()
    q = base_q.options(joinedload(models.NewProposal.creator)).order_by(desc(models.NewProposal.created_at))

    if page is not None:
        size = max(1, min(size, 200))
        rows = q.offset((page - 1) * size).limit(size).all()
    else:
        rows = q.all()

    # comment count batch
    ids = [p.id for p in rows]
    comment_counts = {}
    if ids:
        for pid, cnt in db.query(models.ProposalComment.proposal_id, func.count(models.ProposalComment.id)).filter(models.ProposalComment.proposal_id.in_(ids)).group_by(models.ProposalComment.proposal_id).all():
            comment_counts[pid] = cnt

    items = [
        {
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "region": p.region,
            "author": (p.creator.nickname or p.creator.name) if p.creator else "익명",
            "views": p.views_count or 0,
            "likes": p.likes_count or 0,
            "comments_count": comment_counts.get(p.id, 0),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in rows
    ]

    if page is not None:
        return {"items": items, "total": total, "page": page, "size": size}
    return items


@router.delete("/proposals/{proposal_id}")
def admin_delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    p = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")
    # cascade
    db.query(models.ProposalComment).filter(models.ProposalComment.proposal_id == proposal_id).delete()
    db.query(models.ProposalLike).filter(models.ProposalLike.proposal_id == proposal_id).delete()
    db.query(models.ProposalView).filter(models.ProposalView.proposal_id == proposal_id).delete()
    db.delete(p)
    log_activity(db, user_id=None, action="admin_delete", target_type="proposal", target_id=proposal_id, meta={"title": p.title})
    db.commit()
    return {"message": "삭제되었습니다."}


# =============================================================================
# 활동 로그 조회
# =============================================================================

@router.get("/activity-logs")
def admin_activity_logs(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(models.ActivityLog)
    if action:
        q = q.filter(models.ActivityLog.action == action)
    if target_type:
        q = q.filter(models.ActivityLog.target_type == target_type)
    rows = q.order_by(desc(models.ActivityLog.created_at)).limit(min(limit, 500)).all()
    return [
        {
            "id": a.id,
            "user_id": a.user_id,
            "action": a.action,
            "target_type": a.target_type,
            "target_id": a.target_id,
            "meta": a.meta,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in rows
    ]
