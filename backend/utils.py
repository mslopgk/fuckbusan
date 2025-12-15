from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT 설정 (실제 운영 시에는 .env에서 가져와야 함)
SECRET_KEY = "supersecretkey_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
