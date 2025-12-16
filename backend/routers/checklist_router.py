from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from models import ChecklistResult, User
from schemas import ChecklistCreate, ChecklistResponse
import os
import uuid
import shutil

# [★ 중요 변경] dependencies가 아니라 user_router에서 가져옵니다!
from routers.user_router import get_current_user 

router = APIRouter(
    prefix="/checklist",
    tags=["checklist"]
)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return URL (assuming backend is at / or handled via VITE_API_URL in frontend)
    # We return relative path, frontend can prepend API URL if needed, 
    # but here we mounted /uploads at root of backend.
    # Frontend logic: if starts with http, use it, else prepend backend url.
    return {"url": f"/uploads/{filename}"}

import traceback

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_checklist(result: ChecklistCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # 딕셔너리로 변환
        result_data = result.dict()
        
        # ID 중복 방지 (입력값에 ID 있으면 삭제)
        if "ID" in result_data:
            del result_data["ID"]

        # DB 저장 (로그인한 유저 ID 자동 입력)
        new_result = ChecklistResult(
            ID=current_user.ID,
            user_id=current_user.user_id,
            **result_data
        )
        
        db.add(new_result)
        db.commit()
        return {"message": "진단 결과 저장 성공"}
    except Exception as e:
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"저장 중 오류 발생: {str(e)}")

@router.get("/list", response_model=list[ChecklistResponse])
def get_checklist(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For now, return all or filter by user?
    # Usually users see their own or public ones?
    # Let's return all for inspection, or filter by user if we had a 'my' param.
    # Currently just dumping all for the list page.
    results = db.query(ChecklistResult).offset(skip).limit(limit).all()
    return results

@router.get("/my", response_model=list[ChecklistResponse])
def get_my_checklist(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve only the current user's checklists
    results = db.query(ChecklistResult).filter(ChecklistResult.user_id == current_user.user_id).order_by(ChecklistResult.created_at.desc()).offset(skip).limit(limit).all()
    return results

@router.get("/{result_id}", response_model=ChecklistResponse)
def get_checklist_detail(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(ChecklistResult).filter(ChecklistResult.result_id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="진단 결과를 찾을 수 없습니다.")
    return result

@router.put("/{result_id}", response_model=ChecklistResponse)
def update_checklist(
    result_id: int,
    checklist_update: ChecklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(ChecklistResult).filter(ChecklistResult.result_id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="진단 결과를 찾을 수 없습니다.")
    
    # Check permission (only owner can edit)
    if result.user_id != current_user.user_id:
         raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")

    # Update fields
    update_data = checklist_update.dict(exclude_unset=True)
    if "ID" in update_data: del update_data["ID"] # ID string shouldn't change or is managed
    
    for key, value in update_data.items():
        setattr(result, key, value)
    
    db.commit()
    db.refresh(result)
    return result