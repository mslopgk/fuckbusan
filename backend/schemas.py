from typing import List, Optional, Any, Dict
from pydantic import BaseModel, validator, ConfigDict
from datetime import datetime
import json

_orm = ConfigDict(from_attributes=True)

class DistrictAnalysisBase(BaseModel):
    district_code: str
    year: str
    housing_score: float
    env_score: float
    transport_score: float
    safety_score: float
    culture_score: float
    industry_score: float
    welfare_score: float
    education_score: float

class DistrictAnalysis(DistrictAnalysisBase):
    id: int
    model_config = _orm

class InsightBase(BaseModel):
    district_code: str
    year: str
    type: str
    title: str
    description: str
    icon: Optional[str] = None
    image_url: Optional[str] = None
    severity: Optional[str] = None
    date: Optional[str] = None
    proposer: Optional[str] = None
    latitude: float
    longitude: float
    category: Optional[str] = None

class Insight(InsightBase):
    id: int
    model_config = _orm

class PersonaBase(BaseModel):
    district_code: str
    year: str
    name: str
    age: int
    gender: Optional[str] = None
    job: str
    image_emoji: str
    quote: str
    full_quote: str
    tags: List[str] = []
    pain_points: List[str] = []
    suggestions: List[str] = []
    expected_effects: List[str] = []
    stats: Dict[str, Any] = {}

class Persona(PersonaBase):
    id: int
    model_config = _orm

# Dashboard Response Models
class DashboardSummary(BaseModel):
    score: float
    grade: str
    trend: str

class AnalysisChartData(BaseModel):
    name: str # district name
    housing: float
    env: float
    transport: float
    safety: float

class UserCreate(BaseModel):
    ID: str
    PW: str
    name: str
    nickname: Optional[str] = None
    phone_num: str
    created_at: Optional[datetime] = None
    district_code: str
    birth_date: Optional[str] = None

class UserOut(BaseModel):
    user_id: int
    ID: str
    name: str
    nickname: Optional[str] = None
    phone_num: Optional[str] = None
    created_at: Optional[datetime] = None
    district_code: Optional[str] = None
    birth_date: Optional[str] = None

    model_config = _orm

class UserLogin(BaseModel):
    ID: str
    PW: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone_num: Optional[str] = None
    birth_date: Optional[str] = None
    new_pw: Optional[str] = None # For password reset

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    district_code: Optional[str] = None

class ChecklistCreate(BaseModel):
    진단지역: Optional[str] = None
    ID: Optional[str] = None
    district_code: Optional[str] = None
    위도: Optional[float] = None
    경도: Optional[float] = None
    대분류: Optional[str] = None
    중분류: Optional[str] = None
    질문기준: Optional[str] = None
    answers: Optional[str] = None # JSON String
    점수: Optional[int] = None
    리뷰: Optional[str] = None
    만족도: Optional[str] = None
    이미지경로: Optional[str] = None
    진단대상: Optional[str] = None

class ChecklistResponse(ChecklistCreate):
    result_id: int
    ID: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = _orm

class ReportCreate(BaseModel):
    type: Optional[str] = None  # legacy
    category: Optional[str] = None
    sub_category: Optional[str] = None
    title: str
    content: Optional[str] = None
    region: Optional[str] = None
    location: Optional[str] = None
    detailed_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    image_url: Optional[str] = None
    files: List[str] = []


class ReportRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    author: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    title: str
    content: Optional[str] = None
    region: Optional[str] = None
    location: Optional[str] = None
    detailed_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    image: Optional[str] = None  # frontend uses `image`
    status: Optional[str] = None
    progress_step: Optional[int] = None
    views: Optional[int] = 0
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    date: Optional[str] = None  # formatted YYYY.MM.DD
    result_details: Optional[Dict[str, Any]] = None
    comments_list: List[Dict[str, Any]] = []

    model_config = _orm

class SuggestionCreate(BaseModel):
    location: str
    title: str
    description: str
    improvement_plan: Optional[str] = None
    expected_effect: Optional[str] = None
    files: List[str] = []

class NewProposalCreate(BaseModel):
    category: str
    title: str
    content: str
    region: str
    detailed_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    files: List[str] = []

class NewProposalRead(NewProposalCreate):
    id: int
    user_id: Optional[int] = None
    views_count: int
    likes_count: int
    comments_count: Optional[int] = 0
    nickname: Optional[str] = None
    is_mine: Optional[bool] = False
    has_voted: Optional[bool] = False
    created_at: datetime

    model_config = _orm

    @validator("files", pre=True)
    def parse_files(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

class ProposalCommentBase(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

class ProposalCommentCreate(ProposalCommentBase):
    pass

class ProposalCommentUpdate(BaseModel):
    content: str

class ProposalCommentRead(ProposalCommentBase):
    id: int
    user_id: str
    nickname: str
    created_at: datetime
    replies: List['ProposalCommentRead'] = []

    model_config = _orm

ProposalCommentRead.update_forward_refs()


# ===== Report comments / detail =====

class ReportCommentCreate(BaseModel):
    content: str

class ReportCommentRead(BaseModel):
    id: int
    author: Optional[str] = None
    content: str
    date: Optional[str] = None

    model_config = _orm


# ===== Surveys =====

class SurveyQuestionRead(BaseModel):
    id: int
    order_no: int
    qtype: str
    text: str
    options: Optional[List[str]] = None

    model_config = _orm

class SurveyListItem(BaseModel):
    id: int
    title: str
    minutes: int
    period: str
    status: str
    response_count: int

class SurveyDetail(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    minutes: int
    period: str
    status: str
    response_count: int
    questions: List[SurveyQuestionRead] = []

class SurveyAnswerSubmit(BaseModel):
    question_id: int
    value: Any

class SurveyResponseSubmit(BaseModel):
    answers: List[SurveyAnswerSubmit]
    demographics: Optional[Dict[str, Any]] = None


# ===== Home / stats =====

class HomeStats(BaseModel):
    reports_count: int
    proposals_count: int
    diagnoses_count: int
    citizens_count: int


class HomeCitizen(BaseModel):
    id: int
    name: str
    age: int
    tags: List[str] = []
    desc: str

class HomeArchive(BaseModel):
    id: int
    title: str
    desc: str
    img: Optional[str] = None


# ===== Survey admin (create/update) =====

class SurveyQuestionCreate(BaseModel):
    qtype: str
    text: str
    options: List[str] = []
    order_no: Optional[int] = None

class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    minutes: int = 10
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: str = "active"
    questions: List[SurveyQuestionCreate] = []

class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    minutes: Optional[int] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: Optional[str] = None
    questions: Optional[List[SurveyQuestionCreate]] = None


# ===== Notifications =====

class NotificationRead(BaseModel):
    id: int
    kind: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    title: Optional[str] = None
    body: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = _orm


# ===== Activity logs =====

class ActivityLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = _orm


# ===== Search =====

class SearchHit(BaseModel):
    type: str  # report / proposal / survey
    id: int
    title: str
    snippet: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    score: Optional[float] = None


# ===== Admin user management =====

class AdminUserUpdate(BaseModel):
    nickname: Optional[str] = None
    phone_num: Optional[str] = None
    district_code: Optional[str] = None
    role: Optional[str] = None  # 'admin' / 'user' (only district_code='admin' for admin marker)


# ===== Comment update (Report) =====

class ReportCommentUpdate(BaseModel):
    content: str