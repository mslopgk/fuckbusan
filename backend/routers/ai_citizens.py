from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import httpx
import base64
import os

from database import get_db
import models

router = APIRouter(prefix="/api/ai-citizens", tags=["AI Citizens"])

_ROUTERS_DIR = os.path.dirname(os.path.abspath(__file__))
_IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
AVATARS_DIR = (
    "/tmp/uploads/avatars" if _IS_LAMBDA
    else os.path.join(_ROUTERS_DIR, "..", "uploads", "avatars")
)


class AICitizen(BaseModel):
    id: int
    name: str
    age: int
    district: str
    tags: List[str]
    categories: List[str]
    quote: str
    avatar_initial: str
    importance: int


CATEGORY_MAP = {
    "all": None,
    "safety": "안전",
    "housing": "주거",
    "work": "산업일자리",
    "edu": "교육",
    "env": "환경",
    "culture": "문화여가",
    "health": "보건복지",
    "traffic": "교통",
}


def _avatar_path(citizen_id: int) -> str:
    return os.path.join(AVATARS_DIR, f"{citizen_id}.png")


def _avatar_url(citizen_id: int) -> str:
    return f"/uploads/avatars/{citizen_id}.png"


def _build_prompt(citizen: dict) -> str:
    age = citizen["age"]
    gender = citizen.get("gender", "남성")
    gender_explicit = (
        "female woman with clearly feminine facial features, feminine hairstyle"
        if gender == "여성"
        else "male man with clearly masculine facial features"
    )
    tags = [t.lstrip("#") for t in (citizen.get("tags") or [])[:3]]
    tag_desc = ", ".join(tags)
    return (
        f"3D cartoon portrait of a Korean {age}-year-old {gender_explicit}, "
        f"personality traits: {tag_desc}, "
        "Pixar-style 3D character, "
        "warm friendly smile, relaxed natural expression, slight head tilt, "
        "head and shoulders centered in frame, clean light gray background, "
        "portrait orientation (taller than wide), "
        "soft studio lighting, vibrant colors, "
        "no text, no watermark, no border"
    )


def _serialize_persona(p: "models.Persona", include_detail: bool = False) -> dict:
    """Persona ORM 객체를 프론트 응답 형태로 변환.

    프론트는 district(라벨), categories, tags, avatar_initial, quote 등을 기대.
    """
    result = {
        "id": p.id,
        "name": p.name,
        "age": p.age,
        "district": p.district_code,  # 라벨 그대로 (예: "해운대구")
        "gender": p.gender,
        "tags": p.tags or [],
        "categories": p.categories or [],
        "quote": p.quote,
        "avatar_initial": p.avatar_initial or (p.name[0] if p.name else ""),
        "importance": p.importance if p.importance is not None else 100,  # 0=대표(최상위)이므로 `or` 금지
    }
    if include_detail:
        # detail에 풍부한 본문(voices/journey/policy_signals 등) 포함
        # job 등 일부 필드는 detail과 별도 컬럼에 모두 보관되어 있어, detail이 우선.
        merged_detail = dict(p.detail or {})
        if p.job and "job" not in merged_detail:
            merged_detail["job"] = p.job
        if p.full_quote and "body_language" not in merged_detail:
            merged_detail["body_language"] = p.full_quote
        result["detail"] = merged_detail
        # RAG 메타데이터는 디버깅·UI 표시용으로 노출
        result["generation_source"] = p.generation_source or "seed"
        if p.generated_at:
            result["generated_at"] = p.generated_at.isoformat()
    return result


@router.get("", response_model=List[dict])
def list_citizens(
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query("importance"),
    db: Session = Depends(get_db),
):
    q = db.query(models.Persona)
    if district and district != "전체":
        q = q.filter(models.Persona.district_code == district)
    if sort == "age":
        q = q.order_by(models.Persona.age.asc())
    else:
        q = q.order_by(models.Persona.importance.asc(), models.Persona.id.asc())

    rows = q.all()

    cat_label = CATEGORY_MAP.get(category) if category else None
    if cat_label:
        rows = [r for r in rows if cat_label in (r.categories or [])]

    return [_serialize_persona(r) for r in rows]


@router.get("/{citizen_id}", response_model=dict)
def get_citizen(citizen_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Persona).filter(models.Persona.id == citizen_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="시민을 찾을 수 없습니다.")
    return _serialize_persona(p, include_detail=True)


class ChatReq(BaseModel):
    message: str
    history: List[dict] = []


@router.post("/{citizen_id}/chat")
def chat_with_citizen(citizen_id: int, req: ChatReq, db: Session = Depends(get_db)):
    """AI 가상시민과 1인칭 대화 (RAG 그라운딩). PersonaChat 프론트 계약."""
    p = db.query(models.Persona).filter(models.Persona.id == citizen_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="시민을 찾을 수 없습니다.")
    if not (req.message or "").strip():
        raise HTTPException(status_code=400, detail="메시지가 비어 있습니다.")
    from rag import chat as rag_chat
    return rag_chat.chat(p, req.message.strip(), req.history)


async def generate_avatar_bytes(prompt: str) -> bytes:
    """Imagen 4(fast)로 아바타 PNG bytes 생성. AI 가상시민/회원 프로필 공용 파이프라인."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    imagen_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"imagen-4.0-fast-generate-001:predict?key={api_key}"
    )

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(imagen_url, json={
                "instances": [{"prompt": prompt}],
                "parameters": {"sampleCount": 1, "aspectRatio": "3:4"},
            })
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 429:
            raise HTTPException(status_code=429, detail="Imagen API 쿼터 초과. 잠시 후 다시 시도해주세요.")
        raise HTTPException(status_code=502, detail=f"Imagen API 오류: {status}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Imagen API 연결 실패: {str(e)}")

    b64 = data["predictions"][0]["bytesBase64Encoded"]
    return base64.b64decode(b64)


async def _generate_avatar(citizen_id: int, db: Session) -> dict:
    """Imagen 4로 아바타 생성 후 디스크 저장. URL 딕셔너리 반환."""
    p = db.query(models.Persona).filter(models.Persona.id == citizen_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="시민을 찾을 수 없습니다.")

    citizen_dict = {"age": p.age, "gender": p.gender, "tags": p.tags or []}
    prompt = _build_prompt(citizen_dict)
    img_bytes = await generate_avatar_bytes(prompt)

    os.makedirs(AVATARS_DIR, exist_ok=True)
    path = _avatar_path(citizen_id)
    with open(path, "wb") as f:
        f.write(img_bytes)

    # DB에 image_url 캐싱 (선택)
    p.image_url = _avatar_url(citizen_id)
    db.commit()

    return {"url": _avatar_url(citizen_id), "cached": False}


@router.get("/{citizen_id}/avatar")
async def get_citizen_avatar(citizen_id: int, db: Session = Depends(get_db)):
    """캐시된 아바타 URL 반환; 없으면 Imagen 4로 생성 후 서버 저장."""
    path = _avatar_path(citizen_id)
    if os.path.exists(path):
        return {"url": _avatar_url(citizen_id), "cached": True}
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=404, detail="아바타 없음 (GEMINI_API_KEY 미설정)")
    return await _generate_avatar(citizen_id, db)


@router.post("/{citizen_id}/avatar/regenerate")
async def regenerate_citizen_avatar(citizen_id: int, db: Session = Depends(get_db)):
    """캐시 삭제 후 Imagen 4로 재생성."""
    path = _avatar_path(citizen_id)
    if os.path.exists(path):
        os.remove(path)
    return await _generate_avatar(citizen_id, db)


# ---------------------------------------------------------------------------
# RAG 자동 생성 자리 (TODO)
# ---------------------------------------------------------------------------
# 추후 구현 계획:
# - 일정 주기(cron)로 Report/NewProposal/SurveyResponse/ChecklistResult + 공공데이터를
#   취합하여 RAG 파이프라인으로 가상시민(Persona)을 자동 생성.
# - 생성 시 generation_source="rag", evidence=[{type, id}, ...]로 근거 추적.
# - 목업 데이터(MOCK_CITIZENS/MOCK_DETAILS)는 제거됨 — Persona는 DB(RAG/실데이터)에서만 제공.
# ---------------------------------------------------------------------------
