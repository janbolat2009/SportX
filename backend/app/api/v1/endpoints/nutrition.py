from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import User, AthleteProfile, NutritionRecord
from app.schemas import NutritionRecordCreate, NutritionRecordOut

router = APIRouter()


@router.post("/", response_model=NutritionRecordOut)
def log_nutrition_meal(
    nutrition_in: NutritionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        raise HTTPException(status_code=400, detail="User is not an athlete")

    record = NutritionRecord(
        athlete_id=athlete.id,
        log_date=nutrition_in.log_date,
        meal_type=nutrition_in.meal_type.upper(),
        meal_description=nutrition_in.meal_description,
        calories=nutrition_in.calories,
        protein_g=nutrition_in.protein_g,
        carbs_g=nutrition_in.carbs_g,
        fats_g=nutrition_in.fats_g,
        water_ml=nutrition_in.water_ml,
        notes=nutrition_in.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[NutritionRecordOut])
def get_nutrition_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        return []
    records = db.query(NutritionRecord).filter(
        NutritionRecord.athlete_id == athlete.id
    ).order_by(NutritionRecord.created_at.desc()).limit(30).all()
    return records
