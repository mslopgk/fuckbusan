from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
import boto3
from botocore.exceptions import ClientError

# [수정] 필요한 의존성 import
from database import get_db
import models, schemas
from .user_router import get_current_user, get_current_user_optional

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
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
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        contents = await file.read()

        get_s3_client().put_object(
            Bucket=S3_BUCKET,
            Key=unique_filename,
            Body=contents,
            ContentType=file.content_type
        )

        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        return {"filename": unique_filename, "url": url}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")

@router.get("/list")
def list_reports(db: Session = Depends(get_db)):
    rows = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "type": r.type,
            "location": r.location,
            "content": r.content,
            "author_id": getattr(r, "author_id", None),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


def _serialize_report(r, comments=None):
    """Convert Report ORM row to the shape the frontend expects."""
    return {
        "id": r.id,
        "user_id": r.user_id,
        "author": r.author_name,
        "category": r.category,
        "sub_category": r.sub_category,
        "title": r.title,
        "content": r.content,
        "region": r.region,
        "location": r.location,
        "detailed_address": r.detailed_address,
        "lat": float(r.lat) if r.lat is not None else None,
        "lng": float(r.lng) if r.lng is not None else None,
        "image": r.image_url,
        "status": r.status,
        "progress_step": r.progress_step,
        "views": r.views or 0,
        "likes": r.likes_count or 0,
        "comments": r.comments_count or 0,
        "date": r.created_at.strftime("%Y.%m.%d") if r.created_at else None,
        "result_details": r.result_details,
        "comments_list": [
            {
                "id": c.id,
                "author": c.author_name or (c.user.nickname if c.user else "익명"),
                "content": c.content,
                "date": c.created_at.strftime("%Y.%m.%d") if c.created_at else None,
            }
            for c in (comments or [])
        ],
    }


@router.get("/full")
def list_reports_full(
    db: Session = Depends(get_db),
    region: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
):
    """Return all reports with the full shape the frontend ReportList expects."""
    q = db.query(models.Report)
    if region and region != "부산 전 지역":
        q = q.filter(models.Report.region == region)
    if category and category != "전체":
        q = q.filter(models.Report.category == category)
    if status and status != "전체":
        q = q.filter(models.Report.status == status)
    rows = q.order_by(models.Report.created_at.desc()).all()

    # Batch-fetch comments per report
    ids = [r.id for r in rows]
    comments_by_report = {}
    if ids:
        all_comments = db.query(models.ReportComment).filter(
            models.ReportComment.report_id.in_(ids)
        ).order_by(models.ReportComment.created_at.asc()).all()
        for c in all_comments:
            comments_by_report.setdefault(c.report_id, []).append(c)

    return [_serialize_report(r, comments_by_report.get(r.id, [])) for r in rows]


@router.get("/mine")
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Reports authored by the current user."""
    rows = db.query(models.Report).filter(models.Report.user_id == current_user.user_id).order_by(models.Report.created_at.desc()).all()
    ids = [r.id for r in rows]
    comments_by_report = {}
    if ids:
        all_comments = db.query(models.ReportComment).filter(models.ReportComment.report_id.in_(ids)).all()
        for c in all_comments:
            comments_by_report.setdefault(c.report_id, []).append(c)
    return [_serialize_report(r, comments_by_report.get(r.id, [])) for r in rows]


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
        p.comments_count = db.query(models.ProposalComment).filter(models.ProposalComment.proposal_id == p.id).count()
        if current_user:
            if p.user_id == current_user.user_id:
                p.is_mine = True
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
        p.comments_count = db.query(models.ProposalComment).filter(models.ProposalComment.proposal_id == p.id).count()
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
    
    if proposal.user_id != current_user.user_id and current_user.ID != "admin":
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
    
    if proposal.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 제안만 삭제할 수 있습니다.")
    
    try:
        db.query(models.ProposalComment).filter(models.ProposalComment.proposal_id == proposal_id).delete()
        db.query(models.ProposalLike).filter(models.ProposalLike.proposal_id == proposal_id).delete()
        db.query(models.ProposalView).filter(models.ProposalView.proposal_id == proposal_id).delete()
        db.delete(proposal)
        db.commit()
        return {"message": "제안이 성공적으로 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proposals/{proposal_id}/comments", response_model=schemas.ProposalCommentRead)
def create_comment(
    proposal_id: int,
    comment: schemas.ProposalCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposal = db.query(models.NewProposal).filter(models.NewProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    new_comment = models.ProposalComment(
        proposal_id=proposal_id,
        user_id=current_user.user_id,
        content=comment.content,
        parent_comment_id=comment.parent_comment_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return schemas.ProposalCommentRead(
        id=new_comment.id,
        content=new_comment.content,
        parent_comment_id=new_comment.parent_comment_id,
        user_id=current_user.ID,
        nickname=current_user.nickname or current_user.name,
        created_at=new_comment.created_at,
        replies=[]
    )

@router.get("/proposals/{proposal_id}/comments", response_model=List[schemas.ProposalCommentRead])
def get_comments(
    proposal_id: int,
    db: Session = Depends(get_db)
):
    comments = db.query(models.ProposalComment).filter(
        models.ProposalComment.proposal_id == proposal_id
    ).order_by(models.ProposalComment.created_at.asc()).all()

    comment_dict = {}
    top_level_comments = []

    for c in comments:
        c_read = schemas.ProposalCommentRead(
            id=c.id,
            content=c.content,
            parent_comment_id=c.parent_comment_id,
            user_id=c.user.ID if c.user else "unknown",
            nickname=(c.user.nickname if c.user and c.user.nickname else (c.user.name if c.user else "익명")),
            created_at=c.created_at,
            replies=[]
        )
        comment_dict[c.id] = c_read

    for c_id, c_read in comment_dict.items():
        if c_read.parent_comment_id and c_read.parent_comment_id in comment_dict:
            comment_dict[c_read.parent_comment_id].replies.append(c_read)
        else:
            top_level_comments.append(c_read)

    return top_level_comments

@router.delete("/proposals/{proposal_id}/comments/{comment_id}")
def delete_comment(
    proposal_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.ProposalComment).filter(
        models.ProposalComment.id == comment_id,
        models.ProposalComment.proposal_id == proposal_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")

    db.query(models.ProposalComment).filter(models.ProposalComment.parent_comment_id == comment_id).delete()
    db.delete(comment)
    db.commit()
    return {"message": "댓글이 삭제되었습니다."}

@router.put("/proposals/{proposal_id}/comments/{comment_id}", response_model=schemas.ProposalCommentRead)
def update_comment(
    proposal_id: int,
    comment_id: int,
    comment_data: schemas.ProposalCommentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.ProposalComment).filter(
        models.ProposalComment.id == comment_id,
        models.ProposalComment.proposal_id == proposal_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 댓글만 수정할 수 있습니다.")

    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)

    return schemas.ProposalCommentRead(
        id=comment.id,
        content=comment.content,
        parent_comment_id=comment.parent_comment_id,
        user_id=comment.user.ID if comment.user else "unknown",
        nickname=(comment.user.nickname if comment.user and comment.user.nickname else (comment.user.name if comment.user else "익명")),
        created_at=comment.created_at,
        replies=[]
    )