"""RAG 기반 AI 가상시민 페르소나 생성.

지역별로 Qdrant에서 시민 데이터(제보/제안/설문/진단)를 검색 → Claude로
서로 다른 페르소나 N명을 JSON 생성 → Persona 테이블 저장(evidence 추적).
"""
import json

from . import config as C
from . import core

PERSONA_SYS = (
    "너는 부산광역시 공공데이터·시민 의견을 분석해 '대표 가상시민(페르소나)'을 만드는 분석가다.\n"
    "주어진 실제 시민 데이터(제보/제안/설문/진단 발췌)를 근거로, 서로 다른 삶/연령/관심사를 가진 페르소나를 만든다.\n"
    "반드시 데이터에 드러난 실제 불편/바람을 반영하고, 지어내지 말 것. 한국어. JSON만 출력."
)

PERSONA_SCHEMA_HINT = (
    '{"personas":[{'
    '"name":"한국이름","age":정수,"gender":"남성|여성","tags":["#태그",..3개],'
    '"quote":"한 줄 인용","categories":["안전","교통"..],'
    '"detail":{"job":"","family":"","motto":"","dream_life":"","interests":"","concerns":"",'
    '"hobbies":"","activities":"","body_language":"체감 한마디",'
    '"voices":["..",".."],"top_issues":["..",".."],'
    '"journey":[{"time":"07:00-08:00","action":"","feeling":"","emotion":"기대됨|집중함|보통|불안함|매우불안함"}],'
    '"policy_signals":{"high":[".."],"medium":[".."],"low":[".."]},'
    '"participation":{"제안":정수,"제보":정수,"진단":정수,"설문":정수},'
    '"category_scores":{"안전":1~5,"주거":..,"교통":..,"산업일자리":..,"교육":..,"환경":..,"문화여가":..,"보건":..},'
    '"similar_ratio":"12.3%","similar_desc":"OO구 시민 약 N명 중 1명"}}]}'
)


def generate(db, district, n=3):
    import models
    q = C.get_qdrant()
    if not C.llm_available():
        return {"ok": False, "error": "LLM 키 미설정 (.env ANTHROPIC_API_KEY/MINIMAX/OPENAI)"}

    # 지역 근거 검색
    grounding = ""
    evidence = []
    if q is not None:
        try:
            results, _ = core.retrieve(q, f"{district} 시민 불편 제보 제안 설문 진단",
                                       top_k=12, collection=C.COLLECTION)
            grounding = "\n\n".join(f"- {r['text'][:300]}" for r in results)
            evidence = [{"source": r["source"]} for r in results][:12]
        except Exception:
            pass
    if not grounding:
        grounding = "(검색된 근거 없음 — 일반적인 부산 도시생활 맥락으로 생성)"

    # 1명씩 생성(응답당 단일 JSON → reasoning 토큰 여유 + truncation 방지)
    base = (db.query(models.Persona).count() or 0)
    saved, used_names, errors = [], [], []
    for i in range(n):
        avoid = (f"\n이미 만든 페르소나: {', '.join(used_names)} — 이들과 겹치지 않게 "
                 "연령대/직업/관심사를 다르게 하라." if used_names else "")
        prompt = (
            f"지역: 부산 {district}\n\n### 근거 데이터(발췌)\n{grounding}\n{avoid}\n\n"
            f"위 근거를 반영해 {district} 대표 가상시민 1명을 생성하라.\n"
            f"반드시 아래 형식의 JSON 객체 1개만 출력(설명/코드펜스 없이): {PERSONA_SCHEMA_HINT}"
        )
        r = C.llm_complete(PERSONA_SYS, [{"role": "user", "content": prompt}], max_tokens=8000, temperature=0.7)
        if not r.get("ok"):
            errors.append(f"#{i+1} LLM 실패: {r.get('error')} {r.get('tried') or ''}")
            continue
        text = r["text"]
        data = _parse_json(text)

        p = _coerce_one(data)
        if not p or not p.get("name"):
            errors.append(f"#{i+1} 파싱 실패(len={len(text)}): {text[:120]}")
            continue

        det = p.get("detail") or {}
        row = models.Persona(
            district_code=district, year="2026",
            name=p.get("name"), age=int(p.get("age") or 40),
            gender=p.get("gender") or "", job=det.get("job") or "",
            image_emoji="👤", quote=p.get("quote") or "",
            full_quote=det.get("body_language") or "",
            tags=p.get("tags") or [], pain_points=det.get("top_issues") or [],
            suggestions=det.get("policy_signals") or {}, expected_effects=[],
            stats={}, categories=p.get("categories") or [],
            avatar_initial=(p.get("name") or "시")[0],
            importance=base + len(saved) + 1, detail=det,
            generation_source="rag", evidence=evidence,
        )
        db.add(row)
        db.flush()
        saved.append({"id": row.id, "name": row.name, "age": row.age})
        used_names.append(row.name)
    db.commit()

    if not saved:
        return {"ok": False, "error": "페르소나 파싱 실패", "detail": errors[:3]}
    return {"ok": True, "district": district, "created": len(saved),
            "personas": saved, "warnings": errors[:3]}


def _coerce_one(data):
    """LLM JSON에서 단일 페르소나 dict 추출 (객체 / {persona:..} / {personas:[..]} 모두 허용)."""
    if not isinstance(data, dict):
        return None
    if "personas" in data and isinstance(data["personas"], list) and data["personas"]:
        return data["personas"][0]
    if "persona" in data and isinstance(data["persona"], dict):
        return data["persona"]
    return data if "name" in data else None


def _parse_json(text):
    import re
    text = (text or "").strip()
    # <think> 잔여 제거
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S).strip()
    # 코드펜스 안 내용 우선 추출 (```json ... ``` 또는 ``` ... ```)
    m = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.S)
    if m:
        text = m.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    # 최외곽 중괄호 추출
    a, b = text.find("{"), text.rfind("}")
    if a >= 0 and b > a:
        try:
            return json.loads(text[a:b + 1])
        except Exception:
            return {}
    return {}
