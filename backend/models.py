from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, JSON, DateTime, DECIMAL
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class LegacyUser(Base):
    __tablename__ = "legacy_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.now)
    user_id = Column(Integer, ForeignKey("legacy_users.id"))

class DistrictAnalysis(Base):
    __tablename__ = "district_analysis"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String, index=True)
    year = Column(String, index=True)
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
    district_code = Column(String, index=True)
    year = Column(String)
    type = Column(String) # danger, warning, info
    title = Column(String)
    description = Column(String)
    icon = Column(String)
    image_url = Column(String)
    severity = Column(String)
    date = Column(String)
    proposer = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    category = Column(String) # 'survey', 'diagnosis', 'report'

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String, index=True)
    year = Column(String)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    job = Column(String)
    image_emoji = Column(String)
    image_url = Column(String) # Added for avatar images
    quote = Column(String)
    full_quote = Column(String)
    tags = Column(JSON) # Changed to JSON
    pain_points = Column(JSON)
    suggestions = Column(JSON)
    expected_effects = Column(JSON)
    stats = Column(JSON)

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    ID = Column(String(50), unique=True, index=True, nullable=False)
    PW = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    nickname = Column(String(100))
    phone_num = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    district_code = Column(String)

class ChecklistResult(Base):
    __tablename__ = "checklist_result"

    # 기존 checklist 테이블 구조를 그대로 가져와야 하지만, 
    # 일단 핵심인 id와 user_id 연결만 먼저 정의합니다.
    result_id = Column(Integer, primary_key=True, index=True)
    진단지역 =  Column(String)
    ID = Column(String(50), ForeignKey("users.ID"), index=True, nullable=False)
    그룹 = Column(Integer)
    Data_No = Column(Integer)
    유형 = Column(Integer)
    Category_1type = Column(Integer)
    Category_2type = Column(Integer)
    등록일시 = Column(DateTime)
    위도 = Column(DECIMAL(9, 6), nullable=False)
    경도 = Column(DECIMAL(10, 6), nullable=False)
    대분류 = Column(String)
    중분류 = Column(String)
    질문_Num = Column(Integer)
    질문_기준 = Column(String)
    질문_내용 = Column(String)
    점수 = Column(Integer)
    리뷰 = Column(String)
    이미지경로 = Column(String)

    
    # User 테이블과의 관계 설정 (선택사항)
    owner = relationship("User", back_populates="results")

User.results = relationship("ChecklistResult", back_populates="owner")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # facility, safety, traffic
    location = Column(String)
    title = Column(String)
    content = Column(String)
    files = Column(JSON) # List of file paths/names
    created_at = Column(DateTime, default=datetime.now)

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String)
    title = Column(String)
    description = Column(String)
    improvement_plan = Column(String)
    expected_effect = Column(String)
    files = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)
