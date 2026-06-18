"""어드민 RAG 관리 API — 상태 / 데이터소스 / 인덱싱 / 페르소나 생성.

대시보드(AdminRAGDashboard)가 호출. 관리자 전용.
RAG 엔진: rag/ 패키지 (shain1912/runway 코어 이식).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

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
def list_rag_personas(_=Depends(_admin), db: Session = Depends(get_db)):
    """RAG로 생성된 페르소나 목록."""
    rows = (db.query(models.Persona)
            .filter(models.Persona.generation_source == "rag")
            .order_by(models.Persona.id.desc()).limit(100).all())
    return [{"id": r.id, "name": r.name, "age": r.age, "district": r.district_code,
             "tags": r.tags, "generated_at": r.generated_at.isoformat() if r.generated_at else None}
            for r in rows]
