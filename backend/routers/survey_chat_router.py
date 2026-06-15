"""
AI 대화형 설문(인터뷰) API.

프론트(SurveyChat.jsx)가 호출:
  POST /api/survey-chat/start            → 세션 생성 + 인사말
  POST /api/survey-chat/message          → 사용자 발화 → AI 응답(+보기) + 수집상태
  POST /api/survey-chat/finish           → 강제 종료/저장
  GET  /api/survey-chat/results          → 수집된 인터뷰 목록(관리/대시보드)

원본 Streamlit 앱(test4)의 인터뷰 엔진을 백엔드로 이식. 엔진은 survey_chat/ 패키지 참조.
"""
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
from survey_chat.engine import get_engine

router = APIRouter(prefix="/api/survey-chat", tags=["survey-chat"])


class StartResp(BaseModel):
    session_id: str
    greeting: str
    topic_name: str
    suggested_replies: List[str] = []


class MessageReq(BaseModel):
    session_id: str
    message: str


class MessageResp(BaseModel):
    response: str
    suggested_replies: List[str] = []
    info: dict = {}
    collected_issues: List[dict] = []
    is_complete: bool = False


def _persist(db: Session, session_id: str, issues: List[dict]) -> int:
    """수집된 이슈를 DB에 저장 (세션 중복 저장 방지)."""
    if not issues:
        return 0
    existing = db.query(models.SurveyChatInterview).filter_by(session_id=session_id).count()
    if existing:  # 이미 저장된 세션이면 스킵 (idempotent)
        return 0
    for iss in issues:
        db.add(models.SurveyChatInterview(
            session_id=session_id,
            issue_text=iss.get("issue_text"),
            severity_score=iss.get("severity_score"),
            primary_category=iss.get("primary_category"),
            location_bucket=iss.get("location_bucket"),
            evidence_span=iss.get("evidence_span"),
            raw_log=iss,
        ))
    db.commit()
    return len(issues)


@router.post("/start", response_model=StartResp)
def start():
    return get_engine().start()


@router.post("/message", response_model=MessageResp)
async def message(req: MessageReq, db: Session = Depends(get_db)):
    engine = get_engine()
    if engine.get_session(req.session_id) is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")

    result = await engine.message(req.session_id, req.message)

    if result["is_complete"]:
        try:
            _persist(db, req.session_id, result["collected_issues"])
        except Exception as e:  # 저장 실패해도 대화는 유지
            print(f"[survey_chat] 저장 실패: {e}")

    return result


@router.post("/finish")
def finish(req: MessageReq, db: Session = Depends(get_db)):
    """대화를 강제 종료하고 지금까지 수집된 이슈를 저장."""
    engine = get_engine()
    sess = engine.get_session(req.session_id)
    if sess is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    issues = list(sess.get("collected_issues", []))
    if sess.get("info", {}).get("issue_text"):
        issues.append(dict(sess["info"]))
    saved = _persist(db, req.session_id, issues)
    sess["complete"] = True
    return {"saved": saved, "collected_issues": issues}


@router.get("/results")
def results(limit: int = 100, db: Session = Depends(get_db)):
    rows = (db.query(models.SurveyChatInterview)
            .order_by(models.SurveyChatInterview.id.desc())
            .limit(min(limit, 500)).all())
    return [{
        "id": r.id,
        "session_id": r.session_id,
        "issue_text": r.issue_text,
        "severity_score": r.severity_score,
        "primary_category": r.primary_category,
        "location_bucket": r.location_bucket,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]
