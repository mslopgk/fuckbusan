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
from .user_router import get_current_user, get_current_user_optional, require_admin

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


def _get_settings_row(db: Session) -> models.SurveyChatSetting:
    """싱글턴 설정(id=1) 조회 — 없으면 생성."""
    row = db.query(models.SurveyChatSetting).filter_by(id=1).first()
    if row is None:
        row = models.SurveyChatSetting(id=1, keywords=[], speed_buttons=[])
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.post("/start", response_model=StartResp)
def start(db: Session = Depends(get_db)):
    row = _get_settings_row(db)
    return _engine().start(keywords=row.keywords or [], speed_buttons=row.speed_buttons or [])


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


# =============================================================================
# 어드민: AI 대화형 설문 "응답" 관리 (Figma 설문목록 302-29426 / 설문현황 302-28185)
# =============================================================================
import io
import json as _json
import re

# 설문유형/진입유형 — AI 대화형 설문 엔진은 "불편사항 수집" 단일 플로우이므로 세션 공통값.
_SURVEY_KIND = "불편사항"
# 제출유형 — 이 세션들은 AI 대화형 설문 참여분.
_SUBMIT_KIND = "설문"

# 문제유형(primary_category): 엔진 config.py REQUIRED_FIELDS 의 옵션 id → 한글 라벨
_CATEGORY_LABEL = {
    "safety": "안전",
    "accessibility": "접근성",
    "wayfinding": "길찾기",
    "comfort": "쾌적성/미관",
    "other": "기타",
}
# 시급도(severity_score 0~4) → Figma 어휘(낮음/보통/높음)
_SEVERITY_LABEL = {0: "낮음", 1: "낮음", 2: "보통", 3: "높음", 4: "높음"}


# 부산 16개 구·군 (지역 추출 화이트리스트 — '출구/입구' 같은 오탐 방지)
_BUSAN_DISTRICTS = [
    "강서구", "금정구", "남구", "동구", "동래구", "부산진구", "북구", "사상구",
    "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구", "기장군",
]


def _region_from_location(loc: Optional[str]) -> Optional[str]:
    """location_bucket 문자열에서 부산 구·군 지역명을 추출. (예: '부산 해운대구 ...' → '해운대구')
    알려진 구·군이 없으면 None (랜드마크/오탐을 지역으로 지어내지 않음)."""
    if not loc:
        return None
    for d in _BUSAN_DISTRICTS:
        if d in loc:
            return d
    return None


def _cat_label(cat: Optional[str]) -> Optional[str]:
    if not cat:
        return None
    return _CATEGORY_LABEL.get(cat, cat)


def _primary_interview(db: Session, session_id: str):
    """세션의 대표 이슈 1건(가장 먼저 수집된 것). 다중 이슈 세션도 대표값으로 표시."""
    return (db.query(models.SurveyChatInterview)
            .filter_by(session_id=session_id)
            .order_by(models.SurveyChatInterview.id.asc())
            .first())


def _attachment_urls(interview) -> List[str]:
    """대화형 설문은 텍스트 기반이라 첨부 이미지가 없는 것이 일반적.
    raw_log 안에 image/photo/attachment url 이 있으면 추출(추후 이미지 첨부 지원 대비)."""
    if not interview or not interview.raw_log:
        return []
    urls: List[str] = []
    rl = interview.raw_log if isinstance(interview.raw_log, dict) else {}
    for k in ("image_url", "image", "images", "photo", "attachment", "attachments"):
        v = rl.get(k)
        if isinstance(v, str) and v.startswith("http"):
            urls.append(v)
        elif isinstance(v, list):
            urls += [x for x in v if isinstance(x, str) and x.startswith("http")]
    return urls


@router.get("/admin/list")
def admin_list(q: Optional[str] = None, region: Optional[str] = None,
               name: Optional[str] = None,
               page: int = 1, size: int = 10,
               db: Session = Depends(get_db),
               current_user: models.User = Depends(get_current_user)):
    """AI 대화형 설문 응답(세션) 목록 — 어드민 설문목록.
    컬럼: 지역 / 응답자(회원명) / 수정(일시) / 설문유형 / 메뉴. region·q·name 검색, 페이지네이션."""
    require_admin(current_user)
    sessions = (db.query(models.SurveyChatSession)
                .order_by(models.SurveyChatSession.created_at.desc())
                .all())

    # 세션별 대표 이슈(지역 추출용)를 한 번에 로드
    prim: dict = {}
    for iv in (db.query(models.SurveyChatInterview)
               .order_by(models.SurveyChatInterview.id.asc()).all()):
        prim.setdefault(iv.session_id, iv)

    # 응답자(회원명) 매핑 — user_id → 이름 (문의사항 답변서 [1-2])
    uid_set = {s.user_id for s in sessions if getattr(s, "user_id", None)}
    users = (db.query(models.User).filter(models.User.user_id.in_(uid_set)).all()
             if uid_set else [])
    uid_name = {u.user_id: (u.name or u.nickname or "-") for u in users}

    items = []
    for s in sessions:
        iv = prim.get(s.session_id)
        region_name = _region_from_location(iv.location_bucket if iv else None)
        uid = getattr(s, "user_id", None)
        respondent = uid_name.get(uid) if uid else None
        items.append({
            "id": s.session_id,
            "session_id": s.session_id,
            "region": region_name or "-",
            "respondent": respondent or "비회원",
            "survey_type": _SURVEY_KIND,
            "title": s.title or "AI 대화형 설문",
            "status": s.status or "신규",
            "issue_count": s.issue_count or 0,
            "updated_at": (s.updated_at or s.created_at).isoformat()
                          if (s.updated_at or s.created_at) else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    # 검색 필터
    if region:
        items = [it for it in items if region in (it["region"] or "")]
    if name:
        items = [it for it in items if name in (it["respondent"] or "")]
    if q:
        items = [it for it in items if q in (it["title"] or "")
                 or q in (it["survey_type"] or "") or q in (it["respondent"] or "")]

    total = len(items)
    page = max(1, page)
    start = (page - 1) * size
    return {"items": items[start:start + size], "total": total,
            "page": page, "size": size}


# =============================================================================
# AI설문 설정 — 주제 키워드 + 스피드버튼 (문의사항 답변서 [1-1]/[2-2])
# 주의: /admin/{session_id} 보다 먼저 선언해야 'settings'가 session_id로 안 잡힘
# =============================================================================
class SurveyChatSettingUpdate(BaseModel):
    keywords: List[str] = []
    speed_buttons: List[str] = []


def _clean_list(xs) -> List[str]:
    seen, out = set(), []
    for x in (xs or []):
        v = str(x).strip()
        if v and v not in seen:
            seen.add(v)
            out.append(v)
    return out


@router.get("/admin/settings")
def get_survey_settings(db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    """AI설문 설정 조회 — 관리자 '설문설정' 탭."""
    require_admin(current_user)
    row = _get_settings_row(db)
    return {"keywords": row.keywords or [], "speed_buttons": row.speed_buttons or [],
            "updated_at": row.updated_at.isoformat() if row.updated_at else None}


@router.put("/admin/settings")
def update_survey_settings(body: SurveyChatSettingUpdate, db: Session = Depends(get_db),
                           current_user: models.User = Depends(get_current_user)):
    """AI설문 설정 저장 — 키워드/스피드버튼 목록·순서."""
    require_admin(current_user)
    row = _get_settings_row(db)
    row.keywords = _clean_list(body.keywords)
    row.speed_buttons = _clean_list(body.speed_buttons)
    db.commit()
    db.refresh(row)
    return {"keywords": row.keywords, "speed_buttons": row.speed_buttons,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None}


@router.get("/admin/{session_id}")
def admin_detail(session_id: str, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """AI 대화형 설문 응답 1건 상세 — 어드민 설문현황.
    접수일시/진입유형/제출유형/장소/문제유형/시급도/처리상태/첨부 + 대화 transcript."""
    require_admin(current_user)
    s = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if s is None:
        raise HTTPException(status_code=404, detail="설문 응답을 찾을 수 없습니다.")
    iv = _primary_interview(db, session_id)

    transcript = s.transcript or []
    msgs = [{"role": m.get("role"), "content": m.get("content", "")}
            for m in transcript if m.get("role") in ("user", "assistant") and m.get("content")]

    sev = iv.severity_score if iv else None
    return {
        "id": s.session_id,
        "session_id": s.session_id,
        "title": s.title or "AI 대화형 설문",
        "received_at": s.created_at.isoformat() if s.created_at else None,   # 접수일시
        "entry_type": _SURVEY_KIND,                                          # 진입유형
        "submit_type": _SUBMIT_KIND,                                         # 제출유형
        "location": (iv.location_bucket if iv else None) or "-",            # 장소
        "problem_type": _cat_label(iv.primary_category if iv else None) or "-",  # 문제유형
        "severity": _SEVERITY_LABEL.get(sev, "-") if sev is not None else "-",   # 시급도
        "severity_score": sev,
        "status": s.status or "신규",                                        # 처리상태
        "attachments": _attachment_urls(iv),                                # 첨부(이미지 url)
        "issue_text": (iv.issue_text if iv else None) or "-",
        "issue_count": s.issue_count or 0,
        "messages": msgs,                                                    # 대화 transcript
    }


class SurveyAdminUpdate(BaseModel):
    status: Optional[str] = None


@router.put("/admin/{session_id}")
def admin_update(session_id: str, body: SurveyAdminUpdate,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """처리상태 등 수정 ('수정하기' 버튼)."""
    require_admin(current_user)
    s = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if s is None:
        raise HTTPException(status_code=404, detail="설문 응답을 찾을 수 없습니다.")
    if body.status is not None:
        s.status = body.status.strip() or "신규"
    db.commit()
    return {"ok": True, "session_id": s.session_id, "status": s.status,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None}


@router.delete("/admin/{session_id}")
def admin_delete(session_id: str, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """설문 응답 삭제 (목록 메뉴). 세션 + 관련 인터뷰 이슈 함께 삭제."""
    require_admin(current_user)
    s = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if s is None:
        raise HTTPException(status_code=404, detail="설문 응답을 찾을 수 없습니다.")
    db.query(models.SurveyChatInterview).filter_by(session_id=session_id).delete()
    db.delete(s)
    db.commit()
    return {"ok": True, "deleted": session_id}


@router.get("/admin/{session_id}/export")
def admin_export(session_id: str, fmt: str = "txt",
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """대화 내보내기 — 대화 transcript 를 텍스트/JSON 로 반환(프론트에서 파일 다운로드)."""
    require_admin(current_user)
    from fastapi.responses import StreamingResponse
    s = db.query(models.SurveyChatSession).filter_by(session_id=session_id).first()
    if s is None:
        raise HTTPException(status_code=404, detail="설문 응답을 찾을 수 없습니다.")
    transcript = s.transcript or []
    msgs = [{"role": m.get("role"), "content": m.get("content", "")}
            for m in transcript if m.get("role") in ("user", "assistant") and m.get("content")]

    if fmt == "json":
        payload = {
            "session_id": s.session_id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "messages": msgs,
        }
        data = _json.dumps(payload, ensure_ascii=False, indent=2)
        media, ext = "application/json", "json"
    else:
        lines = [f"[AI 대화형 설문 내보내기]",
                 f"제목: {s.title or 'AI 대화형 설문'}",
                 f"세션: {s.session_id}",
                 f"접수일시: {s.created_at.isoformat() if s.created_at else '-'}",
                 "-" * 40]
        for m in msgs:
            who = "사용자" if m["role"] == "user" else "AI"
            lines.append(f"{who}: {m['content']}")
        data = "\n".join(lines)
        media, ext = "text/plain; charset=utf-8", "txt"

    buf = io.BytesIO(data.encode("utf-8"))
    filename = f"survey_chat_{s.session_id}.{ext}"
    return StreamingResponse(
        buf, media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'})


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
