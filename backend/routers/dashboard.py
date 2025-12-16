from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

# [수정] 우리가 만든 database.py에서 get_db 가져오기
from database import get_db 
import models, schemas

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)

# [삭제됨] def get_db(): ... (이제 필요 없음)

@router.get("/analysis", response_model=List[schemas.AnalysisChartData])
def get_analysis_data(year: str, district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DistrictAnalysis).filter(models.DistrictAnalysis.year == year)
    
    if district and district != 'all':
        districts = district.split(',')
        query = query.filter(models.DistrictAnalysis.district_code.in_(districts))

    results = query.all()
    
    data = []
    for row in results:
        data.append({
            "name": row.district_code,
            "housing": row.housing_score,
            "env": row.env_score,
            "transport": row.transport_score,
            "safety": row.safety_score
        })
    return data

@router.get("/score", response_model=schemas.DashboardSummary)
def get_score(year: str, district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DistrictAnalysis).filter(models.DistrictAnalysis.year == year)
    if district and district != 'all':
        dist_list = district.split(',')
        query = query.filter(models.DistrictAnalysis.district_code.in_(dist_list))
    
    results = query.all()
    if not results:
        return {"score": 0, "grade": "N/A", "trend": "-"}
    
    # 안전 점수 평균 계산
    total_score = sum([r.safety_score for r in results])
    avg_score = total_score / len(results)
    
    grade = 'C'
    if avg_score >= 90: grade = 'S'
    elif avg_score >= 80: grade = 'A'
    elif avg_score >= 70: grade = 'B'
    
    return {
        "score": round(avg_score, 1),
        "grade": grade,
        "trend": "+2.5% vs last year"
    }

@router.get("/insights", response_model=List[schemas.Insight])
def get_insights(year: str, district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DistrictInsight).filter(models.DistrictInsight.year == year)
    if district and district != 'all':
        dist_list = district.split(',')
        query = query.filter(models.DistrictInsight.district_code.in_(dist_list))
    
    return query.all()

import json

@router.get("/personas", response_model=List[schemas.Persona])
def get_personas(year: str, district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Persona).filter(models.Persona.year == year)
    if district and district != 'all':
        dist_list = district.split(',')
        query = query.filter(models.Persona.district_code.in_(dist_list))
    
    results = query.all()
    
    parsed_results = []
    for row in results:
        # DB 모델을 딕셔너리로 변환
        row_dict = {c.name: getattr(row, c.name) for c in row.__table__.columns}
        
        # JSON 문자열로 저장된 필드들을 리스트로 복구
        list_fields = ['tags', 'pain_points', 'suggestions', 'expected_effects']
        for field in list_fields:
            val = row_dict.get(field)
            if isinstance(val, str):
                try:
                    row_dict[field] = json.loads(val)
                except:
                    row_dict[field] = []
            elif val is None:
                 row_dict[field] = []
            
        parsed_results.append(row_dict)

    return parsed_results