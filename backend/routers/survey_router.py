"""Survey endpoints — DB 기반."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from collections import Counter
import json

from database import get_db
import models, schemas
from .user_router import get_current_user, get_current_user_optional


def _require_admin(user: Optional[models.User]):
    if not user or user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


def _format_period(s: Optional[models.Survey]) -> str:
    if not s:
        return ""
    if s.period_start and s.period_end:
        return f"{s.period_start.strftime('%Y-%m-%d')} ~ {s.period_end.strftime('%Y-%m-%d')}"
    if s.period_end:
        return f"~{s.period_end.strftime('%Y-%m-%d')}"
    return ""


@router.get("/list")
def list_surveys(tab: Optional[str] = None, db: Session = Depends(get_db)):
    """tab=active → 진행중, tab=result → 종료/결과, 미지정 → 전체."""
    q = db.query(models.Survey)
    if tab == "active":
        q = q.filter(models.Survey.status == "active")
    elif tab == "result":
        q = q.filter(models.Survey.status.in_(["result", "closed"]))
    rows = q.order_by(models.Survey.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "minutes": s.minutes or 10,
            "period": _format_period(s),
            "status": s.status,
            "response_count": s.response_count or 0,
        }
        for s in rows
    ]


# =============================================================================
# Admin CRUD — 관리자만 호출. /admin 하위 prefix로 정적 경로 우선 매칭 보장.
# 참고: /{survey_id} 와일드카드 라우트는 파일 맨 아래에 등록해야
#       /admin 정적 경로와 충돌하지 않음.
# =============================================================================

@router.post("/admin", status_code=201)
def admin_create_survey(
    payload: schemas.SurveyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    s = models.Survey(
        title=payload.title,
        description=payload.description,
        minutes=payload.minutes,
        status=payload.status,
        period_start=payload.period_start,
        period_end=payload.period_end,
        author_id=current_user.user_id if current_user.user_id != 999999 else None,
        response_count=0,
    )
    db.add(s)
    db.flush()
    for idx, q in enumerate(payload.questions):
        db.add(models.SurveyQuestion(
            survey_id=s.id,
            order_no=q.order_no if q.order_no is not None else idx,
            qtype=q.qtype,
            text=q.text,
            options=q.options,
        ))
    db.commit()
    return {"id": s.id, "message": "설문이 생성되었습니다."}


@router.put("/admin/{survey_id}")
def admin_update_survey(
    survey_id: int,
    payload: schemas.SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    for k in ("title", "description", "minutes", "status", "period_start", "period_end"):
        v = getattr(payload, k, None)
        if v is not None:
            setattr(s, k, v)
    if payload.questions is not None:
        # 질문지 전체 교체
        db.query(models.SurveyQuestion).filter(models.SurveyQuestion.survey_id == survey_id).delete()
        for idx, q in enumerate(payload.questions):
            db.add(models.SurveyQuestion(
                survey_id=survey_id,
                order_no=q.order_no if q.order_no is not None else idx,
                qtype=q.qtype,
                text=q.text,
                options=q.options,
            ))
    db.commit()
    return {"message": "수정되었습니다."}


@router.delete("/admin/{survey_id}")
def admin_delete_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    # 응답·답변·질문 cascade 삭제
    qids = [q.id for q in db.query(models.SurveyQuestion).filter(models.SurveyQuestion.survey_id == survey_id).all()]
    rids = [r.id for r in db.query(models.SurveyResponse).filter(models.SurveyResponse.survey_id == survey_id).all()]
    if qids:
        db.query(models.SurveyAnswer).filter(models.SurveyAnswer.question_id.in_(qids)).delete(synchronize_session=False)
    if rids:
        db.query(models.SurveyAnswer).filter(models.SurveyAnswer.response_id.in_(rids)).delete(synchronize_session=False)
    db.query(models.SurveyResponse).filter(models.SurveyResponse.survey_id == survey_id).delete()
    db.query(models.SurveyQuestion).filter(models.SurveyQuestion.survey_id == survey_id).delete()
    db.delete(s)
    db.commit()
    return {"message": "삭제되었습니다."}


@router.post("/admin/{survey_id}/close")
def admin_close_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """설문 종료 → status=result로 전환."""
    _require_admin(current_user)
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    s.status = "result"
    db.commit()
    return {"message": "설문이 종료되었습니다.", "status": s.status}


@router.post("/admin/{survey_id}/duplicate", status_code=201)
def admin_duplicate_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """설문 복제 — 응답은 제외, 질문만 복사."""
    _require_admin(current_user)
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    new_s = models.Survey(
        title=f"{s.title} (복사본)",
        description=s.description,
        minutes=s.minutes,
        period_start=s.period_start,
        period_end=s.period_end,
        status="active",
        response_count=0,
        author_id=s.author_id,
    )
    db.add(new_s)
    db.flush()
    questions = db.query(models.SurveyQuestion).filter(models.SurveyQuestion.survey_id == survey_id).all()
    for q in questions:
        db.add(models.SurveyQuestion(
            survey_id=new_s.id,
            order_no=q.order_no,
            qtype=q.qtype,
            text=q.text,
            options=q.options,
        ))
    db.commit()
    return {"id": new_s.id, "message": "설문이 복제되었습니다."}


# ----- 개별 질문 CRUD -----

@router.post("/admin/{survey_id}/questions", status_code=201)
def admin_add_question(
    survey_id: int,
    payload: schemas.SurveyQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    next_order = (
        db.query(models.SurveyQuestion).filter(models.SurveyQuestion.survey_id == survey_id).count()
    )
    q = models.SurveyQuestion(
        survey_id=survey_id,
        order_no=payload.order_no if payload.order_no is not None else next_order,
        qtype=payload.qtype,
        text=payload.text,
        options=payload.options,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id, "message": "질문이 추가되었습니다."}


@router.put("/admin/{survey_id}/questions/{qid}")
def admin_update_question(
    survey_id: int,
    qid: int,
    payload: schemas.SurveyQuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(models.SurveyQuestion).filter(
        models.SurveyQuestion.id == qid, models.SurveyQuestion.survey_id == survey_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="질문을 찾을 수 없습니다.")
    q.qtype = payload.qtype
    q.text = payload.text
    q.options = payload.options
    if payload.order_no is not None:
        q.order_no = payload.order_no
    db.commit()
    return {"message": "질문이 수정되었습니다."}


@router.delete("/admin/{survey_id}/questions/{qid}")
def admin_delete_question(
    survey_id: int,
    qid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    q = db.query(models.SurveyQuestion).filter(
        models.SurveyQuestion.id == qid, models.SurveyQuestion.survey_id == survey_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="질문을 찾을 수 없습니다.")
    db.query(models.SurveyAnswer).filter(models.SurveyAnswer.question_id == qid).delete(synchronize_session=False)
    db.delete(q)
    db.commit()
    return {"message": "질문이 삭제되었습니다."}


# =============================================================================
# 공개 설문 상세 / 응답 제출 / 결과 — 반드시 admin 정적 경로 다음에 등록
# =============================================================================

@router.get("/{survey_id}")
def get_survey_detail(survey_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    questions = db.query(models.SurveyQuestion).filter(
        models.SurveyQuestion.survey_id == survey_id
    ).order_by(models.SurveyQuestion.order_no.asc()).all()
    return {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "minutes": s.minutes or 10,
        "period": _format_period(s),
        "status": s.status,
        "response_count": s.response_count or 0,
        "questions": [
            {
                "id": q.id,
                "order_no": q.order_no,
                "qtype": q.qtype,
                "text": q.text,
                "options": q.options if isinstance(q.options, list) else (json.loads(q.options) if q.options else []),
            }
            for q in questions
        ],
    }


@router.post("/{survey_id}/responses", status_code=201)
def submit_survey_response(
    survey_id: int,
    payload: schemas.SurveyResponseSubmit,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    resp = models.SurveyResponse(
        survey_id=survey_id,
        user_id=current_user.user_id if current_user else None,
    )
    db.add(resp)
    db.flush()
    for ans in payload.answers:
        v = ans.value
        if isinstance(v, (list, dict)):
            v = json.dumps(v, ensure_ascii=False)
        else:
            v = str(v) if v is not None else ""
        db.add(models.SurveyAnswer(response_id=resp.id, question_id=ans.question_id, value=v))
    s.response_count = (s.response_count or 0) + 1
    db.commit()
    return {"message": "응답이 제출되었습니다.", "response_id": resp.id}


@router.get("/{survey_id}/results")
def get_survey_results(survey_id: int, db: Session = Depends(get_db)):
    """질문별 응답 분포 집계."""
    s = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다.")
    questions = db.query(models.SurveyQuestion).filter(
        models.SurveyQuestion.survey_id == survey_id
    ).order_by(models.SurveyQuestion.order_no.asc()).all()

    qids = [q.id for q in questions]
    answers_by_q: dict = {}
    if qids:
        all_answers = db.query(models.SurveyAnswer).filter(
            models.SurveyAnswer.question_id.in_(qids)
        ).all()
        for a in all_answers:
            answers_by_q.setdefault(a.question_id, []).append(a)

    out = []
    for q in questions:
        answers = answers_by_q.get(q.id, [])
        opts = q.options if isinstance(q.options, list) else (json.loads(q.options) if q.options else [])
        if q.qtype in ("single", "agree"):
            counter = Counter([a.value for a in answers if a.value])
            distribution = [{"label": opt, "count": counter.get(opt, 0)} for opt in opts]
            out.append({"id": q.id, "text": q.text, "qtype": q.qtype, "distribution": distribution, "total": sum(counter.values())})
        elif q.qtype == "multi":
            counter = Counter()
            for a in answers:
                try:
                    vals = json.loads(a.value)
                    if isinstance(vals, list):
                        counter.update(vals)
                except Exception:
                    pass
            distribution = [{"label": opt, "count": counter.get(opt, 0)} for opt in opts]
            out.append({"id": q.id, "text": q.text, "qtype": q.qtype, "distribution": distribution, "total": sum(counter.values())})
        else:
            samples = [a.value for a in answers[:5] if a.value]
            out.append({"id": q.id, "text": q.text, "qtype": q.qtype, "samples": samples, "total": len(answers)})
    return {
        "id": s.id,
        "title": s.title,
        "response_count": s.response_count or 0,
        "questions": out,
    }
