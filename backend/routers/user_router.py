# backend/router/user_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# 내 파일들 가져오기 (위치 중요!)
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, Token

# === 설정 (비밀번호 및 토큰) ===
SECRET_KEY = "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"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/users", tags=["users"])

# --- 함수들 ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- API ---
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.ID == user.ID).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    
    hashed_password = get_password_hash(user.PW)
    new_user = User(ID=user.ID, PW=hashed_password, name=user.name, nickname=user.nickname, phone_num=user.phone_num)
    db.add(new_user)
    db.commit()
    return {"message": "회원가입 성공"}

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.ID == user.ID).first()
    if not db_user or not verify_password(user.PW, db_user.PW):
        raise HTTPException(status_code=400, detail="아이디 또는 비밀번호가 틀렸습니다.")
    
    access_token = create_access_token(data={"sub": db_user.ID})
    return {"access_token": access_token, "token_type": "bearer", "user_name": db_user.name}