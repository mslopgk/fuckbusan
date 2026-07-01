"""어드민 RAG 관리 API — 상태 / 데이터소스 / 인덱싱 / 페르소나 생성.

대시보드(AdminRAGDashboard)가 호출. 관리자 전용.
RAG 엔진: rag/ 패키지 (shain1912/runway 코어 이식).
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
import models
from .user_router import get_current_user, require_admin
from rag import config as rag_config
from rag import ingest as rag_ingest
from rag import persona as rag_persona

router = APIRouter(prefix="/api/admin/rag", tags=["admin-rag"])


def _admin(user=Depends(get_current_user)):
    require_admin(user)
    return user


def _persona_brief(r: "models.Persona") -> dict:
    return {
        "id": r.id, "name": r.name, "age": r.age, "gender": r.gender or "",
        "district": r.district_code, "job": r.job or "", "quote": r.quote or "",
        "tags": r.tags or [], "categories": r.categories or [],
        "period": r.year or "", "importance": r.importance,
        "image_url": r.image_url or "", "avatar_initial": r.avatar_initial or "",
        "evidence_count": len(r.evidence or []),
        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
    }


def _persona_full(r: "models.Persona") -> dict:
    d = _persona_brief(r)
    d.update({
        "full_quote": r.full_quote or "", "detail": r.detail or {},
        "pain_points": r.pain_points or [], "suggestions": r.suggestions or {},
        "evidence": r.evidence or [], "generation_source": r.generation_source or "",
    })
    return d


@router.get("/status")
def status(_=Depends(_admin)):
    """Qdrant/의존성/LLM/인덱싱 포인트 상태 + 인덱싱 진행 상태."""
    s = rag_config.status()
    s["ingest"] = {k: rag_ingest.STATE.get(k) for k in ("running", "result", "error")}
    return s


@router.get("/sources")
def sources(_=Depends(_admin), db: Session = Depends(get_db)):
    """인덱싱 가능한 DB 데이터 건수(유형별)."""
    try:
        counts = rag_ingest.source_counts(db)
        return {"ok": True, "by_type": counts, "total": sum(counts.values())}
    except Exception as e:
        return {"ok": False, "error": str(e)}


class IngestReq(BaseModel):
    full: bool = False


@router.post("/ingest")
def ingest(req: IngestReq, _=Depends(_admin)):
    """DB 데이터 집계 → 임베딩 → Qdrant 적재 (백그라운드 실행, 즉시 반환).
    진행/결과는 GET /status 의 ingest 필드로 폴링."""
    started = rag_ingest.run_ingest_bg(full=req.full)
    if not started:
        return {"ok": False, "error": "이미 인덱싱이 진행 중입니다."}
    return {"ok": True, "started": True, "message": "인덱싱을 시작했습니다. 상태에서 진행을 확인하세요."}


class GenReq(BaseModel):
    district: str
    count: int = 3


@router.post("/generate-personas")
def generate_personas(req: GenReq, _=Depends(_admin), db: Session = Depends(get_db)):
    """지역 RAG 근거 기반 가상시민 페르소나 생성·저장."""
    if not req.district:
        raise HTTPException(status_code=400, detail="district 필요")
    n = max(1, min(req.count, 6))
    try:
        return rag_persona.generate(db, req.district, n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"생성 실패: {e}")


@router.get("/personas")
def list_rag_personas(district: Optional[str] = None, _=Depends(_admin), db: Session = Depends(get_db)):
    """RAG로 생성된 페르소나 목록 (생성 관리 페이지). district로 지역 필터."""
    q = db.query(models.Persona).filter(models.Persona.generation_source == "rag")
    if district:
        q = q.filter(models.Persona.district_code == district)
    rows = q.order_by(models.Persona.id.desc()).limit(200).all()
    return [_persona_brief(r) for r in rows]


@router.get("/personas/{pid}")
def get_rag_persona(pid: int, _=Depends(_admin), db: Session = Depends(get_db)):
    """페르소나 전체 상세 (상세 리포트 + 편집/내보내기용)."""
    r = db.query(models.Persona).filter(models.Persona.id == pid).first()
    if not r:
        raise HTTPException(status_code=404, detail="페르소나 없음")
    return _persona_full(r)


class PersonaPatch(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    job: Optional[str] = None
    quote: Optional[str] = None
    full_quote: Optional[str] = None
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    importance: Optional[int] = None
    detail: Optional[dict] = None


@router.patch("/personas/{pid}")
def update_rag_persona(pid: int, body: PersonaPatch, _=Depends(_admin), db: Session = Depends(get_db)):
    """페르소나 수기 편집 — 전달된 필드만 갱신. detail은 병합."""
    r = db.query(models.Persona).filter(models.Persona.id == pid).first()
    if not r:
        raise HTTPException(status_code=404, detail="페르소나 없음")
    data = body.dict(exclude_unset=True)
    new_detail = data.pop("detail", None)
    for k, v in data.items():
        setattr(r, k, v)
    if isinstance(new_detail, dict):
        merged = dict(r.detail or {})
        merged.update(new_detail)
        r.detail = merged  # JSON 컬럼은 재할당해야 변경 감지
        # detail.job 등 헤더 필드 동기화
        if new_detail.get("job"):
            r.job = new_detail["job"]
    db.commit()
    db.refresh(r)
    return _persona_full(r)


@router.delete("/personas/{pid}")
def delete_rag_persona(pid: int, _=Depends(_admin), db: Session = Depends(get_db)):
    r = db.query(models.Persona).filter(models.Persona.id == pid).first()
    if not r:
        raise HTTPException(status_code=404, detail="페르소나 없음")
    db.delete(r)
    db.commit()
    return {"ok": True, "deleted": pid}


# ── 가상시민데이터 관리 (소스 데이터 테이블 + 변환) ──────────────────────────

def _match(hay: str, needle: str) -> bool:
    return needle in (hay or "")


@router.get("/source-rows")
def source_rows(
    type: Optional[str] = Query(None, description="제보|제안|진단|설문|전체"),
    category: Optional[str] = None,
    region: Optional[str] = None,
    year: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1, size: int = 10,
    _=Depends(_admin), db: Session = Depends(get_db),
):
    """가상시민데이터 관리 테이블: 제보/제안/진단/설문 통합 행 (필터+페이지네이션+유형별 집계)."""
    rows = rag_ingest.source_rows(db)

    # 지역/연도/검색 필터 (유형 탭과 무관하게 집계 카드용 base)
    def base_ok(r):
        if region and not _match(r["region"], region):
            return False
        if year and not (r["created_at"] or "").startswith(str(year)):
            return False
        if category and category != "전체" and not _match(r["category"], category):
            return False
        if q and not (_match(r["title"], q) or _match(r["content"], q)):
            return False
        return True

    base = [r for r in rows if base_ok(r)]
    counts = {"전체": len(base), "제보": 0, "제안": 0, "진단": 0, "설문": 0}
    for r in base:
        counts[r["type"]] = counts.get(r["type"], 0) + 1

    filtered = base if (not type or type == "전체") else [r for r in base if r["type"] == type]
    total = len(filtered)
    start = max(0, (page - 1) * size)
    page_rows = filtered[start:start + size]
    # content는 표에 불필요(용량) → 제거
    for r in page_rows:
        r.pop("content", None)
    return {"rows": page_rows, "total": total, "page": page, "size": size, "counts": counts}


class RowRef(BaseModel):
    kind: str
    id: int


class ConvertReq(BaseModel):
    district: str
    period: Optional[str] = None
    rows: List[RowRef] = []


@router.post("/convert")
def convert_to_persona(req: ConvertReq, _=Depends(_admin), db: Session = Depends(get_db)):
    """선택한 데이터 행을 근거로 가상시민 1명 생성 (선택 행 grounding 우선)."""
    if not req.district:
        raise HTTPException(status_code=400, detail="district 필요")
    if not req.rows:
        raise HTTPException(status_code=400, detail="선택된 데이터가 없습니다")
    index = {f"{r['kind']}:{r['id']}": r for r in rag_ingest.source_rows(db)}
    sel = [index.get(f"{rf.kind}:{rf.id}") for rf in req.rows]
    sel = [s for s in sel if s]
    if not sel:
        raise HTTPException(status_code=400, detail="선택 데이터를 찾을 수 없습니다")
    grounding = "\n\n".join(
        f"- [{s['type']}] {s['title']} (지역:{s['region'] or '-'}/분류:{s['category'] or '-'}): {(s['content'] or '')[:240]}"
        for s in sel)
    evidence = [{"kind": s["kind"], "id": s["id"], "type": s["type"], "title": s["title"]} for s in sel]
    try:
        return rag_persona.generate(db, req.district, n=1, period=req.period,
                                    extra_grounding=grounding, evidence_override=evidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"변환 실패: {e}")
