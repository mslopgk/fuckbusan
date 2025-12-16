from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# [수정] database에서 get_db 직접 import
from database import get_db 
import models, schemas

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
)

@router.post("/report", status_code=status.HTTP_201_CREATED)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    new_report = models.Report(
        type=report.type,
        location=report.location,
        title=report.title,
        content=report.content,
        files=report.files 
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
        files=suggestion.files
    )
    db.add(new_suggestion)
    db.commit()
    db.refresh(new_suggestion)
    return {"message": "제안이 성공적으로 접수되었습니다.", "id": new_suggestion.id}