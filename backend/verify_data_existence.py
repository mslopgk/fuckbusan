from sqlalchemy.orm import Session
from database import SessionLocal
import models
from sqlalchemy import func

def verify():
    db = SessionLocal()
    try:
        print("=== Database Content Verification ===")
        
        # Check counts by Year
        years = ['2024', '2025', '2026']
        for year in years:
            p_count = db.query(models.Persona).filter(models.Persona.year == year).count()
            i_count = db.query(models.DistrictInsight).filter(models.DistrictInsight.year == year).count()
            a_count = db.query(models.DistrictAnalysis).filter(models.DistrictAnalysis.year == year).count()
            
            print(f"Year {year}: Personas={p_count}, Insights={i_count}, Analysis={a_count}")
            
        print("\n=== Sample Data Check ===")
        sample_persona = db.query(models.Persona).first()
        if sample_persona:
            print(f"Sample Persona: {sample_persona.name}, Year: {sample_persona.year}, District: {sample_persona.district_code}")
        else:
            print("No Personas found!")

        sample_insight = db.query(models.DistrictInsight).first()
        if sample_insight:
            print(f"Sample Insight: {sample_insight.title}, Year: {sample_insight.year}, Lat: {sample_insight.latitude}")
        else:
            print("No Insights found!")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
