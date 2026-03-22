import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DB_ID = os.getenv("DB_USER", "root")
DB_PW = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "busan_design_db")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_ID}:{DB_PW}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# 엔진 생성 (MariaDB용)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"charset": "utf8mb4"},
    pool_size=2,
    max_overflow=3,
    pool_timeout=10,
    pool_recycle=1800,
)
# SQLite용 기존 설정 (참고용)
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app_v3.db"
# engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()