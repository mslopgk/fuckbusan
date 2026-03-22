from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

# 파일 경로에 맞게 import
from database import get_db
from models import User
from schemas import UserCreate, Token

# === 설정 (비밀번호 및 토큰) ===
# (주의: 이 키는 외부에 노출되면 안 됩니다!)
SECRET_KEY = "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"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/users/login", auto_error=False)

router = APIRouter(prefix="/users", tags=["users"])

# --- [함수들] ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# [★ 보안요원 함수: 이제 여기서 직접 관리합니다]
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
        # Virtual Admin User (Not in DB)
        return User(
            user_id=999999,
            ID="admin",
            name="관리자",
            nickname="관리자",
            district_code="admin"
        )

    user = db.query(User).filter(User.ID == username).first()
    if user is None:
        raise credentials_exception
    return user

# [★ 선택적 보안요원: 로그인 안 해도 통과, 하지만 누구인지 확인만 함]
def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        # oauth2_scheme은 토큰이 없으면 401을 내보내므로, 
        # 선택적으로 하려면 직접 Header에서 가져오거나 
        # 별도의 Dependency를 만들어야 할 수도 있습니다. 
        # 하지만 일단 oauth2_scheme을 쓰면 강제성이 있으므로 수동으로 처리하는 로직을 고려합니다.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        if username == "admin":
            return User(
                user_id=999999,
                ID="admin",
                name="관리자",
                nickname="관리자",
                district_code="admin"
            )

        user = db.query(User).filter(User.ID == username).first()
        return user
    except:
        return None

# --- [API] ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.ID == user.ID).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")
    
    hashed_password = get_password_hash(user.PW)
    
    new_user = User(
        ID=user.ID,
        PW=hashed_password,
        name=user.name,
        nickname=user.nickname,
        phone_num=user.phone_num,
        district_code=user.district_code
    )
    db.add(new_user)
    db.commit()
    return {"message": "회원가입 성공"}

# --- [추가] 로그인할 때 받을 데이터 모양 정의 ---
class UserLogin(BaseModel):
    ID: str
    PW: str

# --- [수정] JSON을 받는 로그인 함수 ---
@router.post("/login", response_model=Token)
def login(user_input: UserLogin, db: Session = Depends(get_db)):
    # 0. Virtual Admin Check (No DB required)
    if user_input.ID == "admin" and user_input.PW == "1234":
        access_token = create_access_token(data={"sub": "admin"})
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "user_name": "관리자",
            "district_code": "admin"
        }

    # 1. 아이디로 유저 찾기
    user = db.query(User).filter(User.ID == user_input.ID).first()
    
    # 2. 유저가 없거나 비밀번호가 틀리면 에러
    if not user or not verify_password(user_input.PW, user.PW):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 틀렸습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. 로그인 성공 시 토큰 발급
    access_token = create_access_token(data={"sub": user.ID})
    
    # 프론트엔드로 토큰과 유저 이름 전송
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_name": user.name,
        "district_code": user.district_code
    }