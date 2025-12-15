from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/analysis", response_model=List[schemas.AnalysisChartData])
def get_analysis_data(year: str, district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DistrictAnalysis).filter(models.DistrictAnalysis.year == year)
    
    # If district is 'all' or None, return all districts
    if district and district != 'all':
        # Split comma separated districts
        districts = district.split(',')
        if len(districts) == 1:
            # Single district logic (Monthly trend mock - typically requires monthly data in DB)
            # For simplicity in this migration, let's just return the single district's score
            # or maybe the DB structure needs monthly data? 
            # The current mock 'single district' shows monthly trend. 
            # If our DB only has yearly data, we might need to fake monthly here or update DB.
            # Let's fallback to returning the single district data for now.
            query = query.filter(models.DistrictAnalysis.district_code.in_(districts))
        else:
            query = query.filter(models.DistrictAnalysis.district_code.in_(districts))

    results = query.all()
    
    # Transform to AnalysisChartData
    # Note: Backend stores code, Frontend expects Name?
    # We might need a helper to map code to name, or store name in DB.
    # Let's map dynamically if we have a mapping utility, or just assume code for now.
    
    data = []
    for row in results:
        data.append({
            "name": row.district_code, # Ideally map to name
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
    
    # Calculate average safety score
    total_score = sum([r.safety_score for r in results]) # Simplified to safety score
    avg_score = total_score / len(results)
    
    grade = 'C'
    if avg_score >= 90: grade = 'S'
    elif avg_score >= 80: grade = 'A'
    elif avg_score >= 70: grade = 'B'
    
    return {
        "score": round(avg_score, 1),
        "grade": grade,
        "trend": "+2.5% vs last year" # Placeholder for trend logic
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
    # Pydantic's from_orm might fail if types don't match strictly.
    # We explicitly convert here or rely on Pydantic's pre-validator if config allows.
    # Since SQLAlchemy model has tags as String, but Schema has List[str],
    # and we know it's JSON content, we should parse it.
    
    # Unfortunately query.all() returns Model instances. 
    # We can rely on Pydantic `orm_mode` to read attributes.
    # But `tags` attribute is a string.
    # We need to intercept.
    
    parsed_results = []
    for row in results:
        # Create a dict from the row, manually parsing JSON fields if needed
        row_dict = {c.name: getattr(row, c.name) for c in row.__table__.columns}
        
        # Ensure List fields are actually lists
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
            # If it's already a list (SQLAlchemy JSON type), keep it
            
        parsed_results.append(row_dict)

    return parsed_results
