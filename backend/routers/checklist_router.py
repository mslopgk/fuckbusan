from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from models import ChecklistResult, User
from schemas import ChecklistCreate, ChecklistResponse
import os
import uuid
import boto3
from botocore.exceptions import ClientError

# [★ 중요 변경] dependencies가 아니라 user_router에서 가져옵니다!
from routers.user_router import get_current_user

router = APIRouter(
    prefix="/checklist",
    tags=["checklist"]
)

S3_BUCKET = os.getenv("MY_AWS_BUCKET_NAME", os.getenv("S3_BUCKET_NAME", "busan-promotion"))
AWS_REGION = os.getenv("MY_AWS_REGION", "ap-northeast-2")

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("MY_AWS_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("MY_AWS_SECRET_KEY"),
    )

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"

    try:
        contents = await file.read()
        get_s3_client().put_object(
            Bucket=S3_BUCKET,
            Key=filename,
            Body=contents,
            ContentType=file.content_type
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")

    url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
    return {"url": url}

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
    db: Session = Depends(get_db)
):
    # For now, return all or filter by user?
    # Usually users see their own or public ones?
    # Let's return all for inspection, or filter by user if we had a 'my' param.
    # Currently just dumping all for the list page.
    results = db.query(ChecklistResult).offset(skip).limit(limit).all()
    return results


@router.get("/clusters")
def get_checklist_clusters(db: Session = Depends(get_db)):
    """진단 위치 클러스터 — district_code별 평균 좌표 + 카운트."""
    from sqlalchemy import func
    rows = (
        db.query(
            ChecklistResult.district_code,
            func.avg(ChecklistResult.위도).label("lat"),
            func.avg(ChecklistResult.경도).label("lng"),
            func.count(ChecklistResult.result_id).label("count"),
            func.avg(ChecklistResult.점수).label("avg_score"),
        )
        .filter(ChecklistResult.위도.isnot(None), ChecklistResult.경도.isnot(None))
        .group_by(ChecklistResult.district_code)
        .all()
    )
    return [
        {
            "district": r.district_code,
            "lat": float(r.lat) if r.lat else None,
            "lng": float(r.lng) if r.lng else None,
            "count": r.count,
            "avg_score": float(r.avg_score) if r.avg_score else None,
        }
        for r in rows
    ]


@router.get("/aggregate")
def get_checklist_aggregate(
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """대분류별 평균 점수 집계 — 레이더/도넛 차트용."""
    from sqlalchemy import func
    q = db.query(
        ChecklistResult.대분류.label("category"),
        func.avg(ChecklistResult.점수).label("avg_score"),
        func.count(ChecklistResult.result_id).label("count"),
    )
    if district:
        q = q.filter(ChecklistResult.district_code == district)
    rows = q.group_by(ChecklistResult.대분류).all()
    return [
        {"category": r.category, "avg_score": float(r.avg_score) if r.avg_score else 0, "count": r.count}
        for r in rows if r.category
    ]

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