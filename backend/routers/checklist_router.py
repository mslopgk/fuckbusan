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
from routers.user_router import get_current_user, get_current_user_optional

router = APIRouter(
    prefix="/checklist",
    tags=["checklist"]
)

S3_BUCKET = os.getenv("MY_AWS_BUCKET_NAME", os.getenv("S3_BUCKET_NAME", "busan-promotion"))
AWS_REGION = os.getenv("MY_AWS_REGION", "ap-northeast-2")
_AWS_KEY = os.getenv("MY_AWS_ACCESS_KEY")
IS_LAMBDA = bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=_AWS_KEY,
        aws_secret_access_key=os.getenv("MY_AWS_SECRET_KEY"),
    )

def _local_uploads_dir() -> str:
    base = "/tmp/uploads" if IS_LAMBDA else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
    os.makedirs(base, exist_ok=True)
    return base

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.rsplit(".", 1)[-1]
    filename = f"{uuid.uuid4()}.{file_ext}"
    contents = await file.read()

    if _AWS_KEY:
        try:
            get_s3_client().put_object(
                Bucket=S3_BUCKET,
                Key=filename,
                Body=contents,
                ContentType=file.content_type,
            )
            url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")
    else:
        save_path = os.path.join(_local_uploads_dir(), filename)
        with open(save_path, "wb") as f:
            f.write(contents)
        url = f"/uploads/{filename}"

    return {"url": url}

import traceback

@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_checklist(
    result: ChecklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    try:
        result_data = result.dict()
        if "ID" in result_data:
            del result_data["ID"]

        new_result = ChecklistResult(
            ID=current_user.ID if current_user else None,
            user_id=current_user.user_id if current_user else None,
            **result_data
        )
        db.add(new_result)
        db.commit()
        return {"message": "진단 결과 저장 성공", "result_id": new_result.result_id}
    except Exception as e:
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"저장 중 오류 발생: {str(e)}")

@router.get("/list", response_model=list[ChecklistResponse])
def get_checklist(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """로그인 사용자는 전체 목록, 비로그인은 본인 결과 없음(빈 배열)."""
    if current_user is None:
        return []
    if current_user.ID == "admin":
        results = db.query(ChecklistResult).offset(skip).limit(min(limit, 500)).all()
    else:
        results = db.query(ChecklistResult).filter(ChecklistResult.user_id == current_user.user_id).offset(skip).limit(limit).all()
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


@router.get("/summary")
def get_checklist_summary(
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """대분류별 평균 + 최저/최고/표준편차 요약. district 옵션."""
    from sqlalchemy import func, text
    q = db.query(
        ChecklistResult.대분류.label("category"),
        func.avg(ChecklistResult.점수).label("avg_score"),
        func.min(ChecklistResult.점수).label("min_score"),
        func.max(ChecklistResult.점수).label("max_score"),
        func.count(ChecklistResult.result_id).label("count"),
        func.std(ChecklistResult.점수).label("std_dev"),
    )
    if district:
        q = q.filter(ChecklistResult.district_code == district)
    rows = q.group_by(ChecklistResult.대분류).all()
    return [
        {
            "category": r.category,
            "avg_score": float(r.avg_score) if r.avg_score else 0,
            "min_score": int(r.min_score) if r.min_score is not None else 0,
            "max_score": int(r.max_score) if r.max_score is not None else 0,
            "std_dev": round(float(r.std_dev), 2) if r.std_dev else 0,
            "count": r.count,
        }
        for r in rows if r.category
    ]


@router.get("/templates")
def get_checklist_templates(
    mode: Optional[str] = "general",
    db: Session = Depends(get_db),
):
    """진단 마스터 카탈로그 (general/expert).

    DB의 ChecklistTemplate (kind='diagnosis', mode=...)에서 payload 그대로 반환.
    프론트는 기존 /assets/data/{mode}_diagnosis.json 호환 형태로 받음.
    """
    import models as M
    row = db.query(M.ChecklistTemplate).filter(
        M.ChecklistTemplate.kind == "diagnosis",
        M.ChecklistTemplate.mode == mode,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"진단 템플릿 없음: mode={mode}")
    return row.payload


@router.get("/comprehensive-survey")
def get_comprehensive_survey(db: Session = Depends(get_db)):
    """종합 진단 설문 (Survey.jsx 호환). 11개 질문 객체 리스트."""
    import models as M
    row = db.query(M.ChecklistTemplate).filter(
        M.ChecklistTemplate.kind == "survey",
        M.ChecklistTemplate.mode == "comprehensive",
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="종합 진단 설문 템플릿 없음")
    return row.payload


@router.get("/recommendations")
def get_checklist_recommendations(
    result_id: Optional[int] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """저점 항목 기반 자동 개선 제안 추천.

    1) result_id가 있으면 그 진단의 대분류·점수 우선
    2) 없으면 district의 평균 저점 카테고리 사용
    3) 같은 카테고리/지역의 최근 제안 top 5 반환
    """
    target_categories: list = []
    target_district: Optional[str] = district

    if result_id:
        r = db.query(ChecklistResult).filter(ChecklistResult.result_id == result_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="진단 결과를 찾을 수 없습니다.")
        target_district = target_district or r.district_code
        if r.대분류:
            target_categories.append(r.대분류)

    if not target_categories:
        # district 평균 저점 카테고리 2개
        from sqlalchemy import func
        q = db.query(
            ChecklistResult.대분류,
            func.avg(ChecklistResult.점수).label("avg_score"),
        )
        if target_district:
            q = q.filter(ChecklistResult.district_code == target_district)
        rows = q.group_by(ChecklistResult.대분류).all()
        rows = [(r[0], float(r[1])) for r in rows if r[0] and r[1] is not None]
        rows.sort(key=lambda x: x[1])
        target_categories = [r[0] for r in rows[:2]]

    import models as M
    proposals_q = db.query(M.NewProposal)
    if target_categories:
        proposals_q = proposals_q.filter(M.NewProposal.category.in_(target_categories))
    if target_district:
        proposals_q = proposals_q.filter(M.NewProposal.region == target_district)

    proposals = proposals_q.order_by(M.NewProposal.likes_count.desc()).limit(5).all()
    return {
        "target_district": target_district,
        "target_categories": target_categories,
        "proposals": [
            {
                "id": p.id,
                "title": p.title,
                "category": p.category,
                "region": p.region,
                "likes": p.likes_count or 0,
                "views": p.views_count or 0,
            }
            for p in proposals
        ],
    }

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