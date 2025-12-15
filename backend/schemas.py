from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

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
    # ... extensible

class UserCreate(BaseModel):
    ID: str
    PW: str
    name: str
    nickname: Optional[str] = None
    phone_num: str
    created_at: Optional[datetime] = None
    district_code: str

class UserLogin(BaseModel):
    ID: str
    PW: str

# 로그인 성공하면 줄 토큰 데이터
class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class ChecklistCreate(BaseModel):
    # 필요한 컬럼들을 여기에 다 적어주세요. 예시입니다.
    진단지역: str
    ID: str
    그룹: int
    Data_No: int
    유형: int
    Category_1type: int
    Category_2type: int
    등록일시: datetime
    위도: float
    경도: float
    대분류: str
    중분류: str
    질문_Num: int
    질문_기준: str
    질문_내용: str
    점수: int
    리뷰: str
    이미지경로: str
    

# 사용자에게 보여줄 내용 (출력용)
class ChecklistResponse(ChecklistCreate):
    result_id: int
    ID: str
    
    class Config:
        orm_mode = True

class ReportCreate(BaseModel):
    type: str
    location: str
    title: str
    content: str
    files: List[str] = []

class SuggestionCreate(BaseModel):
    location: str
    title: str
    description: str
    improvement_plan: str
    expected_effect: str
    files: List[str] = []