"""RAG 설정 + 연결 헬퍼 (Qdrant / LLM). 모든 의존성은 lazy — 없거나 미기동이어도 서버는 부팅된다.

원본 엔진: shain1912/runway (rag_core.py). 본 프로젝트(부산 공공디자인)용으로
컬렉션/데이터소스를 교체해 이식.
"""
import os

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION = os.getenv("RAG_COLLECTION", "busan_civic")

# LLM: runway는 Minimax(Anthropic 호환) base_url + Anthropic SDK. ANTHROPIC_API_KEY 단독도 지원.
MINIMAX_BASE_URL = "https://api.minimax.io/anthropic"
MINIMAX_MODEL = "MiniMax-M2.7"


def _llm_key():
    """우선순위: ANTHROPIC_API_KEY > MINIMAX1..4. (provider, key) 반환."""
    a = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if a:
        return ("anthropic", a)
    for k in ("MINIMAX1", "MINIMAX2", "MINIMAX3", "MINIMAX4"):
        v = (os.getenv(k) or "").strip()
        if v:
            return ("minimax", v)
    return (None, "")


def _model_for(provider):
    env = os.getenv("RAG_MODEL")
    if env:
        return env
    return MINIMAX_MODEL if provider == "minimax" else "claude-sonnet-4-6"


# 하위호환 표시용
LLM_MODEL = _model_for(_llm_key()[0])
ANTHROPIC_BASE_URL = os.getenv("ANTHROPIC_BASE_URL")


def deps_ok():
    """heavy deps 설치 여부."""
    try:
        import qdrant_client  # noqa
        import sentence_transformers  # noqa
        return True
    except Exception:
        return False


def get_qdrant():
    """QdrantClient or None (연결 실패시 None)."""
    try:
        from qdrant_client import QdrantClient
        c = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=5)
        c.get_collections()  # 핑
        return c
    except Exception:
        return None


def get_llm():
    """(Anthropic client, model) or (None, None). Minimax 키면 자동으로 minimax 엔드포인트 사용."""
    provider, key = _llm_key()
    if not key:
        return None, None
    try:
        from anthropic import Anthropic
        kwargs = {"api_key": key}
        base = ANTHROPIC_BASE_URL or (MINIMAX_BASE_URL if provider == "minimax" else None)
        if base:
            kwargs["base_url"] = base
            kwargs["default_headers"] = {"Authorization": f"Bearer {key}"}
        return Anthropic(**kwargs), _model_for(provider)
    except Exception:
        return None, None


def status():
    """대시보드용 상태 요약."""
    d = deps_ok()
    q = get_qdrant() if d else None
    points = None
    collection_exists = False
    if q is not None:
        try:
            names = [c.name for c in q.get_collections().collections]
            collection_exists = COLLECTION in names
            if collection_exists:
                points = q.get_collection(COLLECTION).points_count
        except Exception:
            pass
    return {
        "deps_ok": d,
        "qdrant_ok": q is not None,
        "qdrant_host": f"{QDRANT_HOST}:{QDRANT_PORT}",
        "collection": COLLECTION,
        "collection_exists": collection_exists,
        "points": points,
        "llm_ok": bool(_llm_key()[1]),
        "provider": _llm_key()[0],
        "model": _model_for(_llm_key()[0]),
    }
