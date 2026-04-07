from typing import List, Optional, Any, Dict
from pydantic import BaseModel, validator
from datetime import datetime
import json

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
    class Config:
        orm_mode = True

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
    class Config:
        orm_mode = True

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
    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

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

class ChecklistResponse(ChecklistCreate):
    result_id: int
    ID: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    type: str
    location: str
    title: str
    content: str
    files: List[str] = []

class NewProposalCreate(BaseModel):
    category: str
    title: str
    content: str
    region: str
    detailed_address: Optional[str] = None
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

    class Config:
        orm_mode = True

    @validator("files", pre=True)
    def parse_files(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
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

    class Config:
        orm_mode = True

ProposalCommentRead.update_forward_refs()