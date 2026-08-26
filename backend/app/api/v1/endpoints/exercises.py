from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models import Exercise
from app.schemas import ExerciseOut
from app.ml.taxonomy import get_errors_for_exercise

router = APIRouter()


@router.get("/", response_model=List[ExerciseOut])
def get_all_exercises(db: Session = Depends(get_db)):
    exercises = db.query(Exercise).filter(Exercise.is_active == True).all()
    return exercises


@router.get("/{slug}", response_model=ExerciseOut)
def get_exercise_by_slug(slug: str, db: Session = Depends(get_db)):
    exercise = db.query(Exercise).filter(Exercise.slug == slug.lower()).first()
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exercise '{slug}' not found")
    return exercise


@router.get("/{slug}/taxonomy")
def get_exercise_taxonomy(slug: str):
    errors = get_errors_for_exercise(slug.lower())
    return {
        "exercise_slug": slug,
        "supported_errors_count": len(errors),
        "errors": errors
    }
