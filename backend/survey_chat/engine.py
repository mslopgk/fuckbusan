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
            "suggested_replies": {
                "type": "array",
                "items": {"type": "string"},
                "description": "바로 누를 수 있는 짧은 보기(선택)",
            },
            "info_update": {
                "type": ["object", "null"],
                "additionalProperties": False,
                "properties": {
                    "issue_text": {"type": ["string", "null"]},
                    "severity_score": {"type": ["integer", "null"]},
                    "primary_category": {"type": ["string", "null"]},
                    "location_bucket": {"type": ["string", "null"]},
                    "evidence_span": {"type": ["string", "null"]},
                },
                "required": [
                    "issue_text",
                    "severity_score",
                    "primary_category",
                    "location_bucket",
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
        if api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key)
            except Exception as e:  # pragma: no cover
                print(f"[survey_chat] OpenAI init 실패, 폴백 사용: {e}")
                self.client = None
        else:
            print("[survey_chat] OPENAI_API_KEY 없음 → 결정론적 폴백 엔진 사용")
            self.client = None

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
            "suggested_replies": [],
        }

    def get_session(self, sid: str) -> Optional[Dict[str, Any]]:
        return self._sessions.get(sid)

    async def message(self, sid: str, user_text: str) -> Dict[str, Any]:
        sess = self._sessions.get(sid)
        if sess is None:
            raise KeyError("session not found")

        sess["messages"].append({"role": "user", "content": user_text})

        if self.client:
            bot = await self._llm_turn(sess)
        else:
            bot = self._fallback_turn(sess, user_text)

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

        return {
            "response": bot["response"],
            "suggested_replies": bot.get("suggested_replies", []),
            "info": _collected_snapshot(sess),
            "collected_issues": sess["collected_issues"],
            "is_complete": is_complete,
        }

    # --- LLM 경로 ---
    async def _llm_turn(self, sess: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = _build_system_prompt(sess["info"], sess["collected_issues"], self.lang)
        messages = [{"role": "system", "content": system_prompt}] + sess["messages"]
        try:
            resp = await self.client.chat.completions.create(
                model=self.model,
                temperature=self.temperature,
                messages=messages,
                response_format={"type": "json_schema", "json_schema": _BOT_SCHEMA},
            )
            return json.loads(resp.choices[0].message.content)
        except Exception as e:
            print(f"[survey_chat] LLM 호출 실패, 폴백: {e}")
            # 마지막 사용자 발화로 폴백
            last_user = next((m["content"] for m in reversed(sess["messages"]) if m["role"] == "user"), "")
            return self._fallback_turn(sess, last_user)

    # --- 폴백 경로 (키 없거나 LLM 오류) ---
    def _fallback_turn(self, sess: Dict[str, Any], user_text: str) -> Dict[str, Any]:
        """결정론적 진행: 빈 필드를 순서대로 채운다."""
        info = dict(sess["info"])
        text = (user_text or "").strip()

        # 종료 의사
        if text in ("끝", "없어요", "이게 다예요", "그만", "종료"):
            return _bot("", interview_finished=True,
                        response=C.loc(C.CLOSING, self.lang))

        # 직전 질문이 채우려던 필드를 user_text 로 채움
        target = next((f for f in C.REQUIRED_FIELDS if info.get(f["id"]) is None), None)
        update = {}
        if target and text:
            fid = target["id"]
            if target.get("type") == "scale":
                labels = target["scale"]["labels"][self.lang]
                idx = labels.index(text) if text in labels else _digit(text)
                update[fid] = idx if idx is not None else 2
            elif target.get("type") == "category":
                opts = {C.loc(o["label"], self.lang): o["id"] for o in target["options"]}
                update[fid] = opts.get(text, text)
            else:
                update[fid] = text
            info[fid] = update[fid]

        # 다음 빈 필드 질문
        nxt = next((f for f in C.REQUIRED_FIELDS if info.get(f["id"]) is None), None)
        if nxt is None:
            return _bot(update, current_issue_complete=True, interview_finished=True,
                        response=C.loc(C.CLOSING, self.lang))

        q, replies = _fallback_question(nxt, self.lang)
        return _bot(update, response=q, suggested_replies=replies)


def _digit(s: str) -> Optional[int]:
    for ch in s:
        if ch.isdigit():
            return max(0, min(4, int(ch)))
    return None


def _fallback_question(field: dict, lang: str):
    fid = field["id"]
    if fid == "issue_text":
        return "생활 속에서 느낀 불편이나 개선이 필요한 공간에 대해 이야기해주세요.", []
    if fid == "location_bucket":
        return "불편을 느낀 장소를 알려주실 수 있을까요? (대략적인 위치)", []
    if fid == "primary_category":
        opts = [C.loc(o["label"], lang) for o in field["options"]]
        return "주로 어떤 점 때문에 불편하다고 느끼시나요?", opts
    if fid == "severity_score":
        labels = field["scale"]["labels"][lang]
        return "이 문제가 얼마나 심각하다고 느끼시나요?", labels
    return C.loc(field["description"], lang), []


def _bot(update, response="", suggested_replies=None, current_issue_complete=False,
         new_issue_started=False, interview_finished=False, early_exit=False):
    info_update = None
    if isinstance(update, dict) and update:
        info_update = {k: update.get(k) for k in ["issue_text", "severity_score",
                                                  "primary_category", "location_bucket", "evidence_span"]}
    return {
        "response": response,
        "suggested_replies": suggested_replies or [],
        "info_update": info_update,
        "current_issue_complete": current_issue_complete,
        "new_issue_started": new_issue_started,
        "interview_finished": interview_finished,
        "early_exit": early_exit,
    }


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
