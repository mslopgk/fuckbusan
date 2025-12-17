from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =========================================================
# [설정 구역] 여기를 본인 HeidiSQL 정보로 바꿔주세요!
# =========================================================
DB_ID = "root"                # HeidiSQL 접속 아이디 (보통 root)
DB_PW = "1234"                # HeidiSQL 접속 비밀번호 (본인이 설정한 거!)
DB_HOST = "127.0.0.1"         # 주소 (그대로 두세요)
DB_PORT = "3306"              # 포트 (HeidiSQL에 적힌 포트, 보통 3306)
DB_NAME = "mydata"   # 데이터베이스 이름 (HeidiSQL에 만들어둔 것)
# =========================================================

# SQLite 연결 주소 만들기 (파일 기반 DB)
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app_v2.db"

# 엔진 생성 (SQLite용 설정)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()