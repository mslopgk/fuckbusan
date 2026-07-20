import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
import bcrypt
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

# 신규 해시는 argon2. 기존 계정 대부분은 bcrypt($2...) 해시인데, passlib 1.7.4가
# bcrypt 5.x 백엔드 초기화에 실패(ValueError)하므로 bcrypt 해시는 bcrypt 라이브러리로 직접 검증한다.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/users/login", auto_error=False)

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    if not hashed_password:
        return False
    # 기존 bcrypt 해시($2a/$2b/$2y) — bcrypt 라이브러리로 직접 검증 (passlib 우회)
    if hashed_password.startswith("$2"):
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8")[:72],
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False
    # argon2 등 그 외는 passlib
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
    # 승인제(B): 전문가/관리자 가입은 (슈퍼)관리자 승인 전까지 미승인(False)으로 시작.
    # 일반 시민(general/구·군명)만 자동승인(True). 공개 가입으로 관리자 즉시권한 획득 방지(보안).
    needs_approval = user.district_code in ("expert", "admin")
    new_user = User(
        ID=user.ID, PW=hashed_password, name=user.name,
        nickname=user.nickname, email=user.email, phone_num=user.phone_num,
        district_code=user.district_code, birth_date=user.birth_date,
        address=user.address, detailed_address=user.detailed_address,
        is_approved=(not needs_approval)
    )
    db.add(new_user)
    db.commit()
    return {
        "message": "회원가입 성공",
        "is_approved": (not needs_approval),
        # 전문가·관리자는 승인 후 로그인 가능 — 프론트 안내용
        "requires_approval": needs_approval,
    }

@router.post("/users/login", response_model=Token)
def login(user_input: UserLogin, db: Session = Depends(get_db)):
    if user_input.ID == "admin" and user_input.PW == ADMIN_PASSWORD:
        access_token = create_access_token(data={"sub": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "user_name": "관리자", "district_code": "admin"}
    user = db.query(User).filter(User.ID == user_input.ID).first()
    if not user or not verify_password(user_input.PW, user.PW):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")
    # 승인제(B): 미승인 전문가·관리자는 로그인 차단. (슈퍼관리자 admin은 위에서 이미 통과,
    # 일반 시민은 district_code가 expert/admin이 아니라 영향 없음. 기존 승인된 계정은 그대로.)
    if user.district_code in ("expert", "admin") and not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="관리자 승인 대기 중입니다. 승인 완료 후 로그인하실 수 있습니다.",
        )
    # 접속 시각 갱신: 직전 로그인(prev_login)을 "마지막 접속 일시"로 표시 → 이번 로그인 전 값 보존
    user.prev_login = user.last_login or user.created_at
    user.last_login = datetime.now()
    db.commit()
    access_token = create_access_token(data={"sub": user.ID})
    return {"access_token": access_token, "token_type": "bearer", "user_name": user.name, "district_code": user.district_code}

@router.get("/users/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "ID": current_user.ID,
        "name": current_user.name,
        "nickname": current_user.nickname,
        "email": current_user.email or "",
        "phone_num": current_user.phone_num,
        "district_code": current_user.district_code,
        "birth_date": current_user.birth_date or "",
        "address": current_user.address or "",
        "detailed_address": current_user.detailed_address or "",
        # "마지막 접속 일시" = 직전 로그인(prev_login). 없으면 가입일(created_at) 폴백.
        "last_login": (current_user.prev_login or current_user.last_login or current_user.created_at).isoformat()
        if (current_user.prev_login or current_user.last_login or current_user.created_at) else None,
    }

def _profile_avatar_prompt(birth_date: str) -> str:
    """회원 생년월일 기반 아바타 프롬프트. 성별은 회원정보에 없으므로 중립 프롬프트 사용.

    AI 가상시민(_build_prompt, ai_citizens.py)과 동일한 3D 카툰 스타일 유지."""
    import re as _re
    digits = _re.sub(r"\D", "", birth_date or "")
    age_desc = "adult"
    if len(digits) >= 4:
        try:
            birth_year = int(digits[:4])
            age = datetime.now().year - birth_year
            if 0 < age < 120:
                band = min(max((age // 10) * 10, 10), 80)
                age_desc = f"in their {band}s"
        except ValueError:
            pass
    return (
        f"close-up head and shoulders portrait of a Korean person {age_desc}, "
        "gender-neutral androgynous appearance, "
        "Pixar-style 3D cartoon character, "
        "face occupies most of the frame, no full body, cropped at the chest, "
        "warm friendly smile, relaxed natural expression, slight head tilt, "
        "clean light gray background, "
        "portrait orientation (taller than wide), "
        "soft studio lighting, vibrant colors, "
        "no text, no watermark, no border"
    )


@router.get("/users/me/avatar")
async def get_my_avatar(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """회원 프로필 아바타 (마이페이지 프로필 카드).

    - 캐시(파일 존재) 시 즉시 URL 반환 — 재생성 없음.
    - 없으면 AI 가상시민과 동일한 Imagen 파이프라인으로 생성 (나이대 기반, 성별 미수집 → 중립).
    - 생성 실패/키 미설정 시 {"url": None, "fallback": True} — 프론트는 중립 실루엣 유지.
    """
    from .ai_citizens import AVATARS_DIR, generate_avatar_bytes

    filename = f"user_{current_user.user_id}.png"
    path = os.path.join(AVATARS_DIR, filename)
    url = f"/uploads/avatars/{filename}"

    if os.path.exists(path):
        if not getattr(current_user, "avatar_path", None):
            try:
                current_user.avatar_path = url
                db.commit()
            except Exception:
                db.rollback()
        return {"url": url, "cached": True}

    if not os.getenv("GEMINI_API_KEY"):
        return {"url": None, "fallback": True, "reason": "GEMINI_API_KEY not configured"}

    try:
        img_bytes = await generate_avatar_bytes(_profile_avatar_prompt(current_user.birth_date))
    except Exception as e:
        # 생성 실패는 치명적이지 않음 — 프론트가 중립 실루엣을 유지하도록 폴백 마커 반환
        detail = getattr(e, "detail", None) or str(e)
        return {"url": None, "fallback": True, "reason": str(detail)}

    os.makedirs(AVATARS_DIR, exist_ok=True)
    with open(path, "wb") as f:
        f.write(img_bytes)

    try:
        current_user.avatar_path = url
        db.commit()
    except Exception:
        db.rollback()  # admin 가상 유저 등 세션 미소속 객체 대비 — 파일 캐시로 충분

    return {"url": url, "cached": False}


@router.put("/users/me", response_model=UserOut)
def update_my_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.nickname is not None:
        current_user.nickname = user_update.nickname
    if user_update.email is not None:
        current_user.email = user_update.email
    if user_update.phone_num is not None:
        current_user.phone_num = user_update.phone_num
    if user_update.birth_date is not None:
        current_user.birth_date = user_update.birth_date
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.detailed_address is not None:
        current_user.detailed_address = user_update.detailed_address
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

class VerifyUserRequest(BaseModel):
    ID: str
    phone_num: str

class ResetPwByPhoneRequest(BaseModel):
    ID: str
    phone_num: str
    new_pw: str

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

@router.post("/users/verify-user")
def verify_user(req: VerifyUserRequest, db: Session = Depends(get_db)):
    """ID + 휴대폰번호 일치 여부 확인 (비밀번호 재설정 전 본인확인용)"""
    user = db.query(User).filter(User.ID == req.ID, User.phone_num == req.phone_num).first()
    if not user:
        raise HTTPException(status_code=404, detail="일치하는 회원 정보가 없습니다.")
    return {"verified": True}

@router.post("/users/reset-password-by-phone")
def reset_password_by_phone(req: ResetPwByPhoneRequest, db: Session = Depends(get_db)):
    """ID + 휴대폰번호 검증 후 새 비밀번호로 재설정 (로그인 없이, 비번찾기 플로우용)"""
    user = db.query(User).filter(User.ID == req.ID, User.phone_num == req.phone_num).first()
    if not user:
        raise HTTPException(status_code=404, detail="일치하는 회원 정보가 없습니다.")
    if not req.new_pw or len(req.new_pw) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 6자 이상이어야 합니다.")
    user.PW = get_password_hash(req.new_pw)
    db.commit()
    return {"message": "비밀번호가 재설정되었습니다."}