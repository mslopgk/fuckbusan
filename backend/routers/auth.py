from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, database, utils
from pydantic import BaseModel
from datetime import timedelta

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

class UserCreate(BaseModel):
    email: str
    password: str
    username: str = "User" # Default for backwards compat if needed, but signup will require it

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str # Add username to response
    district_code: str = None # Add district_code to response

@router.post("/signup", response_model=dict)
def signup(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.LegacyUser).filter(models.LegacyUser.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    
    hashed_password = utils.get_password_hash(user.password)
    new_user = models.LegacyUser(email=user.email, hashed_password=hashed_password, username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "회원가입이 완료되었습니다.", "email": new_user.email, "username": new_user.username}

@router.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    # Login schema uses UserCreate but username is optional there really, better practice is separate schemas but we stick to simplest for now
    # We only need email/pw for login check.
    db_user = db.query(models.LegacyUser).filter(models.LegacyUser.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    # Fetch district_code from User table if it exists
    # Assuming LegacyUser.email corresponds to User.ID
    real_user = db.query(models.User).filter(models.User.ID == db_user.email).first()
    district_code = real_user.district_code if real_user else None

    # Return username and district_code as well
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "username": db_user.username,
        "district_code": district_code
    }
