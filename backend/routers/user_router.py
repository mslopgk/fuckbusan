import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

# 파일 경로에 맞게 import
from database import get_db
from models import User
from schemas import UserCreate, Token, UserOut, UserLogin, UserUpdate

router = APIRouter(tags=["users"])

# --- [비밀번호 및 토큰 설정] ---
SECRET_KEY = os.getenv("SECRET_KEY", "busan-public-design-secret-key-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/users/login", auto_error=False)

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명을 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    if username == "admin":
        return User(user_id=999999, ID="admin", name="관리자", nickname="관리자", district_code="admin")

    user = db.query(User).filter(User.ID == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None

    if username == "admin":
        return User(user_id=999999, ID="admin", name="관리자", nickname="관리자", district_code="admin")

    return db.query(User).filter(User.ID == username).first()


def require_admin(user: Optional[User]):
    if not user or user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

# =============================================================================
# [API - /api/users] 관리자용 엔드포인트
# =============================================================================

@router.get("/api/users", response_model=List[UserOut])
def list_users(
    user_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    query = db.query(User)
    if user_type:
        query = query.filter(User.district_code == user_type)
    return query.all()

@router.put("/api/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = user_data.name
    user.nickname = user_data.nickname
    user.phone_num = user_data.phone_num
    user.district_code = user_data.district_code
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# =============================================================================
# [API - /users] 일반 사용자용 엔드포인트
# =============================================================================

@router.post("/users/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.ID) < 4:
        raise HTTPException(status_code=400, detail="아이디는 4자 이상이어야 합니다.")
    if len(user.PW) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다.")
    if user.ID == "admin":
        raise HTTPException(status_code=400, detail="사용할 수 없는 아이디입니다.")
    existing_user = db.query(User).filter(User.ID == user.ID).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    hashed_password = get_password_hash(user.PW)
    new_user = User(
        ID=user.ID, PW=hashed_password, name=user.name,
        nickname=user.nickname, phone_num=user.phone_num,
        district_code=user.district_code, birth_date=user.birth_date
    )
    db.add(new_user)
    db.commit()
    return {"message": "회원가입 성공"}

@router.post("/users/login", response_model=Token)
def login(user_input: UserLogin, db: Session = Depends(get_db)):
    if user_input.ID == "admin" and user_input.PW == ADMIN_PASSWORD:
        access_token = create_access_token(data={"sub": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "user_name": "관리자", "district_code": "admin"}
    user = db.query(User).filter(User.ID == user_input.ID).first()
    if not user or not verify_password(user_input.PW, user.PW):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")
    access_token = create_access_token(data={"sub": user.ID})
    return {"access_token": access_token, "token_type": "bearer", "user_name": user.name, "district_code": user.district_code}

@router.get("/users/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "ID": current_user.ID,
        "name": current_user.name,
        "nickname": current_user.nickname,
        "phone_num": current_user.phone_num,
        "district_code": current_user.district_code,
        "birth_date": current_user.birth_date or ""
    }

@router.put("/users/me", response_model=UserOut)
def update_my_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone_num is not None:
        current_user.phone_num = user_update.phone_num
    if user_update.birth_date is not None:
        current_user.birth_date = user_update.birth_date
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/users/reset-password")
def reset_password(req: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not req.new_pw:
        raise HTTPException(status_code=400, detail="새 비밀번호를 입력해주세요.")
    current_user.PW = get_password_hash(req.new_pw)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}

class FindIdRequest(BaseModel):
    name: str
    phone_num: str

class FindPwRequest(BaseModel):
    ID: str
    phone_num: str

@router.post("/users/find-id")
def find_id(req: FindIdRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.name == req.name, User.phone_num == req.phone_num).first()
    if not user:
        raise HTTPException(status_code=404, detail="일치하는 회원 정보가 없습니다.")
    return {"ID": user.ID}

@router.post("/users/find-pw")
def find_pw(req: FindPwRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.ID == req.ID, User.phone_num == req.phone_num).first()
    if not user:
        raise HTTPException(status_code=404, detail="일치하는 회원 정보가 없습니다.")
    import random, string
    temp_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    user.PW = get_password_hash(temp_pw)
    db.commit()
    return {"temp_password": temp_pw}