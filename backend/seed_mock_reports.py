"""
Seed the `reports` table with the previously-frontend mock data so the
frontend can fetch from API instead of importing JS constants.

Idempotent — wipes existing seeded mock rows (id<1000 or marked seed) and re-inserts.
Run: cd backend && python seed_mock_reports.py
"""
import os
import sys
from datetime import datetime
from decimal import Decimal

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from sqlalchemy import text
from database import engine, SessionLocal
import models


MOCK_MY_REPORTS = [
    {
        "id": 1,
        "category": "주거",
        "sub_category": "거리",
        "title": "전기자전거 재고 불균형 해결 제안",
        "content": "인도에 방치된 전기자전거로 인해 보행이 너무 불편합니다. 전용 주차구역 확보가 절실해요.",
        "author": "동래구 우리디자이너",
        "region": "동래구",
        "location": "동래구 수안동",
        "detailed_address": "대호아파트 정문 앞",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 333,
        "lat": 35.1983, "lng": 129.0831,
        "image": "/assets/archieve1.png",
        "status": "검토중", "progress_step": 2,
    },
    {
        "id": 2,
        "category": "주거", "sub_category": "거리",
        "title": "전기자전거 재고 불균형 해결 제안",
        "content": "공원 쓰레기통 주변이 너무 지저분합니다. 추가 쓰레기통 설치와 잦은 수거가 필요해 보여요.",
        "author": "동래구 시민",
        "region": "동래구", "location": "동래구 수안동",
        "detailed_address": "수안커피 뒤편 골목길",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 250,
        "lat": 35.1912, "lng": 129.0805,
        "image": "/assets/archieve2.png",
        "status": "검토중", "progress_step": 2,
    },
    {
        "id": 3,
        "category": "주거", "sub_category": "거리",
        "title": "전기자전거 재고 불균형 해결 제안",
        "content": "횡단보도 앞 보도블럭이 파손되어 유모차나 휠체어가 지나가기 매우 위험합니다. 빠른 수리 부탁드립니다.",
        "author": "동래구 홍보단 홍길동",
        "region": "동래구", "location": "동래구 수안동",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 450,
        "lat": 35.2048, "lng": 129.0786,
        "image": "/assets/archieve3.png",
        "status": "검토중", "progress_step": 2,
    },
    {
        "id": 4,
        "category": "주거", "sub_category": "거리",
        "title": "전기자전거 재고 불균형 해결 제안",
        "content": "밤길이 너무 어두워요. 골목길 가로등 조도를 높이거나 추가 설치해주시면 감사하겠습니다.",
        "author": "동래구 시민",
        "region": "동래구", "location": "동래구 수안동",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 120,
        "lat": 35.1631, "lng": 129.1589,
        "status": "검토중", "progress_step": 2,
    },
    {
        "id": 5,
        "category": "환경", "sub_category": "골목쓰레기통",
        "title": "수안동 골목길 쓰레기 무단투기 해결 완료",
        "content": "골목길에 쓰레기가 너무 많았는데, 이번에 구청에서 수거함 설치와 CCTV 단속을 강화해주셨습니다. 정말 깨끗해졌어요!",
        "author": "동래구 우리디자이너",
        "region": "동래구", "location": "동래구 수안동",
        "detailed_address": "대호아파트 후문 삼거리",
        "date": "2026.04.01",
        "likes": 24, "comments": 8, "views": 520,
        "lat": 35.1950, "lng": 129.0850,
        "image": "/assets/archieve1.png",
        "status": "결과안내", "progress_step": 4,
        "comments_list": [
            {"id": 1, "author": "동래구청", "content": "현장 확인 후 조치 완료되었습니다.", "date": "2026.04.05"}
        ],
        "result_details": {
            "title": "골목길 환경 정비 결과 보고",
            "image": "/assets/archieve1.png",
            "content": "민원이 접수된 수안동 123-4번지 일대에 이동식 CCTV 1대를 추가 설치하였으며, 지역 주민들의 의견을 수렴하여 대형 쓰레기 수거함 2개를 배치 완료하였습니다. 앞으로도 깨끗한 동래구를 위해 노력하겠습니다.",
            "manager": "동래구청 자원순환과",
            "result_date": "2026.04.05",
        },
    },
]

MOCK_REPORTS_BASE = [
    {
        "id": 101,
        "category": "산업·일자리", "sub_category": "골목쓰레기통",
        "title": "공원 쓰레기통이 안전조치가 필요해요",
        "author": "동래구 우리디자이너",
        "location": "동래구 수안동", "region": "동래구",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 333,
        "image": "/assets/archieve1.png",
        "lat": 35.1983, "lng": 129.0831,
        "status": "개선중", "progress_step": 2,
        "comments_list": [
            {"id": 1, "author": "동래구 우리디자이너", "content": "빠른 조치가 필요하네요", "date": "2026.03.13"},
            {"id": 2, "author": "동래구 우리디자이너", "content": "빠른 조치가 필요하네요", "date": "2026.03.13"},
        ],
    },
    {
        "id": 102,
        "category": "환경", "sub_category": "가로수/조경 관리",
        "title": "전기자전거 재고 불균형 해결 제안",
        "author": "동래구 시민", "region": "동래구",
        "location": "동래구 수안동",
        "date": "2026.03.13",
        "likes": 12, "comments": 12, "views": 250,
        "image": "/assets/archieve2.png",
        "lat": 35.1912, "lng": 129.0805,
        "status": "개선중", "progress_step": 2,
    },
    {
        "id": 103,
        "category": "교육", "sub_category": "도로/교통 시설",
        "title": "학교 앞 횡단보도 신호등 고장",
        "author": "수영구 학부모", "region": "수영구",
        "location": "수영구 광안동",
        "date": "2026.03.05",
        "likes": 45, "comments": 8, "views": 1200,
        "image": "/assets/diagnosis_street.png",
        "lat": 35.2048, "lng": 129.0786,
        "status": "개선완료", "progress_step": 4,
        "result_details": {
            "title": "개선 결과보기",
            "image": "/assets/archieve3.png",
            "content": "U+one 마케터로서 그냥 지나칠 수가 없네요..(TT) 전 국민이 애용하는 U+one 앱이 될 수 있도록 더 열심히! 노력해 보겠습니다. 12월에도 런칭 기념 이벤트는 계속 되니 꼬옥 관심 가져주셔야 돼요~ 약속~",
            "manager": "담당자 코멘트",
            "result_date": "2026.01.02",
        },
        "comments_list": [
            {"id": 1, "author": "관리자", "content": "조치 완료되었습니다.", "date": "2026.03.10"}
        ],
    },
    {
        "id": 104,
        "category": "환경", "sub_category": "취업 지원",
        "title": "취업 박람회 홍보 부족",
        "author": "해운대구 취준생", "region": "해운대구",
        "location": "해운대구 우동",
        "date": "2026.02.28",
        "likes": 22, "comments": 5, "views": 890,
        "image": "/assets/archieve3.png",
        "lat": 35.1631, "lng": 129.1589,
        "status": "개선예정", "progress_step": 1,
    },
    {
        "id": 105,
        "category": "교통", "sub_category": "불법 주정차",
        "title": "수영역 인근 상습 불법 주정차 구역",
        "author": "수영구 주민", "region": "수영구",
        "location": "수영구 망미동",
        "date": "2026.03.14",
        "likes": 18, "comments": 4, "views": 560,
        "image": "/assets/archieve2.png",
        "lat": 35.1645, "lng": 129.1123,
        "status": "검토중", "progress_step": 2,
        "comments_list": [
            {"id": 1, "author": "수영구 주민", "content": "여기 진짜 심각해요.", "date": "2026.03.14"}
        ],
    },
]


def parse_date(s):
    """Convert '2026.03.13' to datetime."""
    try:
        return datetime.strptime(s, "%Y.%m.%d")
    except Exception:
        return datetime.now()


def main():
    # Drop legacy reports tables to apply new schema (dev-only).
    print("Dropping legacy report tables...")
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for tbl in ("report_comments", "report_likes", "report_images", "reports"):
            conn.execute(text(f"DROP TABLE IF EXISTS {tbl}"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    print("Recreating tables from new schema...")
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:

        all_mocks = MOCK_MY_REPORTS + MOCK_REPORTS_BASE
        for m in all_mocks:
            r = models.Report(
                id=m["id"],
                user_id=None,
                author_name=m.get("author"),
                category=m.get("category"),
                sub_category=m.get("sub_category"),
                title=m["title"],
                content=m.get("content"),
                region=m.get("region"),
                location=m.get("location"),
                detailed_address=m.get("detailed_address"),
                lat=m.get("lat"),
                lng=m.get("lng"),
                image_url=m.get("image"),
                status=m.get("status", "개선예정"),
                progress_step=m.get("progress_step", 1),
                views=m.get("views", 0),
                likes_count=m.get("likes", 0),
                comments_count=m.get("comments", 0),
                result_details=m.get("result_details"),
                created_at=parse_date(m.get("date", "")),
            )
            db.add(r)
            for c in m.get("comments_list") or []:
                db.add(models.ReportComment(
                    report_id=m["id"],
                    user_id=None,
                    author_name=c.get("author"),
                    content=c.get("content"),
                    created_at=parse_date(c.get("date", "")),
                ))
        db.commit()
        print(f"Seeded {len(all_mocks)} reports + comments.")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
