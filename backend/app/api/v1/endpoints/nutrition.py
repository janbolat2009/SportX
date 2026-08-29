from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import User, AthleteProfile, NutritionRecord
from app.schemas import NutritionRecordCreate, NutritionRecordOut
from ml.nutrition.inference.nutrition_matcher import NutritionInferenceEngine

router = APIRouter()

# Global ML inference engine instance
_engine: Optional[NutritionInferenceEngine] = None

def get_engine() -> NutritionInferenceEngine:
    global _engine
    if _engine is None:
        _engine = NutritionInferenceEngine()
    return _engine


class MealEstimateRequest(BaseModel):
    query: str
    language: Optional[str] = "en"


class DetectedFoodOut(BaseModel):
    food_id: int
    food_name: str
    original_name_en: str
    category: str
    portion_grams: int
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    confidence: float
    is_estimated: bool


class MealEstimateResponse(BaseModel):
    raw_query: str
    detected_foods: List[DetectedFoodOut]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_grams: int
    model_version: str
    is_estimated: bool


@router.post("/estimate", response_model=MealEstimateResponse)
def estimate_meal_nutrition(req: MealEstimateRequest):
    """
    ML-powered multi-lingual natural language food recognition and portion calculation.
    """
    engine = get_engine()
    result = engine.predict(req.query, lang=req.language or "en")
    return result


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
