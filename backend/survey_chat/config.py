"""
AI 대화형 설문(인터뷰) 토픽 설정.

원본: shain1912/test4 (Streamlit + LangGraph) 의 configs/topics/busan_walkability_v2.yaml 를
파이썬 dict 로 포팅. YAML/LangGraph/Streamlit 의존성 제거, 반구조화(field_based) 인터뷰만 사용.
필드 추가/문구 수정은 이 파일만 고치면 됨.
"""

LANGUAGE = "ko"

# 반드시 수집해야 할 필드 (대화 흐름에 따라 순서는 유연)
REQUIRED_FIELDS = [
    {
        "id": "issue_text",
        "name": {"ko": "불편 사항", "en": "Issue"},
        "description": {
            "ko": "생활 속에서 겪은 구체적인 불편 경험",
            "en": "Specific uncomfortable experience",
        },
    },
    {
        "id": "location_bucket",
        "name": {"ko": "위치", "en": "Location"},
        "description": {
            "ko": "문제가 발생한 대략적인 위치 (정확한 주소 X)",
            "en": "Approximate location of the issue",
        },
    },
    {
        "id": "primary_category",
        "name": {"ko": "카테고리", "en": "Category"},
        "description": {"ko": "문제 유형 분류", "en": "Type of issue"},
        "type": "category",
        "options": [
            {"id": "safety", "label": {"ko": "안전", "en": "Safety"}},
            {"id": "accessibility", "label": {"ko": "접근성", "en": "Accessibility"}},
            {"id": "wayfinding", "label": {"ko": "길찾기", "en": "Wayfinding"}},
            {"id": "comfort", "label": {"ko": "쾌적성/미관", "en": "Comfort"}},
            {"id": "other", "label": {"ko": "기타", "en": "Other"}},
        ],
    },
    {
        "id": "severity_score",
        "name": {"ko": "심각도", "en": "Severity"},
        "description": {"ko": "문제의 심각성 (0-4 척도)", "en": "Severity (0-4 scale)"},
        "type": "scale",
        "scale": {
            "min": 0,
            "max": 4,
            "labels": {
                "ko": ["별로", "조금", "보통", "심각", "매우 심각"],
                "en": ["Not bad", "A little", "Moderate", "Serious", "Very serious"],
            },
        },
    },
]

SYSTEM_PROMPT = {
    "role": {
        "ko": (
            "당신은 숙련된 질적 연구 인터뷰어입니다. "
            "부산시 공공디자인·생활환경에 대한 시민 의견을 1:1 대화로 수집하고 있습니다."
        ),
        "en": (
            "You are an experienced qualitative research interviewer collecting "
            "citizen feedback on Busan's public design and living environment."
        ),
    },
    "interview_style": {
        "ko": (
            "## 인터뷰 스타일\n"
            "- 자연스러운 대화처럼 진행하고, 응답자의 말을 경청하며 따라가세요.\n"
            "- 모호하거나 흥미로운 답변에는 후속 질문(probing)을 하세요.\n"
            "- 질문 순서에 얽매이지 말고 대화 흐름에 맞춰 유연하게 진행하세요.\n"
            "- 한 번에 하나의 질문만 하고, 답변은 2~3문장 이내로 간결하게 하세요.\n"
            "## 중요 원칙\n"
            "- 유도 질문 금지 (예: '위험하셨죠?' → '어떠셨어요?')\n"
            "- 응답자의 표현을 그대로 반영하고, 판단하지 말고 공감하세요."
        ),
        "en": (
            "## Interview Style\n"
            "- Conduct it like a natural conversation; follow up on what they mention.\n"
            "- Use probing for vague or interesting answers.\n"
            "- Be flexible about order; ask ONE question at a time, keep replies to 2-3 sentences.\n"
            "## Principles\n"
            "- No leading questions; mirror their words; show empathy without judgment."
        ),
    },
    "extraction_rules": {
        "ko": (
            "## 정보 추출 규칙\n"
            "- 응답에서 자연스럽게 언급된 정보를 info_update 로 추출하세요.\n"
            "- 카테고리는 키워드로 자동 분류하되 애매하면 직접 물어보세요.\n"
            "- 심각도(0-4)는 감정 표현/맥락에서 추론하거나 자연스럽게 물어보세요.\n"
            "- 추출 근거가 된 사용자 문장을 evidence_span 에 담으세요.\n"
            "- suggested_replies 에는 사용자가 바로 누를 수 있는 짧은 보기(2~5개)를 제시하세요. "
            "특히 심각도/카테고리 질문에는 척도/옵션 라벨을 보기로 제시하세요.\n"
            "- 모든 필수 정보가 수집되면 interview_finished=True 로 마무리하세요."
        ),
        "en": (
            "## Extraction Rules\n"
            "- Put naturally-mentioned info into info_update.\n"
            "- Auto-categorize by keywords; ask if ambiguous. Infer 0-4 severity or ask.\n"
            "- Put the supporting user phrase in evidence_span.\n"
            "- Offer 2-5 short tappable suggested_replies; for severity/category use the scale/option labels.\n"
            "- When all required info is collected, set interview_finished=True."
        ),
    },
}

GREETING = {
    "ko": (
        "안녕하세요! 우리 동네 공공디자인 설문에 참여해주셔서 감사합니다. "
        "편하게 대화하듯 말씀해주시면 됩니다. 최근 생활하시면서 불편하거나 "
        "개선이 필요하다고 느낀 공간이 있으신가요?"
    ),
    "en": (
        "Hello! Thanks for joining our public-design survey. Please talk casually. "
        "Have you recently felt any space was uncomfortable or needed improvement?"
    ),
}

CLOSING = {
    "ko": "소중한 의견 나눠주셔서 감사합니다. 말씀해주신 내용은 우리 동네 개선에 큰 도움이 됩니다.",
    "en": "Thank you for sharing. Your feedback will greatly help improve our neighborhood.",
}

TOPIC_NAME = {"ko": "우리 동네 공공디자인 설문", "en": "Neighborhood Public Design Survey"}


def loc(obj: dict, lang: str = LANGUAGE) -> str:
    """언어별 문자열 추출 (없으면 ko→en→str 폴백)."""
    if isinstance(obj, dict):
        return obj.get(lang, obj.get("ko", obj.get("en", str(obj))))
    return str(obj)
