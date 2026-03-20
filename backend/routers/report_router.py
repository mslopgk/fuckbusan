from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import shutil
import uuid

# [수정] 필요한 의존성 import
from database import get_db 
import models, schemas
from .user_router import get_current_user, get_current_user_optional

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
)

# 업로드 디렉토리 설정 (상위 main.py와 맞춤)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 고유한 파일명 생성 (중복 방지)
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"filename": unique_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("/report", status_code=status.HTTP_201_CREATED)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    new_report = models.Report(
        type=report.type,
        location=report.location,
        title=report.title,
        content=report.content,
        files=json.dumps(report.files) # JSON 문자열로 저장
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "제보가 성공적으로 접수되었습니다.", "id": new_report.id}

@router.post("/suggest", status_code=status.HTTP_201_CREATED)
def create_suggestion(suggestion: schemas.SuggestionCreate, db: Session = Depends(get_db)):
    new_suggestion = models.Suggestion(
        location=suggestion.location,
        title=suggestion.title,
        description=suggestion.description,
        improvement_plan=suggestion.improvement_plan,
        expected_effect=suggestion.expected_effect,
        files=json.dumps(suggestion.files)
    )
    db.add(new_suggestion)
    db.commit()
    db.refresh(new_suggestion)
    return {"message": "제안이 성공적으로 접수되었습니다.", "id": new_suggestion.id}

@router.post("/new-proposal", status_code=status.HTTP_201_CREATED)
def create_new_proposal(
    proposal: schemas.NewProposalCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user) # 로그인 정보 가져오기
):
    try:
        new_proposal = models.NewProposal(
            user_id=current_user.user_id if current_user else None,
            category=proposal.category,
            title=proposal.title,
            content=proposal.content,
            region=proposal.region,
            detailed_address=proposal.detailed_address,
            files=json.dumps(proposal.files) # 리스트를 JSON 문자열로 변환하여 저장
        )
        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)
        return {"message": "새로운 제안이 성공적으로 접수되었습니다.", "id": new_proposal.id}
    except Exception as e:
        db.rollback()
        print(f"Error saving proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- [추가] 전체 제안 목록 조회 API ---
@router.get("/proposals", response_model=List[schemas.NewProposalRead])
def get_all_proposals(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    proposals = db.query(models.NewProposal).order_by(models.NewProposal.created_at.desc()).all()
    for p in proposals:
        p.nickname = p.creator.nickname if p.creator else "익명"
        if current_user:
            if p.user_id == current_user.user_id:
                p.is_mine = True
            # 투표 여부 확인
            has_liked = db.query(models.ProposalLike).filter(
                models.ProposalLike.proposal_id == p.id,
                models.ProposalLike.user_id == current_user.user_id
            ).first()
            p.has_voted = True if has_liked else False
    return proposals

# --- [추가] 나의 제안 목록 조회 API ---
@router.get("/my-proposals", response_model=List[schemas.NewProposalRead])
def get_my_proposals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposals = db.query(models.NewProposal).filter(models.NewProposal.user_id == current_user.user_id).order_by(models.NewProposal.created_at.desc()).all()
    for p in proposals:
        p.nickname = current_user.nickname
        p.is_mine = True
        # 내가 쓴 글이라도 투표 여부는 조회 (보통 본인 글 투표 안되게 프론트에서 막지만)
        has_liked = db.query(models.ProposalLike).filter(
            models.ProposalLike.proposal_id == p.id,
            models.ProposalLike.user_id == current_user.user_id
        ).first()
        p.has_voted = True if has_liked else False
    return proposals

# --- [추가] 내가 투표한 제안 목록 조회 API ---
@router.get("/voted-proposals", response_model=List[schemas.NewProposalRead])
def get_voted_proposals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # ProposalLike 테이블을 조인하여 내가 투표한 글들만 가져옴
    voted_proposals = db.query(models.NewProposal)\
        .join(models.ProposalLike, models.NewProposal.id == models.ProposalLike.proposal_id)\
        .filter(models.ProposalLike.user_id == current_user.user_id)\
        .order_by(models.ProposalLike.created_at.desc()).all()
    
    for p in voted_proposals:
        p.nickname = p.creator.nickname if p.creator else "익명"
        p.is_mine = (p.user_id == current_user.user_id)
        p.has_voted = True
        
    return voted_proposals

# --- [추가] 제안 조회수 증가 API (본인 글 제외, 중복 방지) ---
@router.post("/proposals/{proposal_id}/view")
def increment_proposal_view(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")

    # 로그인 사용자만 조회수 처리 (비로그인은 무시)
    if not current_user:
        return {"views_count": proposal.views_count or 0, "counted": False}

    # 본인 글이면 조회수 증가 안 함
    if proposal.user_id == current_user.user_id:
        return {"views_count": proposal.views_count or 0, "counted": False}

    # 이미 본 글인지 확인
    existing_view = db.query(models.ProposalView).filter(
        models.ProposalView.proposal_id == proposal_id,
        models.ProposalView.user_id == current_user.user_id
    ).first()

    if existing_view:
        # 이미 조회한 적 있음 → 카운트 증가 안 함
        return {"views_count": proposal.views_count or 0, "counted": False}

    try:
        # 조회 기록 저장
        new_view = models.ProposalView(
            user_id=current_user.user_id,
            proposal_id=proposal_id
        )
        db.add(new_view)
        proposal.views_count = (proposal.views_count or 0) + 1
        db.commit()
        return {"views_count": proposal.views_count, "counted": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- [추가] 제안 상세 조회 API ---
@router.get("/proposals/{proposal_id}", response_model=schemas.NewProposalRead)
def get_proposal_detail(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")
    
    proposal.nickname = proposal.creator.nickname if proposal.creator else "익명"
    if current_user:
        if proposal.user_id == current_user.user_id:
            proposal.is_mine = True
        # 투표 여부 확인
        has_liked = db.query(models.ProposalLike).filter(
            models.ProposalLike.proposal_id == proposal.id,
            models.ProposalLike.user_id == current_user.user_id
        ).first()
        proposal.has_voted = True if has_liked else False
        
    return proposal

# --- [추가] 제안 투표(좋아요) 토글 API ---
@router.post("/proposals/{proposal_id}/vote")
def toggle_proposal_vote(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")
    
    # 본인 글 투표 방지 (선택 사항)
    # if proposal.user_id == current_user.user_id:
    #     raise HTTPException(status_code=400, detail="본인의 제안에는 투표할 수 없습니다.")
    
    # 이미 투표했는지 확인
    existing_like = db.query(models.ProposalLike).filter(
        models.ProposalLike.proposal_id == proposal_id,
        models.ProposalLike.user_id == current_user.user_id
    ).first()
    
    try:
        if existing_like:
            # 투표 취소
            db.delete(existing_like)
            proposal.likes_count = max(0, (proposal.likes_count or 0) - 1)
            message = "투표가 취소되었습니다."
            voted = False
        else:
            # 투표 수행
            new_like = models.ProposalLike(
                user_id=current_user.user_id,
                proposal_id=proposal_id
            )
            db.add(new_like)
            proposal.likes_count = (proposal.likes_count or 0) + 1
            message = "투표가 완료되었습니다."
            voted = True
        
        db.commit()
        return {
            "message": message,
            "likes_count": proposal.likes_count,
            "has_voted": voted
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- [추가] 제안 수정 API ---
@router.put("/proposals/{proposal_id}")
def update_proposal(
    proposal_id: int,
    proposal_data: schemas.NewProposalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")
    
    if proposal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="본인의 제안만 수정할 수 있습니다.")
    
    try:
        proposal.category = proposal_data.category
        proposal.title = proposal_data.title
        proposal.content = proposal_data.content
        proposal.region = proposal_data.region
        proposal.detailed_address = proposal_data.detailed_address
        proposal.files = json.dumps(proposal_data.files)
        
        db.commit()
        return {"message": "제안이 성공적으로 수정되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- [추가] 제안 삭제 API ---
@router.delete("/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")
    
    if proposal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="본인의 제안만 삭제할 수 있습니다.")
    
    try:
        db.delete(proposal)
        db.commit()
        return {"message": "제안이 성공적으로 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))