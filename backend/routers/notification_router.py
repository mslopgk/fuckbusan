"""알림 API — 본인의 알림 조회/읽음처리."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
import models, schemas
from .user_router import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationRead])
def list_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.user_id == 999999:
        # admin은 user_id가 가짜라 실제 알림 없음 → 빈 배열
        return []
    q = db.query(models.Notification).filter(models.Notification.user_id == current_user.user_id)
    if unread_only:
        q = q.filter(models.Notification.is_read == False)
    rows = q.order_by(desc(models.Notification.created_at)).limit(min(limit, 200)).all()
    return rows


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.user_id == 999999:
        return {"count": 0}
    cnt = (
        db.query(func.count(models.Notification.id))
        .filter(models.Notification.user_id == current_user.user_id)
        .filter(models.Notification.is_read == False)
        .scalar()
        or 0
    )
    return {"count": cnt}


@router.patch("/{nid}/read")
def mark_read(
    nid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    n = db.query(models.Notification).filter(models.Notification.id == nid).first()
    if not n:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    if n.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 알림만 처리할 수 있습니다.")
    n.is_read = True
    db.commit()
    return {"message": "읽음 처리되었습니다."}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.user_id == 999999:
        return {"updated": 0}
    res = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.user_id)
        .filter(models.Notification.is_read == False)
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"updated": res or 0}


@router.delete("/{nid}")
def delete_notification(
    nid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    n = db.query(models.Notification).filter(models.Notification.id == nid).first()
    if not n:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    if n.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 알림만 삭제할 수 있습니다.")
    db.delete(n)
    db.commit()
    return {"message": "삭제되었습니다."}
