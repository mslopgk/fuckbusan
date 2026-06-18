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
    """(Anthropic client, model) or (None, None). Minimax 키면 자동으로 minimax 엔드포인트 사용.
    (하위호환용 — 신규 코드는 llm_complete 사용 권장)"""
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


# 401/402로 실패한 키는 프로세스 동안 스킵 (재기동 시 초기화 → 충전/교체 키 재시도)
_DEAD_KEYS = set()


def _candidates():
    """시도할 LLM 후보 목록 (우선순위, 죽은 키 제외). 각: {provider, key, model, base_url}."""
    out = []
    a = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if a:
        out.append({"provider": "anthropic", "key": a, "model": _model_for("anthropic"), "base_url": ANTHROPIC_BASE_URL})
    for k in ("MINIMAX1", "MINIMAX2", "MINIMAX3", "MINIMAX4"):
        v = (os.getenv(k) or "").strip()
        if v:
            out.append({"provider": "minimax", "key": v, "model": _model_for("minimax"), "base_url": ANTHROPIC_BASE_URL or MINIMAX_BASE_URL, "name": k})
    return [c for c in out if c["key"] not in _DEAD_KEYS]


def llm_available():
    return len(_candidates()) > 0


def llm_complete(system, messages, max_tokens=2000, temperature=0.7):
    """provider 자동 폴백 한 번 호출. messages=[{role:'user'|'assistant', content:str}].
    반환: {ok, text, provider, model} 또는 {ok:False, error, tried}."""
    cands = _candidates()
    if not cands:
        return {"ok": False, "error": "사용 가능한 LLM 키가 없습니다 (.env ANTHROPIC_API_KEY 또는 MINIMAX1~4)."}
    errors = []
    for c in cands:
        try:
            from anthropic import Anthropic
            kwargs = {"api_key": c["key"]}
            if c.get("base_url"):
                kwargs["base_url"] = c["base_url"]
                kwargs["default_headers"] = {"Authorization": f"Bearer {c['key']}"}
            cli = Anthropic(**kwargs)
            resp = cli.messages.create(
                model=c["model"], max_tokens=max_tokens, temperature=temperature,
                system=system, messages=messages,
            )
            text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
            if text.strip():
                return {"ok": True, "text": text, "provider": c["provider"], "model": c["model"]}
            errors.append(f"{c.get('name', c['provider'])}: 빈 응답")
        except Exception as e:
            es = str(e)
            errors.append(f"{c.get('name', c['provider'])}: {es[:80]}")
            # 인증실패(401)·잔액부족(402) 키는 프로세스 동안 스킵
            if "401" in es or "402" in es or "authentication" in es or "insufficient_balance" in es:
                _DEAD_KEYS.add(c["key"])
            continue
    return {"ok": False, "error": "모든 LLM 후보 실패", "tried": errors}


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
        "llm_ok": llm_available(),
        "providers": [c.get("name", c["provider"]) for c in _candidates()],
        "provider": (_candidates()[0]["provider"] if _candidates() else None),
        "model": (_candidates()[0]["model"] if _candidates() else None),
    }
