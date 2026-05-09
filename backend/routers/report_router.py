from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
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
from notification_utils import push_notification, log_activity

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
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
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    contents = await file.read()

    # AWS 키 있으면 S3, 없으면 로컬 저장 (개발 환경 폴백)
    if _AWS_KEY:
        try:
            get_s3_client().put_object(
                Bucket=S3_BUCKET,
                Key=unique_filename,
                Body=contents,
                ContentType=file.content_type,
            )
            url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")
    else:
        save_path = os.path.join(_local_uploads_dir(), unique_filename)
        with open(save_path, "wb") as f:
            f.write(contents)
        url = f"/uploads/{unique_filename}"

    return {"filename": unique_filename, "url": url}

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
    page: Optional[int] = None,
    size: Optional[int] = None,
):
    """Return all reports with the full shape the frontend ReportList expects.

    page/size 미지정시 전체 array 반환 (하위호환).
    page/size 지정시 envelope {items,total,page,size} 반환.
    """
    q = db.query(models.Report)
    if region and region != "부산 전 지역":
        q = q.filter(models.Report.region == region)
    if category and category != "전체":
        q = q.filter(models.Report.category == category)
    if status and status != "전체":
        q = q.filter(models.Report.status == status)
    q = q.order_by(models.Report.created_at.desc())

    if page is not None or size is not None:
        page = max(1, page or 1)
        size = max(1, min(size or 20, 100))
        total = q.count()
        rows = q.offset((page - 1) * size).limit(size).all()
        ids = [r.id for r in rows]
        comments_by_report = {}
        if ids:
            for c in db.query(models.ReportComment).filter(models.ReportComment.report_id.in_(ids)).order_by(models.ReportComment.created_at.asc()).all():
                comments_by_report.setdefault(c.report_id, []).append(c)
        return {
            "items": [_serialize_report(r, comments_by_report.get(r.id, [])) for r in rows],
            "total": total,
            "page": page,
            "size": size,
        }

    rows = q.all()
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
def create_report(
    report: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    new_report = models.Report(
        user_id=current_user.user_id if current_user else None,
        author_name=(current_user.nickname or current_user.name) if current_user else None,
        type=report.type,
        category=report.category,
        sub_category=report.sub_category,
        location=report.location,
        region=report.region,
        detailed_address=report.detailed_address,
        lat=report.lat,
        lng=report.lng,
        image_url=report.image_url,
        title=report.title,
        content=report.content,
        files=json.dumps(report.files),
        status="개선예정",
        progress_step=1,
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "제보가 성공적으로 접수되었습니다.", "id": new_report.id}


# --- 지도 클러스터 ---
@router.get("/clusters")
def get_report_clusters(db: Session = Depends(get_db)):
    """region별 lat/lng 평균 + count 집계."""
    from sqlalchemy import func
    rows = (
        db.query(
            models.Report.region,
            func.avg(models.Report.lat).label("lat"),
            func.avg(models.Report.lng).label("lng"),
            func.count(models.Report.id).label("count"),
        )
        .filter(models.Report.lat.isnot(None), models.Report.lng.isnot(None))
        .group_by(models.Report.region)
        .all()
    )
    return [
        {"region": r.region, "lat": float(r.lat) if r.lat else None, "lng": float(r.lng) if r.lng else None, "count": r.count}
        for r in rows
    ]

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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    proposals = (
        db.query(models.NewProposal)
        .options(joinedload(models.NewProposal.creator))
        .order_by(models.NewProposal.created_at.desc())
        .all()
    )
    ids = [p.id for p in proposals]
    comment_counts = {}
    liked_ids: set = set()
    if ids:
        for pid, cnt in db.query(models.ProposalComment.proposal_id, func.count(models.ProposalComment.id)).filter(models.ProposalComment.proposal_id.in_(ids)).group_by(models.ProposalComment.proposal_id).all():
            comment_counts[pid] = cnt
        if current_user:
            for (pid,) in db.query(models.ProposalLike.proposal_id).filter(models.ProposalLike.user_id == current_user.user_id, models.ProposalLike.proposal_id.in_(ids)).all():
                liked_ids.add(pid)
    for p in proposals:
        p.nickname = (p.creator.nickname if p.creator and p.creator.nickname else (p.creator.name if p.creator else "익명"))
        p.comments_count = comment_counts.get(p.id, 0)
        p.is_mine = current_user is not None and p.user_id == current_user.user_id
        p.has_voted = p.id in liked_ids
    return proposals

# --- [추가] 나의 제안 목록 조회 API ---
@router.get("/my-proposals", response_model=List[schemas.NewProposalRead])
def get_my_proposals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    proposals = (
        db.query(models.NewProposal)
        .filter(models.NewProposal.user_id == current_user.user_id)
        .options(joinedload(models.NewProposal.creator))
        .order_by(models.NewProposal.created_at.desc())
        .all()
    )
    ids = [p.id for p in proposals]
    comment_counts = {}
    liked_ids: set = set()
    if ids:
        for pid, cnt in db.query(models.ProposalComment.proposal_id, func.count(models.ProposalComment.id)).filter(models.ProposalComment.proposal_id.in_(ids)).group_by(models.ProposalComment.proposal_id).all():
            comment_counts[pid] = cnt
        for (pid,) in db.query(models.ProposalLike.proposal_id).filter(models.ProposalLike.user_id == current_user.user_id, models.ProposalLike.proposal_id.in_(ids)).all():
            liked_ids.add(pid)
    for p in proposals:
        p.nickname = current_user.nickname or current_user.name
        p.is_mine = True
        p.comments_count = comment_counts.get(p.id, 0)
        p.has_voted = p.id in liked_ids
    return proposals

# --- [추가] 내가 투표한 제안 목록 조회 API ---
@router.get("/voted-proposals", response_model=List[schemas.NewProposalRead])
def get_voted_proposals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    voted_proposals = (
        db.query(models.NewProposal)
        .join(models.ProposalLike, models.NewProposal.id == models.ProposalLike.proposal_id)
        .options(joinedload(models.NewProposal.creator))
        .filter(models.ProposalLike.user_id == current_user.user_id)
        .order_by(models.ProposalLike.created_at.desc())
        .all()
    )
    ids = [p.id for p in voted_proposals]
    comment_counts = {}
    if ids:
        for pid, cnt in db.query(models.ProposalComment.proposal_id, func.count(models.ProposalComment.id)).filter(models.ProposalComment.proposal_id.in_(ids)).group_by(models.ProposalComment.proposal_id).all():
            comment_counts[pid] = cnt
    for p in voted_proposals:
        p.nickname = (p.creator.nickname if p.creator and p.creator.nickname else (p.creator.name if p.creator else "익명"))
        p.is_mine = p.user_id == current_user.user_id
        p.has_voted = True
        p.comments_count = comment_counts.get(p.id, 0)
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
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    proposal = (
        db.query(models.NewProposal)
        .options(joinedload(models.NewProposal.creator))
        .filter(models.NewProposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="제안을 찾을 수 없습니다.")

    proposal.nickname = (proposal.creator.nickname if proposal.creator and proposal.creator.nickname else (proposal.creator.name if proposal.creator else "익명"))
    proposal.comments_count = db.query(func.count(models.ProposalComment.id)).filter(models.ProposalComment.proposal_id == proposal_id).scalar() or 0
    proposal.is_mine = current_user is not None and proposal.user_id == current_user.user_id
    proposal.has_voted = False
    if current_user:
        proposal.has_voted = db.query(models.ProposalLike).filter(
            models.ProposalLike.proposal_id == proposal_id,
            models.ProposalLike.user_id == current_user.user_id,
        ).first() is not None
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
    if current_user.user_id >= 999990:
        raise HTTPException(status_code=403, detail="관리자는 투표할 수 없습니다.")

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
            if proposal.user_id and proposal.user_id != current_user.user_id:
                push_notification(
                    db,
                    user_id=proposal.user_id,
                    actor_id=current_user.user_id,
                    kind="vote",
                    target_type="proposal",
                    target_id=proposal.id,
                    title=f"{current_user.nickname or current_user.name}님이 제안에 투표했습니다.",
                    body=proposal.title or "",
                )
        log_activity(db, user_id=current_user.user_id, action="vote" if voted else "unvote",
                     target_type="proposal", target_id=proposal.id)
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

    safe_uid = current_user.user_id if current_user.user_id < 999990 else None
    new_comment = models.ProposalComment(
        proposal_id=proposal_id,
        user_id=safe_uid,
        content=comment.content,
        parent_comment_id=comment.parent_comment_id
    )
    db.add(new_comment)
    if proposal.user_id and proposal.user_id != current_user.user_id:
        push_notification(
            db,
            user_id=proposal.user_id,
            actor_id=current_user.user_id,
            kind="comment",
            target_type="proposal",
            target_id=proposal.id,
            title=f"{current_user.nickname or current_user.name}님이 제안에 댓글을 남겼습니다.",
            body=comment.content,
        )
    log_activity(db, user_id=current_user.user_id, action="comment", target_type="proposal", target_id=proposal.id,
                 meta={"snippet": (comment.content or "")[:80]})
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


# =============================================================================
# 제보 단건 — /{report_id} 패턴 라우트는 /proposals 라우트들보다 *뒤에* 등록.
# FastAPI는 등록 순서대로 매칭하므로 위 proposals 정적 경로를 먼저 잡아야 함.
# =============================================================================

@router.get("/{report_id}", response_model=schemas.ReportRead)
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    r.views = (r.views or 0) + 1
    db.commit()
    comments = db.query(models.ReportComment).filter(
        models.ReportComment.report_id == report_id
    ).order_by(models.ReportComment.created_at.asc()).all()
    return _serialize_report(r, comments)


@router.put("/{report_id}")
def update_report(
    report_id: int,
    payload: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    if r.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 제보만 수정할 수 있습니다.")
    for k in ("title", "content", "category", "sub_category", "region", "location", "detailed_address", "lat", "lng", "image_url"):
        v = getattr(payload, k, None)
        if v is not None:
            setattr(r, k, v)
    if payload.files is not None:
        r.files = json.dumps(payload.files)
    db.commit()
    return {"message": "수정되었습니다."}


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    if r.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 제보만 삭제할 수 있습니다.")
    db.query(models.ReportComment).filter(models.ReportComment.report_id == report_id).delete()
    db.query(models.ReportLike).filter(models.ReportLike.report_id == report_id).delete()
    db.query(models.ReportImage).filter(models.ReportImage.report_id == report_id).delete()
    db.delete(r)
    db.commit()
    return {"message": "삭제되었습니다."}


@router.post("/{report_id}/like")
def toggle_report_like(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    if current_user.user_id >= 999990:
        raise HTTPException(status_code=403, detail="관리자는 공감할 수 없습니다.")
    existing = db.query(models.ReportLike).filter(
        models.ReportLike.report_id == report_id,
        models.ReportLike.user_id == current_user.user_id,
    ).first()
    if existing:
        db.delete(existing)
        r.likes_count = max(0, (r.likes_count or 0) - 1)
        liked = False
    else:
        db.add(models.ReportLike(user_id=current_user.user_id, report_id=report_id))
        r.likes_count = (r.likes_count or 0) + 1
        liked = True
        # 알림 — 작성자에게
        if r.user_id and r.user_id != current_user.user_id:
            push_notification(
                db,
                user_id=r.user_id,
                actor_id=current_user.user_id,
                kind="like",
                target_type="report",
                target_id=r.id,
                title=f"{current_user.nickname or current_user.name}님이 제보에 공감했습니다.",
                body=r.title or "",
            )
    log_activity(db, user_id=current_user.user_id, action="like" if liked else "unlike",
                 target_type="report", target_id=r.id)
    db.commit()
    return {"likes_count": r.likes_count, "liked": liked}


@router.get("/{report_id}/comments", response_model=List[schemas.ReportCommentRead])
def list_report_comments(report_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.ReportComment).filter(
        models.ReportComment.report_id == report_id
    ).order_by(models.ReportComment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "author": c.author_name or (c.user.nickname if c.user else "익명"),
            "content": c.content,
            "date": c.created_at.strftime("%Y.%m.%d") if c.created_at else None,
        }
        for c in rows
    ]


@router.post("/{report_id}/comments", response_model=schemas.ReportCommentRead, status_code=201)
def create_report_comment(
    report_id: int,
    payload: schemas.ReportCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다.")
    safe_uid = current_user.user_id if current_user.user_id < 999990 else None
    c = models.ReportComment(
        report_id=report_id,
        user_id=safe_uid,
        author_name=current_user.nickname or current_user.name,
        content=payload.content,
    )
    db.add(c)
    r.comments_count = (r.comments_count or 0) + 1
    # 알림 — 작성자에게
    if r.user_id and r.user_id != current_user.user_id:
        push_notification(
            db,
            user_id=r.user_id,
            actor_id=current_user.user_id,
            kind="comment",
            target_type="report",
            target_id=r.id,
            title=f"{current_user.nickname or current_user.name}님이 제보에 댓글을 남겼습니다.",
            body=payload.content,
        )
    log_activity(db, user_id=current_user.user_id, action="comment", target_type="report", target_id=r.id,
                 meta={"snippet": (payload.content or "")[:80]})
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "author": c.author_name,
        "content": c.content,
        "date": c.created_at.strftime("%Y.%m.%d") if c.created_at else None,
    }


@router.put("/{report_id}/comments/{comment_id}", response_model=schemas.ReportCommentRead)
def update_report_comment(
    report_id: int,
    comment_id: int,
    payload: schemas.ReportCommentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    c = db.query(models.ReportComment).filter(
        models.ReportComment.id == comment_id,
        models.ReportComment.report_id == report_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if c.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 댓글만 수정할 수 있습니다.")
    c.content = payload.content
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "author": c.author_name,
        "content": c.content,
        "date": c.created_at.strftime("%Y.%m.%d") if c.created_at else None,
    }


@router.delete("/{report_id}/comments/{comment_id}")
def delete_report_comment(
    report_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    c = db.query(models.ReportComment).filter(
        models.ReportComment.id == comment_id,
        models.ReportComment.report_id == report_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if c.user_id != current_user.user_id and current_user.ID != "admin":
        raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")
    r = db.query(models.Report).filter(models.Report.id == report_id).first()
    if r:
        r.comments_count = max(0, (r.comments_count or 0) - 1)
    db.delete(c)
    db.commit()
    return {"message": "삭제되었습니다."}