"""공지사항 + 홍보 (Announcement) — 어드민 CRUD + 공개 조회.

kind: 'notice'(공지사항) | 'promo'(홍보). 어드민 전용 쓰기, 공개 읽기 분리.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from .user_router import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["announcements"])


def _admin(user=Depends(get_current_user)):
    require_admin(user)
    return user


def _ser(a: "models.Announcement") -> dict:
    return {
        "id": a.id, "kind": a.kind, "title": a.title, "content": a.content,
        "category": a.category or "", "image_url": a.image_url or "", "link_url": a.link_url or "",
        "pinned": bool(a.pinned), "published": bool(a.published), "views": a.views or 0,
        "author": a.author or "관리자",
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }


class AnnouncementIn(BaseModel):
    kind: str = "notice"
    title: str
    content: Optional[str] = ""
    category: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    pinned: Optional[bool] = False
    published: Optional[bool] = True


class AnnouncementPatch(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    pinned: Optional[bool] = None
    published: Optional[bool] = None


# ── 공개 조회 ──
@router.get("/announcements")
def list_public(kind: str = "notice", page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    q = (db.query(models.Announcement)
         .filter(models.Announcement.kind == kind, models.Announcement.published == True)  # noqa: E712
         .order_by(models.Announcement.pinned.desc(), models.Announcement.created_at.desc()))
    total = q.count()
    rows = q.offset((page - 1) * size).limit(size).all()
    return {"items": [_ser(a) for a in rows], "total": total, "page": page, "size": size}


@router.get("/announcements/{aid}")
def get_public(aid: int, db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="없음")
    a.views = (a.views or 0) + 1
    db.commit()
    return _ser(a)


# ── 어드민 CRUD ──
@router.get("/admin/announcements")
def admin_list(kind: Optional[str] = None, q: Optional[str] = None,
               page: int = 1, size: int = 10, _=Depends(_admin), db: Session = Depends(get_db)):
    query = db.query(models.Announcement)
    if kind:
        query = query.filter(models.Announcement.kind == kind)
    if q:
        query = query.filter(models.Announcement.title.contains(q))
    query = query.order_by(models.Announcement.pinned.desc(), models.Announcement.created_at.desc())
    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()
    return {"items": [_ser(a) for a in rows], "total": total, "page": page, "size": size}


@router.post("/admin/announcements")
def admin_create(body: AnnouncementIn, user=Depends(_admin), db: Session = Depends(get_db)):
    a = models.Announcement(
        kind=body.kind if body.kind in ("notice", "promo") else "notice",
        title=body.title, content=body.content or "", category=body.category,
        image_url=body.image_url, link_url=body.link_url,
        pinned=bool(body.pinned), published=bool(body.published), author="관리자",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _ser(a)


@router.patch("/admin/announcements/{aid}")
def admin_update(aid: int, body: AnnouncementPatch, _=Depends(_admin), db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="없음")
    for k, v in body.dict(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return _ser(a)


@router.delete("/admin/announcements/{aid}")
def admin_delete(aid: int, _=Depends(_admin), db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="없음")
    db.delete(a)
    db.commit()
    return {"ok": True, "deleted": aid}
