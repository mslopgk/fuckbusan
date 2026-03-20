from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, JSON, DateTime, DECIMAL, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class LegacyUser(Base):
    __tablename__ = "legacy_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50))
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255))
    timestamp = Column(DateTime, default=datetime.now)
    user_id = Column(Integer, ForeignKey("legacy_users.id"))

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
    image_url = Column(String(500)) # Added for avatar images
    quote = Column(String(500))
    full_quote = Column(String(1000))
    tags = Column(JSON) # Changed to JSON
    pain_points = Column(JSON)
    suggestions = Column(JSON)
    expected_effects = Column(JSON)
    stats = Column(JSON)

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    user_id = Column(Integer, primary_key=True, index=True)
    ID = Column(String(50), unique=True, index=True, nullable=False)
    PW = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    nickname = Column(String(100))
    phone_num = Column(String(20))
    created_at = Column(DateTime, default=datetime.now)
    district_code = Column(String(50))

class ChecklistResult(Base):
    __tablename__ = "checklist_result"

    # 기존 checklist 테이블 구조를 그대로 가져와야 하지만, 
    # 일단 핵심인 id와 user_id 연결만 먼저 정의합니다.
    result_id = Column(Integer, primary_key=True, index=True)
    진단지역 = Column(String(100))
    user_id = Column(Integer, ForeignKey("users.user_id")) # FK added for relationship
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

    
    # User 테이블과의 관계 설정 (선택사항)
    owner = relationship("User", back_populates="results")

User.results = relationship("ChecklistResult", back_populates="owner")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50)) # facility, safety, traffic
    location = Column(String(255))
    title = Column(String(255))
    content = Column(String(2000))
    files = Column(JSON) # List of file paths/names
    created_at = Column(DateTime, default=datetime.now)

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
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    category = Column(String(100))
    title = Column(String(255))
    content = Column(Text)  # String(4000)에서 Text로 변경 (더 안전함)
    region = Column(String(255))
    detailed_address = Column(String(255), nullable=True)
    files = Column(Text, nullable=True)  # JSON에서 Text로 변경 (호환성 문제 방지)
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

    # 작성자 관계 설정
    creator = relationship("User", backref="proposals")

class ProposalLike(Base):
    __tablename__ = "proposal_likes"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    proposal_id = Column(Integer, ForeignKey("new_proposals.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="liked_proposals")
    proposal = relationship("NewProposal", backref="liked_by_users")

class ProposalView(Base):
    __tablename__ = "proposal_views"
    __table_args__ = {'mysql_charset': 'utf8mb4'}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    proposal_id = Column(Integer, ForeignKey("new_proposals.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="viewed_proposals")
    proposal = relationship("NewProposal", backref="viewed_by_users")
