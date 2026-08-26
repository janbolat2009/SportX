from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import User, AthleteProfile, RecoveryRecord, SleepRecord
from app.schemas import RecoveryRecordCreate, RecoveryRecordOut
from app.services.holistic_service import compute_daily_readiness_score

router = APIRouter()


@router.post("/", response_model=RecoveryRecordOut)
def log_recovery_status(
    recovery_in: RecoveryRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        raise HTTPException(status_code=400, detail="User is not an athlete")

    # Fetch latest sleep score for calculating readiness
    latest_sleep = db.query(SleepRecord).filter(
        SleepRecord.athlete_id == athlete.id,
        SleepRecord.log_date == recovery_in.log_date
    ).first()
    sleep_score = latest_sleep.sleep_quality_score if latest_sleep else 80.0

    readiness = compute_daily_readiness_score(
        sleep_score=sleep_score,
        soreness_1_to_10=recovery_in.soreness_level,
        fatigue_1_to_10=recovery_in.fatigue_level,
        stress_1_to_10=recovery_in.stress_level
    )

    record = RecoveryRecord(
        athlete_id=athlete.id,
        log_date=recovery_in.log_date,
        soreness_level=recovery_in.soreness_level,
        fatigue_level=recovery_in.fatigue_level,
        stress_level=recovery_in.stress_level,
        calculated_readiness_score=readiness,
        training_load_estimate=recovery_in.training_load_estimate,
        notes=recovery_in.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[RecoveryRecordOut])
def get_recovery_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        return []
    records = db.query(RecoveryRecord).filter(
        RecoveryRecord.athlete_id == athlete.id
    ).order_by(RecoveryRecord.created_at.desc()).limit(30).all()
    return records
