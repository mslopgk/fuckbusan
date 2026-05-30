"""알림 + 활동로그 공용 헬퍼.

라우터에서 발생 이벤트를 명시적으로 호출.
실패해도 본 트랜잭션은 깨지면 안 됨 → try/except 보호.
"""
from typing import Optional
from sqlalchemy.orm import Session
import models


def push_notification(
    db: Session,
    *,
    user_id: int,
    kind: str,
    actor_id: Optional[int] = None,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    title: Optional[str] = None,
    body: Optional[str] = None,
    commit: bool = False,
):
    """user_id 사용자에게 알림 1건 push. 본인이 본인에게 보내는 건 skip."""
    try:
        if user_id is None:
            return None
        if actor_id is not None and actor_id >= 999990:
            return None  # admin/system 계정은 알림 발송 주체가 될 수 없음 (FK 없음)
        if actor_id is not None and actor_id == user_id:
            return None
        n = models.Notification(
            user_id=user_id,
            actor_id=actor_id,
            kind=kind,
            target_type=target_type,
            target_id=target_id,
            title=title,
            body=body[:480] if body else None,
        )
        db.add(n)
        if commit:
            db.commit()
        return n
    except Exception as e:
        print(f"[notification_utils] push failed: {e}")
        return None


def log_activity(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    meta: Optional[dict] = None,
    commit: bool = False,
):
    """활동 로그 기록. user_id None 가능 (익명/시스템)."""
    try:
        if user_id is not None and user_id >= 999990:
            return None
        a = models.ActivityLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            meta=meta,
        )
        db.add(a)
        if commit:
            db.commit()
        return a
    except Exception as e:
        print(f"[notification_utils] log failed: {e}")
        return None
