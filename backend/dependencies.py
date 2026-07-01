# backend/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import get_db
from models import User
from utils import SECRET_KEY, ALGORITHM

# 2. 토큰을 어디서 가져올지 설정 (로그인 주소)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# 3. 토큰을 까서 사용자 정보를 가져오는 함수 (핵심!)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명이 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 토큰 해석
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        ID: str = payload.get("sub")
        if ID is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # DB에서 사용자 찾기
    user = db.query(User).filter(User.ID == ID).first()
    if user is None:
        raise credentials_exception
    return user