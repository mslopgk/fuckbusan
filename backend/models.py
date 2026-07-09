from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, JSON, DateTime, DECIMAL, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class DistrictAnalysis(Base):
    __tablename__ = "district_analysis"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String(50), index=True)
    year = Column(String(4), index=True)
    housing_score = Column(Float)
    env_score = Column(Float)
    transport_score = Column(Float)
    safety_score = Column(Float)
    culture_score = Column(Float)
    industry_score = Column(Float)
    welfare_score = Column(Float)
    education_score = Column(Float)

class DistrictInsight(Base):
    __tablename__ = "district_insights"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String(50), index=True)
    year = Column(String(4))
    type = Column(String(50)) # danger, warning, info
    title = Column(String(255))
    description = Column(String(1000))
    icon = Column(String(255))
    image_url = Column(String(500))
    severity = Column(String(50))
    date = Column(String(50))
    proposer = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    category = Column(String(50)) # 'survey', 'diagnosis', 'report'

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String(50), index=True)
    year = Column(String(4))
    name = Column(String(50))
    age = Column(Integer)
    gender = Column(String(10))
    job = Column(String(100))
    image_emoji = Column(String(50))
    image_url = Column(String(500))
    quote = Column(String(500))
    full_quote = Column(Text)
    tags = Column(JSON)
    pain_points = Column(JSON)
    suggestions = Column(JSON)
    expected_effects = Column(JSON)
    stats = Column(JSON)
    # 가상시민 카드/상세 표시 + RAG 자동 생성 대비
    categories = Column(JSON)
    avatar_initial = Column(String(10))
    importance = Column(Integer, default=100, index=True)
    detail = Column(JSON)
    # RAG 메타데이터: 시드/자동생성 구분, 근거 데이터 추적
    generation_source = Column(String(20), default="seed", index=True)
    generated_at = Column(DateTime, default=datetime.now)
    evidence = Column(JSON)  # RAG: [{type:"report", id:123}, {type:"proposal", id:45}, ...]

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    user_id = Column(Integer, primary_key=True, index=True)
    ID = Column(String(50), unique=True, index=True, nullable=False)
    PW = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    nickname = Column(String(100))
    email = Column(String(255))              # 이메일 (마이페이지 내 정보 관리)
    phone_num = Column(String(20))
    birth_date = Column(String(20)) # Added birth_date
    address = Column(String(255))           # 회원가입 주소 (도로명/지번)
    detailed_address = Column(String(255))  # 회원가입 상세주소
    created_at = Column(DateTime, default=datetime.now)
    district_code = Column(String(50))
    is_approved = Column(Boolean, default=True, server_default='1')
    last_login = Column(DateTime)   # 이번 로그인 시각
    prev_login = Column(DateTime)   # 직전(이전) 로그인 시각 — "마지막 접속 일시" 표시용

class ChecklistResult(Base):
    __tablename__ = "checklist_result"

    # 기존 checklist 테이블 구조를 그대로 가져와야 하지만, 
    # 일단 핵심인 id와 user_id 연결만 먼저 정의합니다.
    result_id = Column(Integer, primary_key=True, index=True)
    진단지역 = Column(String(100))
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    ID = Column(String(50), nullable=True) # User ID string
    created_at = Column(DateTime, default=datetime.now)
    district_code = Column(String(50))
    위도 = Column(DECIMAL(10, 8)) # Adjusted precision safely
    경도 = Column(DECIMAL(11, 8))
    대분류 = Column(String(50))
    중분류 = Column(String(50))
    질문기준 = Column(String(255))
    answers = Column(String(4000)) # LONGTEXT equivalent roughly, or use Text
    점수 = Column(Integer)
    리뷰 = Column(String(2000))
    만족도 = Column(String(50))
    이미지경로 = Column(String(500))
    진단대상 = Column(String(50), nullable=True)

    
    # User 테이블과의 관계 설정 (선택사항)
    owner = relationship("User", back_populates="results")

User.results = relationship("ChecklistResult", back_populates="owner")

class DiagnosisRegion(Base):
    """진단 지역 registry — 어드민이 등록/수정/삭제하는 진단 대상 지역.

    진단 기록(ChecklistResult)이 0건이어도 목록에 존재하며 등록일을 가진다.
    진단수/진단인원은 ChecklistResult.진단지역 == name 으로 집계한다.
    """
    __tablename__ = "diagnosis_regions"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # 진단지역명
    district_code = Column(String(50), nullable=True)
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    created_at = Column(DateTime, default=datetime.now)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    author_name = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    sub_category = Column(String(100), nullable=True)
    title = Column(String(255))
    content = Column(Text, nullable=True)
    region = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    detailed_address = Column(String(255), nullable=True)
    lat = Column(DECIMAL(10, 8), nullable=True)
    lng = Column(DECIMAL(11, 8), nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(20), default="개선예정")  # 개선예정, 개선중, 개선완료, 검토중, 결과안내
    progress_step = Column(Integer, default=1)  # 1:접수, 2:검토중, 3:검토완료, 4:결과안내
    views = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    files = Column(JSON, nullable=True)
    type = Column(String(50), nullable=True)  # legacy field, kept for backward compat
    result_details = Column(JSON, nullable=True)  # { title, image, content, manager, result_date }
    created_at = Column(DateTime, default=datetime.now)


class ReportImage(Base):
    __tablename__ = "report_images"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)


class ReportLike(Base):
    __tablename__ = "report_likes"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.now)


class ReportComment(Base):
    __tablename__ = "report_comments"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    author_name = Column(String(100), nullable=True)  # for seeded comments without real user
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("report_comments.id"), nullable=True)  # 답글(대댓글)
    created_at = Column(DateTime, default=datetime.now)
    user = relationship("User", foreign_keys=[user_id], lazy="select")

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(255))
    title = Column(String(255))
    description = Column(String(2000))
    improvement_plan = Column(String(2000))
    expected_effect = Column(String(2000))
    files = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)

class NewProposal(Base):
    __tablename__ = "new_proposals"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    category = Column(String(100))
    title = Column(String(255))
    content = Column(Text)  # String(4000)에서 Text로 변경 (더 안전함)
    region = Column(String(255))
    detailed_address = Column(String(255), nullable=True)
    files = Column(Text, nullable=True)  # JSON에서 Text로 변경 (호환성 문제 방지)
    lat = Column(DECIMAL(10, 8), nullable=True)
    lng = Column(DECIMAL(11, 8), nullable=True)
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    status = Column(String(50), default="접수중")  # 접수중/검토중/반영 등 진행상태
    created_at = Column(DateTime, default=datetime.now)

    # 작성자 관계 설정
    creator = relationship("User", backref="proposals")

class ProposalLike(Base):
    __tablename__ = "proposal_likes"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    proposal_id = Column(Integer, ForeignKey("new_proposals.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="liked_proposals")
    proposal = relationship("NewProposal", backref="liked_by_users")

class ProposalView(Base):
    __tablename__ = "proposal_views"
    __table_args__ = (
        UniqueConstraint('user_id', 'proposal_id', name='uq_proposal_view_user'),
        {'mysql_charset': 'utf8mb4'},
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    proposal_id = Column(Integer, ForeignKey("new_proposals.id"), nullable=False, index=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="viewed_proposals")
    proposal = relationship("NewProposal", backref="viewed_by_users")

class ProposalComment(Base):
    __tablename__ = "proposal_comments"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("new_proposals.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("proposal_comments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", backref="comments")
    proposal = relationship("NewProposal", backref="comments")
    replies = relationship("ProposalComment", backref="parent_comment", remote_side=[id])


class Survey(Base):
    __tablename__ = "surveys"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    minutes = Column(Integer, default=10)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active / result / closed
    response_count = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now)


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False, index=True)
    order_no = Column(Integer, default=0)
    qtype = Column(String(20), default="single")  # single / multi / text / agree
    text = Column(String(500), nullable=False)
    options = Column(JSON, nullable=True)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    demographics = Column(JSON, nullable=True)
    submitted_at = Column(DateTime, default=datetime.now)


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("survey_responses.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("survey_questions.id"), nullable=False, index=True)
    value = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    kind = Column(String(30), nullable=False)  # like / comment / vote / status / mention / system
    target_type = Column(String(20), nullable=True)  # report / proposal / survey / diagnosis
    target_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=True)
    body = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.now, index=True)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)  # create / update / delete / like / comment / vote
    target_type = Column(String(20), nullable=True)
    target_id = Column(Integer, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)


class ChecklistTemplate(Base):
    """진단 카탈로그 (general/expert) + 종합 설문 마스터 페이로드.

    1 row per (kind, mode):
      - kind='diagnosis', mode='general' / 'expert' → 카테고리·중분류·질문 트리
      - kind='survey',    mode='comprehensive'      → 11개 질문 객체 리스트
    payload는 트리·리스트 그대로 JSON 저장.
    """
    __tablename__ = "checklist_templates"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(20), nullable=False, index=True)
    mode = Column(String(30), nullable=False, index=True)
    title = Column(String(200), nullable=True)
    payload = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.now)


class SurveyChatInterview(Base):
    """AI 대화형 설문에서 수집된 이슈 1건 (포팅: test4 interviews 테이블).

    한 세션(session_id)에서 여러 이슈가 나올 수 있어 이슈당 1 row.
    raw_log 에 수집 dict 전체를 JSON 으로 보관.
    """
    __tablename__ = "survey_chat_interviews"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(40), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    issue_text = Column(Text, nullable=True)
    severity_score = Column(Integer, nullable=True)
    primary_category = Column(String(50), nullable=True)
    location_bucket = Column(String(255), nullable=True)
    evidence_span = Column(Text, nullable=True)
    raw_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)


class SurveyChatSession(Base):
    """AI 대화형 설문 세션 1건 (세션당 1 row).

    나의 활동 '설문' 목록/상세에 사용: AI가 생성한 짧은 제목(title)과
    전체 대화내역(transcript: [{role, content}, ...])을 보관한다.
    """
    __tablename__ = "survey_chat_sessions"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    session_id = Column(String(40), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    title = Column(String(255), nullable=True)
    transcript = Column(JSON, nullable=True)   # [{"role": "user|assistant", "content": "..."}]
    issue_count = Column(Integer, default=0)
    status = Column(String(20), nullable=True, default="신규")  # 어드민 처리상태: 신규/확인/처리중/완료 등
    created_at = Column(DateTime, default=datetime.now, index=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)  # 어드민 수정일시


# =============================================================================
# 공공데이터 대시보드 (PCPublicData) — 실데이터 (출처: data.go.kr, data.busan.go.kr,
# 행정안전부, TAAS, 문체부, 통계청 등. 시드: backend/public_data/seed_data.py)
# =============================================================================

class PublicDistrict(Base):
    """부산 16개 구·군별 실데이터 (구 단위 전수 확보된 지표)."""
    __tablename__ = "public_districts"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String(30), unique=True, index=True)  # 구·군명
    population = Column(Integer, nullable=True)            # 총인구 (2026-05, 행안부)
    accidents = Column(Integer, nullable=True)             # 교통사고 발생건수 (2024, TAAS)
    acc_deaths = Column(Integer, nullable=True)            # 사망
    acc_injuries = Column(Integer, nullable=True)          # 부상
    libraries = Column(Integer, nullable=True)             # 공공도서관 수 (2024, 문체부)


class PublicPopTrend(Base):
    """부산 인구 추이 (연도별 총인구)."""
    __tablename__ = "public_pop_trend"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String(30), index=True, default='부산광역시')
    year = Column(Integer, index=True)
    value = Column(Integer)   # 총인구(명)
    source = Column(String(255), nullable=True)


class PublicThemeStat(Base):
    """테마별 핵심 지표 (통계 리스트 패널). 지역=부산진구/부산."""
    __tablename__ = "public_theme_stats"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String(30), index=True)   # 안전/주거/산업·일자리/교육/환경/문화·여가/보건·복지/교통
    region = Column(String(30))
    metric = Column(String(100))             # 지표명
    value_text = Column(String(60))          # 표시값 (예: "1,130대")
    unit = Column(String(20), nullable=True)  # 단위 (예: "%", "개", "건")
    year = Column(String(20), nullable=True)
    note = Column(String(60), nullable=True) # 부가(예: "부산 내 3위")
    source = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)  # 등록일


class PublicLayer(Base):
    """공공데이터 리스트(지도 레이어) 메타 + 건수."""
    __tablename__ = "public_layers"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(30), unique=True, index=True)
    label = Column(String(40))
    region = Column(String(30), nullable=True)
    count = Column(Integer, nullable=True)   # null = 데이터 출처 미확정
    source = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)


class Announcement(Base):
    """공지사항 + 홍보 통합 (kind 으로 구분). 어드민 CRUD."""
    __tablename__ = "announcements"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(10), index=True, default="notice")  # notice | promo
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)   # 공지 분류 / 홍보 채널 등
    image_url = Column(String(500), nullable=True) # 홍보 배너 이미지
    link_url = Column(String(500), nullable=True)  # 홍보 외부 링크
    pinned = Column(Boolean, default=False)        # 상단 고정
    published = Column(Boolean, default=True)       # 게시 여부
    views = Column(Integer, default=0)
    author = Column(String(50), nullable=True, default="관리자")
    created_at = Column(DateTime, default=datetime.now, index=True)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
