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
from .user_router import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/survey-chat", tags=["survey-chat"])


class StartResp(BaseModel):
    session_id: str
    greeting: str
    topic_name: str
    input_type: str = "text"
    choices: List[str] = []
    scale: Optional[dict] = None
    suggested_replies: List[str] = []


class MessageReq(BaseModel):
    session_id: str
    message: str


class MessageResp(BaseModel):
    response: str
    input_type: str = "text"
    choices: List[str] = []
    scale: Optional[dict] = None
    suggested_replies: List[str] = []
    info: dict = {}
    collected_issues: List[dict] = []
    is_complete: bool = False


def _persist(db: Session, session_id: str, issues: List[dict], user_id: Optional[int] = None) -> int:
    """수집된 이슈를 DB에 저장 (세션 중복 저장 방지). 로그인 사용자면 user_id 부착."""
    if not issues:
        return 0
    existing = db.query(models.SurveyChatInterview).filter_by(session_id=session_id).first()
    if existing:  # 이미 저장된 세션이면 스킵 (idempotent) — 단, 비로그인 저장분에 user_id 보정
        if user_id and existing.user_id is None:
            db.query(models.SurveyChatInterview).filter_by(session_id=session_id).update({"user_id": user_id})
            db.commit()
        return 0
    for iss in issues:
        db.add(models.SurveyChatInterview(
            session_id=session_id,
            user_id=user_id,
            issue_text=iss.get("issue_text"),
            severity_score=iss.get("severity_score"),
            primary_category=iss.get("primary_category"),
            location_bucket=iss.get("location_bucket"),
            evidence_span=iss.get("evidence_span"),
            raw_log=iss,
        ))
    db.commit()
    return len(issues)


def _save_session(db: Session, session_id: str, user_id: Optional[int],
                  title: str, transcript: List[dict], issue_count: int) -> None:
    """세션 단위 레코드(제목+대화내역) 저장/보정. idempotent."""
    row = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if row:
        # 이미 저장된 세션: 비로그인 저장분에 user_id만 보정
        if user_id and row.user_id is None:
            row.user_id = user_id
            db.commit()
        return
    db.add(models.SurveyChatSession(
        session_id=session_id,
        user_id=user_id,
        title=title,
        transcript=transcript,
        issue_count=issue_count,
    ))
    db.commit()


def _engine():
    try:
        return get_engine()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI 설문 서비스를 사용할 수 없습니다. ({e})")


@router.post("/start", response_model=StartResp)
def start():
    return _engine().start()


@router.post("/message", response_model=MessageResp)
async def message(req: MessageReq, db: Session = Depends(get_db),
                  current_user: Optional[models.User] = Depends(get_current_user_optional)):
    engine = _engine()
    if engine.get_session(req.session_id) is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")

    try:
        result = await engine.message(req.session_id, req.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI 응답 생성에 실패했습니다. ({e})")

    if result["is_complete"]:
        uid = current_user.user_id if current_user else None
        try:
            _persist(db, req.session_id, result["collected_issues"], user_id=uid)
            sess = engine.get_session(req.session_id) or {}
            title = await engine.summarize_title(sess)
            _save_session(db, req.session_id, uid, title,
                          sess.get("messages", []), len(result["collected_issues"]))
        except Exception as e:  # 저장 실패해도 대화는 유지
            print(f"[survey_chat] 저장 실패: {e}")

    return result


@router.post("/finish")
async def finish(req: MessageReq, db: Session = Depends(get_db),
                 current_user: Optional[models.User] = Depends(get_current_user_optional)):
    """대화를 강제 종료하고 지금까지 수집된 이슈를 저장."""
    engine = _engine()
    sess = engine.get_session(req.session_id)
    if sess is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    issues = list(sess.get("collected_issues", []))
    if sess.get("info", {}).get("issue_text"):
        issues.append(dict(sess["info"]))
    uid = current_user.user_id if current_user else None
    saved = _persist(db, req.session_id, issues, user_id=uid)
    try:
        title = await engine.summarize_title(sess)
        _save_session(db, req.session_id, uid, title, sess.get("messages", []), len(issues))
    except Exception as e:
        print(f"[survey_chat] 세션 저장 실패: {e}")
    sess["complete"] = True
    return {"saved": saved, "collected_issues": issues}


@router.get("/my")
def my_interviews(db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    """현재 로그인 사용자의 AI 대화형 설문 참여 목록 (세션당 1건, 최근순).
    나의 활동 '설문' 탭에서 일반 설문 참여와 함께 표시된다."""
    rows = (db.query(models.SurveyChatSession)
            .filter(models.SurveyChatSession.user_id == current_user.user_id)
            .order_by(models.SurveyChatSession.created_at.desc())
            .all())
    return [{
        "id": f"ai-{r.session_id}",
        "session_id": r.session_id,
        "survey_id": None,
        "kind": "ai",
        "title": r.title or "AI 대화형 설문",
        "status": "완료",
        "approval_status": "승인",
        "issue_count": r.issue_count or 0,
        "participated_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]


@router.get("/session/{session_id}")
def session_detail(session_id: str, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    """AI 대화형 설문 1건의 대화내역(이전 대화 다시보기). 본인 것만 조회 가능."""
    row = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="대화 기록을 찾을 수 없습니다.")
    if row.user_id is not None and row.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="본인의 대화 기록만 볼 수 있습니다.")
    transcript = row.transcript or []
    # 시스템/빈 메시지 제외, role/content만 정규화
    msgs = [{"role": m.get("role"), "content": m.get("content", "")}
            for m in transcript if m.get("role") in ("user", "assistant") and m.get("content")]
    return {
        "session_id": row.session_id,
        "title": row.title or "AI 대화형 설문",
        "issue_count": row.issue_count or 0,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "messages": msgs,
    }


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    """AI 대화형 설문 수집 이슈 집계 — 어드민 시각화용.
    토픽(카테고리)별 요약 카드 + 심각도/위치 분포 + 일자별 추이."""
    from collections import defaultdict, Counter
    rows = db.query(models.SurveyChatInterview).all()
    total = len(rows)

    cat = defaultdict(lambda: {"count": 0, "sev_sum": 0, "sev_n": 0, "sample": None})
    sev_dist = Counter()
    loc = Counter()
    by_day = Counter()
    for r in rows:
        c = (r.primary_category or "미분류").strip() or "미분류"
        cat[c]["count"] += 1
        if r.severity_score is not None:
            cat[c]["sev_sum"] += r.severity_score
            cat[c]["sev_n"] += 1
            sev_dist[int(r.severity_score)] += 1
        if not cat[c]["sample"] and r.issue_text:
            cat[c]["sample"] = r.issue_text[:60]
        if r.location_bucket:
            loc[r.location_bucket.strip()] += 1
        if r.created_at:
            by_day[r.created_at.strftime("%Y-%m-%d")] += 1

    topics = [{
        "category": k,
        "count": v["count"],
        "avg_severity": round(v["sev_sum"] / v["sev_n"], 1) if v["sev_n"] else None,
        "sample": v["sample"],
    } for k, v in sorted(cat.items(), key=lambda x: -x[1]["count"])]

    SEV_LABELS = ["별로", "조금", "보통", "심각", "매우 심각"]
    severity = [{"score": i, "label": SEV_LABELS[i], "count": sev_dist.get(i, 0)} for i in range(5)]
    locations = [{"location": k, "count": c} for k, c in loc.most_common(10)]
    timeline = [{"date": k, "count": by_day[k]} for k in sorted(by_day)]

    return {"total": total, "topics": topics, "severity": severity,
            "locations": locations, "timeline": timeline}


# 임베딩/좌표 캐시 (데이터 시그니처가 같으면 재계산·재과금 방지)
_cluster_cache: dict = {}


@router.get("/clusters")
def clusters(db: Session = Depends(get_db), k: Optional[int] = None, force: bool = False):
    """이슈 군집화(3D) — OpenAI 임베딩 + K-Means + t-SNE(3D 좌표).
    test4 analysis.py 시각화 이식. 데이터가 적으면 graceful 처리(>=4건).
    OpenAI 임베딩 비용이 있으므로 프론트에서 '재분석' 버튼으로만 호출.
    force=True면 데이터 변동이 없어도 캐시를 무시하고 재계산."""
    rows = [r for r in db.query(models.SurveyChatInterview).all() if (r.issue_text or "").strip()]
    n = len(rows)
    if n < 4:
        return {"points": [], "clusters": [], "k": 0,
                "note": f"군집화에는 최소 4건의 이슈가 필요합니다. (현재 {n}건)"}

    sig = f"{n}:{max(r.id for r in rows)}:{k or 0}"
    if not force and _cluster_cache.get("sig") == sig:
        return _cluster_cache["data"]

    try:
        import numpy as np
        from sklearn.cluster import KMeans
        from sklearn.manifold import TSNE
        from openai import OpenAI
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"군집화 의존성 미설치: {e}")

    texts = [r.issue_text.strip() for r in rows]
    try:
        client = OpenAI()
        emb_resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
        embs = np.array([d.embedding for d in emb_resp.data], dtype="float32")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"임베딩 생성 실패: {e}")

    kk = int(k) if k else max(2, min(5, n // 3))
    kk = min(kk, n)
    try:
        labels = KMeans(n_clusters=kk, random_state=42, n_init=10).fit_predict(embs)
    except Exception:
        labels = [0] * n

    # t-SNE 3D (perplexity < n_samples). 실패 시 PCA(3)로 폴백.
    try:
        perp = max(2, min(30, (n - 1) // 2))
        coords = TSNE(n_components=3, perplexity=perp, random_state=42,
                      init="pca").fit_transform(embs)
    except Exception:
        from sklearn.decomposition import PCA
        coords = PCA(n_components=3, random_state=42).fit_transform(embs)

    points = [{
        "id": r.id,
        "issue": (r.issue_text or "")[:80],
        "category": r.primary_category or "미분류",
        "severity": r.severity_score,
        "location": r.location_bucket,
        "x": float(coords[i][0]), "y": float(coords[i][1]), "z": float(coords[i][2]),
        "cluster": int(labels[i]),
    } for i, r in enumerate(rows)]

    # 군집별 대표 카테고리/건수
    from collections import Counter
    cmeta = []
    for c in range(kk):
        members = [p for p in points if p["cluster"] == c]
        if not members:
            continue
        top_cat = Counter(p["category"] for p in members).most_common(1)[0][0]
        cmeta.append({"cluster": c, "label": top_cat, "count": len(members)})

    data = {"points": points, "clusters": cmeta, "k": kk, "note": None}
    _cluster_cache["sig"] = sig
    _cluster_cache["data"] = data
    return data


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
