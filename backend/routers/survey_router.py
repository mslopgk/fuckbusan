"""Stub survey endpoints — returns in-memory mock data until a real Survey model lands."""
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/surveys", tags=["surveys"])

_now = datetime.utcnow()

_MOCK_SURVEYS = [
    {
        "id": 1,
        "title": "학생의 학교 외 생활활동 조사 (학부모 대상)",
        "author_id": "admin_kang1",
        "status": "답변수집중",
        "response_count": 132,
        "created_at": (_now - timedelta(days=4)).isoformat(),
    },
    {
        "id": 2,
        "title": "공공디자인 만족도 조사",
        "author_id": "admin_kang1",
        "status": "작성중",
        "response_count": 0,
        "created_at": (_now - timedelta(days=10)).isoformat(),
    },
    {
        "id": 3,
        "title": "야간 보행환경 안전도 조사",
        "author_id": "admin_oh2",
        "status": "종료",
        "response_count": 287,
        "created_at": (_now - timedelta(days=30)).isoformat(),
    },
]


@router.get("/list")
def list_surveys():
    return _MOCK_SURVEYS
