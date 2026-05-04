"""
DB 시드 스크립트 — 프론트가 더이상 하드코딩 목업을 쓰지 않도록 모든 도메인에 데이터를 채운다.

실행:
    cd backend && python seed_full_mock.py            # 비어있을 때만 추가
    cd backend && python seed_full_mock.py --reset    # 모든 mock 행 삭제 후 재삽입

대상: users, reports + 댓글/좋아요, new_proposals + 댓글/좋아요, surveys + questions,
      checklist_result, district_analysis, district_insights, personas
"""

import argparse
import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Allow running from repo root or from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy.orm import Session

from database import SessionLocal, engine
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

random.seed(42)
NOW = datetime(2026, 5, 4, 10, 0, 0)

# ----- 부산 16개 구·군 중심 좌표 -----
DISTRICT_CENTERS = {
    "중구":      (35.1064, 129.0322),
    "서구":      (35.0976, 129.0245),
    "동구":      (35.1295, 129.0454),
    "영도구":    (35.0915, 129.0680),
    "부산진구":  (35.1626, 129.0531),
    "동래구":    (35.1972, 129.0786),
    "남구":      (35.1366, 129.0844),
    "북구":      (35.1972, 129.0124),
    "해운대구":  (35.1631, 129.1635),
    "사하구":    (35.1042, 128.9745),
    "금정구":    (35.2429, 129.0926),
    "강서구":    (35.2123, 128.9805),
    "연제구":    (35.1762, 129.0796),
    "수영구":    (35.1452, 129.1133),
    "사상구":    (35.1525, 128.9912),
    "기장군":    (35.2444, 129.2222),
}

CATEGORIES_REPORT = ["주거", "환경", "교통", "안전", "교육", "산업·일자리", "문화·여가", "보건·복지"]
CATEGORIES_PROP = CATEGORIES_REPORT
SUB_CATEGORIES = {
    "주거": ["시설물(거리/골목쓰레기통 등)", "노후 주택", "공동주택"],
    "환경": ["미세먼지", "쓰레기 무단투기", "녹지"],
    "교통": ["횡단보도", "신호등", "버스정류장"],
    "안전": ["가로등", "CCTV", "방범"],
    "교육": ["학교 시설", "통학로", "공공도서관"],
    "산업·일자리": ["전기자전거", "전기차 충전소", "공유 시설"],
    "문화·여가": ["공원", "광장", "벤치"],
    "보건·복지": ["보건소", "복지센터", "의료시설"],
}
STATUSES = ["개선예정", "개선중", "개선완료"]
PROGRESS = {"개선예정": 1, "개선중": 2, "개선완료": 4}

REPORT_TITLES = [
    "공원 쓰레기통이 안전조치가 필요해요",
    "골목 가로등이 자주 꺼집니다",
    "버스정류장 지붕이 파손됐어요",
    "횡단보도 신호 시간이 너무 짧아요",
    "보도블록이 깨져서 위험합니다",
    "어린이 보호구역 표지판 가림 현상",
    "공공자전거 거치대 부족",
    "분리수거 함이 고장났어요",
    "지하철 출구 계단이 미끄러워요",
    "공원 벤치 노후화 심함",
    "통학로 보행자 분리대 필요",
    "골목 CCTV 사각지대 보완 요청",
]
PROPOSAL_TITLES = [
    "전기자전거 재고 불균형 해결 제안",
    "스마트 횡단보도 도입 제안",
    "야간 보행 안전 LED 가로등 설치",
    "공공 와이파이 확대 제안",
    "어린이 보호구역 속도 알림 시스템",
    "공원 벤치 그늘막 추가 설치",
    "분리수거 통합 안내 키오스크",
    "지하철역 휠체어 경사로 개선",
    "통학로 안전 그린로드 도입",
    "공유 모빌리티 거치 구역 정비",
]


def upsert_users(db: Session):
    """없는 user만 삽입. (멱등)"""
    seeds = [
        ("citizen1", "동래구 우리디자이너", "동래우디", "동래구"),
        ("citizen2", "수영구 시민", "수영시민", "수영구"),
        ("citizen3", "동래구 홍보단 홍길동", "홍길동", "동래구"),
        ("citizen4", "부산진구 박지민", "박지민", "부산진구"),
        ("citizen5", "해운대구 김해운", "김해운", "해운대구"),
        ("citizen6", "남구 이남이", "이남이", "남구"),
        ("citizen7", "사하구 최사하", "최사하", "사하구"),
        ("citizen8", "강서구 강서민", "강서민", "강서구"),
    ]
    created = 0
    for ID, name, nick, dist in seeds:
        if db.query(models.User).filter(models.User.ID == ID).first():
            continue
        db.add(models.User(
            ID=ID,
            PW=pwd_context.hash("pw1234"),
            name=name,
            nickname=nick,
            phone_num="010-0000-0000",
            district_code=dist,
            birth_date="1990-01-01",
            created_at=NOW - timedelta(days=30),
        ))
        created += 1
    db.commit()
    print(f"  users: +{created}")


def jitter(lat, lng, scale=0.01):
    return lat + (random.random() - 0.5) * scale, lng + (random.random() - 0.5) * scale


def seed_reports(db: Session):
    users = db.query(models.User).filter(models.User.ID.like("citizen%")).all()
    if not users:
        print("  ⚠️  citizen 사용자가 없어 제보 시드 스킵")
        return
    created = 0
    districts = list(DISTRICT_CENTERS.items())
    for i, title in enumerate(REPORT_TITLES):
        u = users[i % len(users)]
        cat = CATEGORIES_REPORT[i % len(CATEGORIES_REPORT)]
        sub = random.choice(SUB_CATEGORIES.get(cat, [None]))
        district, (lat, lng) = districts[i % len(districts)]
        lat, lng = jitter(lat, lng)
        st = STATUSES[i % len(STATUSES)]
        r = models.Report(
            user_id=u.user_id,
            author_name=u.nickname or u.name,
            category=cat,
            sub_category=sub,
            title=title,
            content=f"{district}에 거주하는 시민입니다. {title}에 대한 신속한 조치를 부탁드립니다.\n\n자세한 상황은 첨부된 사진을 참고 부탁드립니다.",
            region=district,
            location=district,
            detailed_address=f"{district} 일대",
            lat=round(lat, 6),
            lng=round(lng, 6),
            image_url=None,
            status=st,
            progress_step=PROGRESS[st],
            views=random.randint(50, 600),
            likes_count=0,
            comments_count=0,
            files=json.dumps([]),
            created_at=NOW - timedelta(days=random.randint(1, 25), hours=random.randint(0, 23)),
            result_details=(
                {
                    "title": "개선 완료 안내",
                    "image": None,
                    "content": "신속히 조치 완료했습니다. 협조해주셔서 감사합니다.",
                    "manager": "동래구청 도시정비과",
                    "result_date": (NOW - timedelta(days=2)).strftime("%Y.%m.%d"),
                }
                if st == "개선완료" else None
            ),
        )
        db.add(r)
        db.flush()
        # 댓글 2개씩
        for k in range(2):
            commenter = users[(i + k + 1) % len(users)]
            db.add(models.ReportComment(
                report_id=r.id,
                user_id=commenter.user_id,
                author_name=commenter.nickname or commenter.name,
                content=random.choice([
                    "빠른 조치가 필요하네요.",
                    "저도 같은 문제를 겪었어요.",
                    "공감합니다. 꼭 개선되었으면 좋겠어요.",
                    "사진을 보니 심각하네요.",
                ]),
                created_at=r.created_at + timedelta(hours=random.randint(1, 48)),
            ))
            r.comments_count += 1
        # 좋아요 랜덤 fan-out
        liked_users = random.sample(users, k=random.randint(2, min(5, len(users))))
        for lu in liked_users:
            db.add(models.ReportLike(user_id=lu.user_id, report_id=r.id, created_at=r.created_at))
            r.likes_count += 1
        created += 1
    db.commit()
    print(f"  reports: +{created} (+ comments + likes)")


def seed_proposals(db: Session):
    users = db.query(models.User).filter(models.User.ID.like("citizen%")).all()
    if not users:
        return
    created = 0
    districts = list(DISTRICT_CENTERS.keys())
    for i, title in enumerate(PROPOSAL_TITLES):
        u = users[i % len(users)]
        cat = CATEGORIES_PROP[i % len(CATEGORIES_PROP)]
        district = districts[i % len(districts)]
        p = models.NewProposal(
            user_id=u.user_id,
            category=cat,
            title=title,
            content=(
                f"안녕하세요. {district}에 거주하는 시민입니다.\n\n"
                f"{title}을(를) 통해 지역 공공디자인 개선이 필요하다고 생각합니다.\n\n"
                "- 수요 예측 기반 운영 시스템 도입\n"
                "- 실시간 정보 제공 및 위치 안내 강화\n"
                "- 방치 자전거 관리 및 보행환경 개선 체계 구축\n\n"
                "자세한 내용은 아래 첨부파일 참고 바랍니다."
            ),
            region=district,
            detailed_address=f"{district} 일대",
            files=json.dumps([]),
            views_count=random.randint(80, 800),
            likes_count=0,
            created_at=NOW - timedelta(days=random.randint(1, 25)),
        )
        db.add(p)
        db.flush()
        # 댓글
        for k in range(2):
            commenter = users[(i + k + 2) % len(users)]
            db.add(models.ProposalComment(
                proposal_id=p.id,
                user_id=commenter.user_id,
                content=random.choice([
                    "좋은 제안입니다. 적극 동의합니다.",
                    "데이터 근거가 잘 정리되어 있네요.",
                    "예산 측면도 함께 고려되면 좋겠어요.",
                ]),
                created_at=p.created_at + timedelta(hours=random.randint(1, 48)),
            ))
        # 좋아요
        likers = random.sample(users, k=random.randint(2, min(5, len(users))))
        for lu in likers:
            db.add(models.ProposalLike(user_id=lu.user_id, proposal_id=p.id, created_at=p.created_at))
            p.likes_count += 1
        created += 1
    db.commit()
    print(f"  proposals: +{created} (+ comments + likes)")


def seed_surveys(db: Session):
    if db.query(models.Survey).count() > 0:
        print("  surveys: 이미 존재 — 스킵")
        return
    seeds = [
        {
            "title": "사직구장 일대 보행환경 현황 조사",
            "description": "사직구장 주변 보행자 환경 만족도와 개선 우선순위를 파악합니다.",
            "minutes": 10,
            "status": "active",
            "period_start": NOW - timedelta(days=10),
            "period_end": NOW + timedelta(days=20),
            "questions": [
                {"qtype": "single", "text": "사직구장 일대 보행환경에 만족하시나요?",
                 "options": ["매우 만족", "만족", "보통", "불만족", "매우 불만족"]},
                {"qtype": "multi", "text": "가장 시급히 개선되어야 할 항목을 선택해주세요. (복수)",
                 "options": ["보도 폭", "신호 체계", "가로등", "쓰레기통", "벤치"]},
                {"qtype": "agree", "text": "야간 보행 안전을 위해 LED 가로등 추가 설치가 필요하다.",
                 "options": ["동의", "비동의"]},
                {"qtype": "single", "text": "보행로 폭에 대한 의견은?",
                 "options": ["좁다", "적당", "넓다"]},
                {"qtype": "text", "text": "그 밖의 자유 의견을 적어주세요.", "options": []},
            ],
        },
        {
            "title": "소비자 인식 조사",
            "description": "공공디자인 정책에 대한 시민 인식을 조사합니다.",
            "minutes": 10,
            "status": "active",
            "period_start": NOW - timedelta(days=5),
            "period_end": NOW + timedelta(days=30),
            "questions": [
                {"qtype": "single", "text": "공공디자인이라는 용어를 들어본 적이 있나요?",
                 "options": ["있음", "없음"]},
                {"qtype": "single", "text": "공공디자인의 중요도에 대해 어떻게 생각하시나요?",
                 "options": ["매우 중요", "중요", "보통", "중요하지 않음"]},
                {"qtype": "multi", "text": "관심 분야를 모두 선택해주세요.",
                 "options": ["교통", "환경", "안전", "복지", "문화"]},
                {"qtype": "single", "text": "지역에서 가장 시급한 영역은?",
                 "options": ["교통", "환경", "안전", "복지", "문화"]},
                {"qtype": "text", "text": "추가 의견을 자유롭게 남겨주세요.", "options": []},
            ],
        },
        {
            "title": "공공디자인 만족도 조사",
            "description": "지역 공공시설물 디자인 만족도",
            "minutes": 8,
            "status": "active",
            "period_start": NOW - timedelta(days=3),
            "period_end": NOW + timedelta(days=14),
            "questions": [
                {"qtype": "single", "text": "거주 지역의 공공시설물 디자인에 만족하시나요?",
                 "options": ["만족", "보통", "불만족"]},
                {"qtype": "agree", "text": "공공디자인이 도시 이미지에 긍정적인 영향을 준다.",
                 "options": ["동의", "비동의"]},
                {"qtype": "text", "text": "기억에 남는 공공시설물이 있나요?", "options": []},
            ],
        },
        {
            "title": "야간 보행환경 안전도 조사",
            "description": "야간 시간대 동네 보행 안전도",
            "minutes": 7,
            "status": "result",
            "period_start": NOW - timedelta(days=60),
            "period_end": NOW - timedelta(days=10),
            "questions": [
                {"qtype": "single", "text": "야간 보행 안전도는?",
                 "options": ["안전", "보통", "불안"]},
                {"qtype": "multi", "text": "필요한 개선 항목을 모두 고르세요.",
                 "options": ["가로등", "CCTV", "방범 인력", "비상벨"]},
            ],
        },
        {
            "title": "학생의 학교 외 생활활동 조사 (학부모 대상)",
            "description": "초중학생 자녀의 학교 외 활동 패턴",
            "minutes": 12,
            "status": "result",
            "period_start": NOW - timedelta(days=90),
            "period_end": NOW - timedelta(days=30),
            "questions": [
                {"qtype": "single", "text": "자녀의 주된 방과후 활동은?",
                 "options": ["학원", "운동", "도서관", "친구집", "집"]},
                {"qtype": "agree", "text": "동네 공공 학습 공간이 충분하다.",
                 "options": ["동의", "비동의"]},
                {"qtype": "text", "text": "필요한 시설을 자유 기술해주세요.", "options": []},
            ],
        },
    ]
    for s in seeds:
        sv = models.Survey(
            title=s["title"],
            description=s["description"],
            minutes=s["minutes"],
            status=s["status"],
            period_start=s["period_start"],
            period_end=s["period_end"],
            response_count=random.randint(80, 350) if s["status"] != "active" else random.randint(10, 90),
            created_at=s["period_start"],
        )
        db.add(sv)
        db.flush()
        for idx, q in enumerate(s["questions"]):
            db.add(models.SurveyQuestion(
                survey_id=sv.id,
                order_no=idx,
                qtype=q["qtype"],
                text=q["text"],
                options=q["options"],
            ))
    db.commit()
    print(f"  surveys: +{len(seeds)} (+ questions)")


def seed_checklist_results(db: Session):
    users = db.query(models.User).filter(models.User.ID.like("citizen%")).all()
    if not users:
        return
    if db.query(models.ChecklistResult).count() > 5:
        print("  checklist_result: 이미 충분 — 스킵")
        return
    created = 0
    bigs = ["주거", "환경", "교통", "안전", "교육"]
    mids = {
        "주거": "시설물(거리/골목쓰레기통 등)",
        "환경": "녹지",
        "교통": "신호등",
        "안전": "가로등",
        "교육": "통학로",
    }
    districts = list(DISTRICT_CENTERS.items())
    for i in range(15):
        u = users[i % len(users)]
        big = bigs[i % len(bigs)]
        district, (lat, lng) = districts[i % len(districts)]
        lat, lng = jitter(lat, lng)
        db.add(models.ChecklistResult(
            진단지역=district,
            user_id=u.user_id,
            ID=u.ID,
            district_code=district,
            위도=round(lat, 6),
            경도=round(lng, 6),
            대분류=big,
            중분류=mids[big],
            질문기준="해당 시설물의 안전성 및 디자인 적정성",
            answers=json.dumps({"q1": 4, "q2": 3, "q3": 5}),
            점수=random.randint(60, 95),
            리뷰=f"{district} {big} 분야 진단 결과 — 일부 항목 개선 필요.",
            만족도=random.choice(["만족", "보통", "불만족"]),
            이미지경로=None,
            created_at=NOW - timedelta(days=random.randint(1, 30)),
        ))
        created += 1
    db.commit()
    print(f"  checklist_result: +{created}")


def seed_dashboard_data(db: Session):
    if db.query(models.DistrictAnalysis).count() > 0:
        print("  district_analysis/insights/personas: 이미 존재 — 스킵")
        return
    for year in ("2025", "2026"):
        for district in DISTRICT_CENTERS.keys():
            db.add(models.DistrictAnalysis(
                district_code=district,
                year=year,
                housing_score=random.uniform(55, 92),
                env_score=random.uniform(55, 92),
                transport_score=random.uniform(55, 92),
                safety_score=random.uniform(55, 92),
                culture_score=random.uniform(55, 92),
                industry_score=random.uniform(55, 92),
                welfare_score=random.uniform(55, 92),
                education_score=random.uniform(55, 92),
            ))
    insight_titles = [
        ("동래구 보행자 사고 증가", "danger", "high"),
        ("수영구 자전거 도로 미흡", "warning", "mid"),
        ("부산진구 야간 가로등 부족", "warning", "mid"),
        ("해운대구 관광객 동선 혼잡", "info", "low"),
        ("남구 노후 공원 정비 필요", "warning", "mid"),
    ]
    for d in list(DISTRICT_CENTERS.keys())[:6]:
        for t, ty, sev in insight_titles:
            lat, lng = DISTRICT_CENTERS[d]
            db.add(models.DistrictInsight(
                district_code=d,
                year="2026",
                type=ty,
                title=f"{d} {t}",
                description=f"{d} 지역에서 {t}이 관찰됩니다.",
                severity=sev,
                date=(NOW - timedelta(days=random.randint(1, 60))).strftime("%Y-%m-%d"),
                proposer="시민 신고",
                latitude=lat,
                longitude=lng,
                category=random.choice(["report", "diagnosis", "survey"]),
            ))
    persona_seeds = [
        ("김부산", 32, "직장인", "출퇴근 길이 너무 위험해요", ["교통", "안전"]),
        ("이수영", 27, "디자이너", "공공디자인이 더 일관됐으면 좋겠어요", ["문화", "디자인"]),
        ("박해운", 45, "학부모", "통학로 안전이 최우선입니다", ["교육", "안전"]),
        ("최동래", 60, "자영업", "노후 시설 개선이 시급합니다", ["주거", "복지"]),
        ("정남구", 22, "대학생", "야간 보행 환경이 불안해요", ["안전", "교통"]),
        ("강사하", 38, "주부", "공원과 녹지가 더 필요해요", ["환경", "문화"]),
        ("윤기장", 50, "농업인", "지역 균형 발전이 필요합니다", ["복지", "산업"]),
        ("한북구", 30, "프리랜서", "공공 와이파이가 부족해요", ["문화", "산업"]),
    ]
    districts = list(DISTRICT_CENTERS.keys())
    for i, (name, age, job, quote, tags) in enumerate(persona_seeds):
        db.add(models.Persona(
            district_code=districts[i % len(districts)],
            year="2026",
            name=name,
            age=age,
            gender=random.choice(["남", "여"]),
            job=job,
            image_emoji="👤",
            image_url=None,
            quote=quote,
            full_quote=f"{quote} 관련해서, 지역 정책에 시민 의견이 더 반영되었으면 합니다.",
            tags=tags,
            pain_points=[f"{tags[0]} 문제", f"{tags[1]} 문제"],
            suggestions=["정책 강화", "예산 확대"],
            expected_effects=["만족도 상승", "안전 개선"],
            stats={"satisfaction": random.randint(40, 90)},
        ))
    db.commit()
    print(f"  district_analysis/insights/personas: 시드 완료")


def seed_checklist_templates(db: Session):
    """진단 마스터 카탈로그(general/expert) + 종합 설문(comprehensive)을 ChecklistTemplate에 시드.

    원본: public/assets/data/{general,expert}_diagnosis.json, survey.json
    멱등: 동일 (kind, mode) 행 있으면 payload 갱신.
    """
    import json as _json
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "public" / "assets" / "data"
    if not data_dir.exists():
        print("  checklist_templates: public/assets/data/ 없음 — skip")
        return

    targets = [
        ("diagnosis", "general", "일반 진단 카탈로그", data_dir / "general_diagnosis.json"),
        ("diagnosis", "expert",  "전문가 진단 카탈로그", data_dir / "expert_diagnosis.json"),
        ("survey",    "comprehensive", "종합 진단 설문", data_dir / "survey.json"),
    ]
    inserted, updated = 0, 0
    for kind, mode, title, fp in targets:
        if not fp.exists():
            print(f"  checklist_templates: {fp.name} 파일 없음 — skip")
            continue
        with open(fp, "r", encoding="utf-8") as f:
            payload = _json.load(f)
        existing = db.query(models.ChecklistTemplate).filter_by(kind=kind, mode=mode).first()
        if existing:
            existing.payload = payload
            existing.title = title
            existing.updated_at = NOW
            updated += 1
        else:
            db.add(models.ChecklistTemplate(kind=kind, mode=mode, title=title, payload=payload, updated_at=NOW))
            inserted += 1
    db.commit()
    print(f"  checklist_templates: 신규 {inserted}, 갱신 {updated}")


def seed_notifications_and_logs(db: Session):
    """알림 + 활동 로그 시드.

    - reports/proposals 작성자에게 좋아요/댓글 알림 history 흩뿌림
    - activity_logs는 좋아요/댓글/제보생성 등 50건+
    """
    if db.query(models.Notification).count() > 5:
        print("  notifications: 이미 시드됨, skip")
        return

    users = db.query(models.User).filter(models.User.ID.like("citizen%")).all()
    if not users:
        return
    reports = db.query(models.Report).limit(20).all()
    proposals = db.query(models.NewProposal).limit(20).all()

    KIND_TEMPLATES = {
        "like": "{actor}님이 제보에 공감했습니다.",
        "vote": "{actor}님이 제안에 투표했습니다.",
        "comment": "{actor}님이 댓글을 남겼습니다.",
        "status": "제보 상태가 업데이트되었습니다.",
        "system": "[공지] 부산 BDP 신규 기능이 추가되었습니다.",
    }

    n_count = 0
    for r in reports:
        if not r.user_id:
            continue
        for _ in range(random.randint(1, 4)):
            actor = random.choice([u for u in users if u.user_id != r.user_id] or users)
            kind = random.choice(["like", "comment"])
            tpl = KIND_TEMPLATES[kind].format(actor=actor.nickname or actor.name)
            db.add(models.Notification(
                user_id=r.user_id,
                actor_id=actor.user_id,
                kind=kind,
                target_type="report",
                target_id=r.id,
                title=tpl,
                body=(r.title or "")[:200],
                is_read=random.random() < 0.4,
                created_at=NOW - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23)),
            ))
            n_count += 1

    for p in proposals:
        if not p.user_id:
            continue
        for _ in range(random.randint(1, 3)):
            actor = random.choice([u for u in users if u.user_id != p.user_id] or users)
            kind = random.choice(["vote", "comment"])
            tpl = KIND_TEMPLATES[kind].format(actor=actor.nickname or actor.name)
            db.add(models.Notification(
                user_id=p.user_id,
                actor_id=actor.user_id,
                kind=kind,
                target_type="proposal",
                target_id=p.id,
                title=tpl,
                body=(p.title or "")[:200],
                is_read=random.random() < 0.5,
                created_at=NOW - timedelta(days=random.randint(0, 21), hours=random.randint(0, 23)),
            ))
            n_count += 1

    # 시스템 공지 1~2건 (모든 시민에게 broadcast)
    for u in users[:5]:
        db.add(models.Notification(
            user_id=u.user_id,
            actor_id=None,
            kind="system",
            target_type=None,
            target_id=None,
            title="[공지] 부산 BDP — 5월 업데이트",
            body="제보·제안 통합 검색과 알림 기능이 새로 추가되었습니다.",
            is_read=False,
            created_at=NOW - timedelta(days=2),
        ))
        n_count += 1

    # Activity logs
    log_count = 0
    actions = ["create", "like", "comment", "vote", "view"]
    for _ in range(60):
        u = random.choice(users)
        action = random.choice(actions)
        if action in ("like", "comment") and reports:
            t = random.choice(reports)
            tt, tid = "report", t.id
        elif action == "vote" and proposals:
            t = random.choice(proposals)
            tt, tid = "proposal", t.id
        else:
            tt, tid = ("report", random.choice(reports).id) if reports else (None, None)
        db.add(models.ActivityLog(
            user_id=u.user_id,
            action=action,
            target_type=tt,
            target_id=tid,
            meta={"snippet": "seed"},
            created_at=NOW - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23)),
        ))
        log_count += 1

    db.commit()
    print(f"  notifications: {n_count}개, activity_logs: {log_count}개 시드 완료")


def reset_mock(db: Session):
    """mock 데이터만 삭제. (legacy/관리자/실데이터는 보존하지 못하므로 주의)"""
    print("⚠️  --reset: mock 데이터 삭제 중...")
    for tbl in (
        models.ChecklistTemplate,
        models.Notification,
        models.ActivityLog,
        models.SurveyAnswer,
        models.SurveyResponse,
        models.SurveyQuestion,
        models.Survey,
        models.ProposalComment,
        models.ProposalLike,
        models.ProposalView,
        models.NewProposal,
        models.ReportComment,
        models.ReportLike,
        models.ReportImage,
        models.Report,
        models.ChecklistResult,
        models.Persona,
        models.DistrictInsight,
        models.DistrictAnalysis,
    ):
        try:
            db.query(tbl).delete()
        except Exception as e:
            print(f"  delete {tbl.__tablename__} 실패: {e}")
            db.rollback()
    # citizen 사용자만 삭제 (admin/실유저 보존)
    db.query(models.User).filter(models.User.ID.like("citizen%")).delete(synchronize_session=False)
    db.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="기존 mock 행 삭제 후 재삽입")
    args = parser.parse_args()

    print("== Busan BDP — Full Mock Seeder ==")
    print(f"  대상 DB: {engine.url}")

    # 테이블 생성 보장
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if args.reset:
            reset_mock(db)
        upsert_users(db)
        seed_reports(db)
        seed_proposals(db)
        seed_surveys(db)
        seed_checklist_results(db)
        seed_checklist_templates(db)
        seed_dashboard_data(db)
        seed_notifications_and_logs(db)
        print("✅  시드 완료")
    finally:
        db.close()


if __name__ == "__main__":
    main()
