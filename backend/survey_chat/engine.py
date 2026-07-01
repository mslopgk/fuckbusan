"""
대화형 설문 인터뷰 엔진.

원본(test4)의 LangGraph 단일 노드 그래프 + LangChain structured output 를
OpenAI SDK 직접 호출(JSON Schema structured output)로 단순화해 포팅했다.
- field_based 반구조화 인터뷰 (필수 필드를 자연스러운 대화로 수집, 다중 이슈)
- OPENAI_API_KEY 가 없으면 결정론적 폴백 엔진으로 동작(키 없이도 데모 가능)
- 세션 상태는 프로세스 메모리에 보관 (재시작 시 초기화 — 추후 DB/Redis 이전 가능)
"""

import os
import uuid
import json
from typing import Optional, Dict, Any, List

from . import config as C

_FIELD_IDS = [f["id"] for f in C.REQUIRED_FIELDS]

# --- OpenAI structured output 스키마 (BotResponse) ---
_BOT_SCHEMA = {
    "name": "bot_response",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "response": {"type": "string", "description": "사용자에게 보낼 자연어 답변"},
            "input_type": {
                "type": "string",
                "enum": ["text", "single_choice", "scale"],
                "description": "지금 던진 질문이 기대하는 답변 입력 위젯 유형",
            },
            "choices": {
                "type": "array",
                "items": {"type": "string"},
                "description": "input_type=single_choice 일 때 보기 라벨들 (그 외엔 빈 배열)",
            },
            "scale": {
                "type": ["object", "null"],
                "additionalProperties": False,
                "properties": {
                    "min": {"type": "integer"},
                    "max": {"type": "integer"},
                    "labels": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["min", "max", "labels"],
                "description": "input_type=scale 일 때 척도 정의 (그 외엔 null)",
            },
            "suggested_replies": {
                "type": "array",
                "items": {"type": "string"},
                "description": "input_type=text 에서 바로 누를 수 있는 짧은 예시 보기(선택)",
            },
            "info_update": {
                "type": ["object", "null"],
                "additionalProperties": False,
                "properties": {
                    "issue_text": {"type": ["string", "null"]},
                    "severity_score": {"type": ["integer", "null"]},
                    "primary_category": {"type": ["string", "null"]},
                    "location_bucket": {"type": ["string", "null"]},
                    "frequency": {"type": ["string", "null"]},
                    "affected_target": {"type": ["string", "null"]},
                    "desired_improvement": {"type": ["string", "null"]},
                    "evidence_span": {"type": ["string", "null"]},
                },
                "required": [
                    "issue_text",
                    "severity_score",
                    "primary_category",
                    "location_bucket",
                    "frequency",
                    "affected_target",
                    "desired_improvement",
                    "evidence_span",
                ],
            },
            "current_issue_complete": {"type": "boolean"},
            "new_issue_started": {"type": "boolean"},
            "interview_finished": {"type": "boolean"},
            "early_exit": {"type": "boolean"},
        },
        "required": [
            "response",
            "input_type",
            "choices",
            "scale",
            "suggested_replies",
            "info_update",
            "current_issue_complete",
            "new_issue_started",
            "interview_finished",
            "early_exit",
        ],
    },
}


def _empty_info() -> Dict[str, Any]:
    return {fid: None for fid in _FIELD_IDS + ["evidence_span"]}


def _missing_fields(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [f for f in C.REQUIRED_FIELDS if info.get(f["id"]) is None]


def _collected_fields(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [{**f, "value": info[f["id"]]} for f in C.REQUIRED_FIELDS if info.get(f["id"]) is not None]


def _build_system_prompt(info: Dict[str, Any], collected_issues: List[dict], lang: str) -> str:
    parts = [
        C.loc(C.SYSTEM_PROMPT["role"], lang),
        C.loc(C.SYSTEM_PROMPT["interview_style"], lang),
        C.loc(C.SYSTEM_PROMPT["extraction_rules"], lang),
    ]

    if collected_issues:
        s = f"\n## 이전에 수집된 이슈 ({len(collected_issues)}건)\n"
        for i, iss in enumerate(collected_issues, 1):
            s += f"{i}. {str(iss.get('issue_text') or 'N/A')[:50]}\n"
        parts.append(s)

    collected = _collected_fields(info)
    if collected:
        s = "\n## 현재 이슈 - 수집된 정보\n"
        for f in collected:
            s += f"- {C.loc(f['name'], lang)}: {f['value']}\n"
        parts.append(s)

    missing = _missing_fields(info)
    if missing:
        s = "\n## 현재 이슈 - 아직 필요한 정보\n"
        for f in missing:
            s += f"- {C.loc(f['name'], lang)}: {C.loc(f['description'], lang)}\n"
            if f.get("type") == "scale":
                labels = f.get("scale", {}).get("labels", {}).get(lang, [])
                if labels:
                    s += "  (척도: " + ", ".join(f"{i}={l}" for i, l in enumerate(labels)) + ")\n"
            if f.get("type") == "category":
                opts = [C.loc(o["label"], lang) for o in f.get("options", [])]
                s += "  (옵션: " + ", ".join(opts) + ")\n"
        parts.append(s)
    else:
        parts.append("\n## 현재 이슈의 모든 정보가 수집되었습니다. 감사 인사와 함께 마무리하세요.\n")

    return "\n\n".join(p for p in parts if p)


class SurveyChatEngine:
    """세션 단위 대화형 설문 엔진."""

    def __init__(self):
        self.lang = C.LANGUAGE
        self.model = os.getenv("SURVEY_CHAT_MODEL", "gpt-4o")
        self.temperature = float(os.getenv("SURVEY_CHAT_TEMPERATURE", "0.4"))
        self._sessions: Dict[str, Dict[str, Any]] = {}

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY 가 설정되지 않았습니다. AI 설문은 백엔드(OpenAI) 전용으로 동작합니다.")
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)

    # --- 세션 ---
    def start(self) -> Dict[str, Any]:
        sid = uuid.uuid4().hex[:12]
        greeting = C.loc(C.GREETING, self.lang)
        self._sessions[sid] = {
            "messages": [{"role": "assistant", "content": greeting}],
            "info": _empty_info(),
            "collected_issues": [],
            "complete": False,
        }
        return {
            "session_id": sid,
            "greeting": greeting,
            "topic_name": C.loc(C.TOPIC_NAME, self.lang),
            "input_type": "text",
            "choices": [],
            "scale": None,
            "suggested_replies": [],
        }

    def get_session(self, sid: str) -> Optional[Dict[str, Any]]:
        return self._sessions.get(sid)

    async def message(self, sid: str, user_text: str) -> Dict[str, Any]:
        sess = self._sessions.get(sid)
        if sess is None:
            raise KeyError("session not found")

        sess["messages"].append({"role": "user", "content": user_text})

        bot = await self._llm_turn(sess)

        # info 갱신
        info = sess["info"]
        upd = bot.get("info_update") or {}
        for k, v in upd.items():
            if v is not None:
                info[k] = v

        # 이슈 완료/신규 → 누적 후 초기화
        if (bot.get("current_issue_complete") or bot.get("new_issue_started")) and info.get("issue_text"):
            sess["collected_issues"].append(dict(info))
            sess["info"] = _empty_info()

        is_complete = bool(bot.get("interview_finished") or bot.get("early_exit"))
        # 마지막 이슈가 진행 중이면 마무리 시 누적
        if is_complete and sess["info"].get("issue_text"):
            sess["collected_issues"].append(dict(sess["info"]))
            sess["info"] = _empty_info()

        sess["messages"].append({"role": "assistant", "content": bot["response"]})
        sess["complete"] = is_complete

        # 완료 시에는 입력 위젯을 노출하지 않음(text)
        input_type = "text" if is_complete else (bot.get("input_type") or "text")
        scale = bot.get("scale") if input_type == "scale" else None
        choices = bot.get("choices", []) if input_type == "single_choice" else []
        return {
            "response": bot["response"],
            "input_type": input_type,
            "choices": choices,
            "scale": scale,
            "suggested_replies": [] if input_type != "text" else bot.get("suggested_replies", []),
            "info": _collected_snapshot(sess),
            "collected_issues": sess["collected_issues"],
            "is_complete": is_complete,
        }

    async def summarize_title(self, sess: Dict[str, Any]) -> str:
        """완료된 인터뷰의 짧은 설문 제목을 생성한다(한국어, 18자 이내).
        실패 시 첫 이슈 텍스트나 일반 제목으로 폴백."""
        issues = sess.get("collected_issues", [])
        fallback = None
        if issues:
            t = (issues[0].get("issue_text") or "").strip()
            fallback = (t[:16] + "…") if len(t) > 16 else t
        fallback = fallback or "AI 대화형 설문"
        # 대화/이슈 요약 재료
        issue_lines = "\n".join(
            f"- {str(i.get('issue_text') or '')[:60]} (분류:{i.get('primary_category') or '-'}, 지역:{i.get('location_bucket') or '-'})"
            for i in issues
        ) or "(수집된 이슈 없음)"
        try:
            resp = await self.client.chat.completions.create(
                model=os.getenv("SURVEY_CHAT_TITLE_MODEL", "gpt-4o-mini"),
                temperature=0.3,
                messages=[
                    {"role": "system", "content": "너는 시민 설문 인터뷰의 제목을 짓는 도우미다. "
                        "수집된 이슈를 바탕으로 핵심을 담은 한국어 설문 제목을 한 줄로 만들어라. "
                        "18자 이내, 따옴표/마침표 없이 제목만 출력. 예: '수영구 야간 보행 안전 설문'."},
                    {"role": "user", "content": f"수집된 이슈:\n{issue_lines}\n\n제목:"},
                ],
            )
            title = (resp.choices[0].message.content or "").strip().strip('"\'' ).splitlines()[0]
            title = title[:40]
            return title or fallback
        except Exception:
            return fallback

    # --- LLM 경로 (OpenAI 전용, 폴백 없음) ---
    async def _llm_turn(self, sess: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = _build_system_prompt(sess["info"], sess["collected_issues"], self.lang)
        messages = [{"role": "system", "content": system_prompt}] + sess["messages"]
        resp = await self.client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _BOT_SCHEMA},
        )
        return json.loads(resp.choices[0].message.content)


def _collected_snapshot(sess: Dict[str, Any]) -> Dict[str, Any]:
    """현재 진행 중 이슈의 수집 상태(필드→값)."""
    return {f["id"]: sess["info"].get(f["id"]) for f in C.REQUIRED_FIELDS}


# 모듈 싱글턴
_engine: Optional[SurveyChatEngine] = None


def get_engine() -> SurveyChatEngine:
    global _engine
    if _engine is None:
        _engine = SurveyChatEngine()
    return _engine
