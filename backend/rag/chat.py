"""RAG 기반 AI 가상시민 대화. PersonaChat 프론트(/api/ai-citizens/{id}/chat)가 호출.

페르소나 데이터로 1인칭 캐릭터를 만들고, Qdrant에서 해당 지역 시민 근거를
검색해 답변을 보강(grounding)한다. 키/Qdrant 없으면 폴백 응답.
"""
from . import config as C
from . import core

_MAX_HISTORY = 12


def _persona_system(p):
    d = p.detail or {}
    lines = [
        f"너는 부산 {p.district_code or ''}에 사는 AI 가상시민 '{p.name}'({p.age}세 {p.gender or ''}, {d.get('job') or p.job or '시민'})이다.",
        "공공데이터·시민 의견으로 만들어진 가상인물이지만, 실제 주민처럼 1인칭(나/저)으로 친근하게 대화하라.",
    ]
    if p.quote:
        lines.append(f"평소 한마디: \"{p.quote}\"")
    for label, v in [("관심사", d.get("interests")), ("고민", d.get("concerns")),
                     ("취미", d.get("hobbies")), ("좌우명", d.get("motto"))]:
        if v:
            lines.append(f"{label}: {v if isinstance(v, str) else ', '.join(v)}")
    issues = d.get("top_issues") or p.pain_points or []
    if issues:
        lines.append("동네에서 개선됐으면 하는 점: " + ", ".join(map(str, issues)))
    lines.append(
        "\n[규칙] 캐릭터 유지·1인칭·2~4문장 간결. 동네 현안 질문엔 네 생활 경험으로 솔직히. "
        "데이터에 없는 사실 단정 금지. **답변 본문에는 되묻는 질문 목록이나 '추천 질문'을 넣지 말 것** "
        "(후속 질문 칩은 화면이 따로 보여준다). 자연스러운 대화 답변만 한다. "
        "**반드시 순수 한국어만 사용할 것 — 한자·중국어·영어 단어를 섞지 말 것.**"
    )
    return "\n".join(lines)


import re as _re

# MiniMax가 간헐적으로 섞는 중국어(한자) 정리 — 자주 나오는 어휘는 한국어 치환, 나머지는 제거
_HANJA_RE = _re.compile(r"[一-鿿]+")
_HANJA_FIX = {
    "老年": "어르신", "老人": "어르신", "一堆": "잔뜩", "间距": "간격", "距离": "거리",
    "问题": "문제", "非常": "아주", "很多": "많이", "环境": "환경", "安全": "안전",
}


def _strip_hanja(text):
    for k, v in _HANJA_FIX.items():
        text = text.replace(k, v)
    # 남은 한자는 제거 후 이중 공백 정리
    text = _HANJA_RE.sub("", text)
    return _re.sub(r"[ \t]{2,}", " ", text)


def _clean_reply(text):
    """모델이 끝에 붙이는 질문 목록/구분선 제거 (본문만 남김) + 한자 혼입 정리."""
    import re
    text = _strip_hanja((text or "").strip())
    # '---' 이후 꼬리(추천질문 등) 절단
    text = re.split(r"\n-{3,}\s*\n", text)[0].strip()
    lines = text.split("\n")
    while lines:
        last = lines[-1].strip()
        # 끝에 매달린 불릿/번호형 질문 라인 제거
        if re.match(r"^([-*•]|\d+[.)]|Q\d|추천\s*질문|이어서)", last) and last.endswith(("?", "요?", "까?", "나요?")):
            lines.pop()
        elif re.match(r"^(추천\s*질문|이어서 물어|더 궁금)", last):
            lines.pop()
        else:
            break
    return "\n".join(lines).strip()


def chat(persona, message, history=None):
    if not C.llm_available():
        return {"reply": f"안녕하세요, {persona.name}예요. 지금은 대화 기능이 준비 중이에요.",
                "suggested": ["요즘 동네에서 불편한 점은요?", "어떤 게 개선되면 좋겠어요?"]}

    # 지역 근거 보강
    grounding = ""
    q = C.get_qdrant()
    if q is not None:
        try:
            results, _ = core.retrieve(q, f"{persona.district_code} {message}", top_k=4, collection=C.COLLECTION)
            if results:
                grounding = "\n\n[참고 — 우리 동네 실제 데이터]\n" + "\n".join(f"- {r['text'][:200]}" for r in results)
        except Exception:
            pass

    msgs = []
    for m in (history or [])[-_MAX_HISTORY:]:
        role = "assistant" if m.get("role") in ("assistant", "ai") else "user"
        content = (m.get("content") or m.get("text") or "").strip()
        if content:
            msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": message + grounding})

    r = C.llm_complete(_persona_system(persona), msgs, max_tokens=700, temperature=0.7)
    if not r.get("ok"):
        return {"reply": "죄송해요, 잠시 응답이 어려워요. 다시 시도해 주세요.",
                "suggested": [], "error": r.get("error"), "tried": r.get("tried")}
    reply = _clean_reply(r["text"])

    # 추천 질문: 답변 끝 줄에서 추출 시도, 없으면 기본
    suggested = []
    d = persona.detail or {}
    issues = d.get("top_issues") or []
    if issues:
        suggested.append(f"{str(issues[0])[:18]} 어떠세요?")
    suggested += ["요즘 가장 불편한 점은요?", "바라는 공공서비스가 있나요?"]
    return {"reply": reply, "suggested": suggested[:3]}
