# backend/router/checklist_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ChecklistResult, User
from schemas import ChecklistCreate
from dependencies import get_current_user # 보안요원 호출!

router = APIRouter(
    prefix="/checklist",
    tags=["Checklist (진단)"],
)

# [진단 결과 저장 API]
# current_user: User = Depends(get_current_user) -> 이게 바로 "로그인한 사람만 통과시키는" 검문소입니다.
@router.post("/submit")
def submit_checklist(result: ChecklistCreate, 
                     current_user: User = Depends(get_current_user), 
                     db: Session = Depends(get_db)):
    
    # 프론트에서 받은 데이터(result)를 DB 모델로 변환
    # **result.dict()는 데이터를 딕셔너리로 쫙 풀어주는 마법입니다.
    new_result = ChecklistResult(
        ID=current_user.ID, # 로그인한 사람 ID 자동 입력!
        **result.dict() 
    )
    
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    
    return {"message": "진단 결과가 저장되었습니다!", "result_id": new_result.result_id}

# [내 진단 내역 조회 API]
@router.get("/me")
def read_my_checklist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 내 아이디(current_user.id)로 된 것만 찾아옵니다.
    results = db.query(ChecklistResult).filter(ChecklistResult.ID == current_user.ID).all()
    return results