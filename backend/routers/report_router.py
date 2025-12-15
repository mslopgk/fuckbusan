from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas, database
from typing import List

router = APIRouter(
    prefix="/api/reports", # Using a common prefix for reports and suggestions
    tags=["reports"],
)

@router.post("/report", status_code=status.HTTP_201_CREATED)
def create_report(report: schemas.ReportCreate, db: Session = Depends(database.get_db)):
    # Create new report
    new_report = models.Report(
        type=report.type,
        location=report.location,
        title=report.title,
        content=report.content,
        files=report.files # SQLAlchemy JSON type handles list automatically if using MariaDB/modern SQLite
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "제보가 성공적으로 접수되었습니다.", "id": new_report.id}

@router.post("/suggest", status_code=status.HTTP_201_CREATED)
def create_suggestion(suggestion: schemas.SuggestionCreate, db: Session = Depends(database.get_db)):
    # Create new suggestion
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
