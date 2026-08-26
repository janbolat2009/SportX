from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import User, AthleteProfile, SleepRecord
from app.schemas import SleepRecordCreate, SleepRecordOut

router = APIRouter()


@router.post("/", response_model=SleepRecordOut)
def log_sleep(
    sleep_in: SleepRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        raise HTTPException(status_code=400, detail="User is not an athlete")

    # Consistency score
    consistency = min(100.0, max(50.0, sleep_in.sleep_quality_score + 5.0))

    record = SleepRecord(
        athlete_id=athlete.id,
        log_date=sleep_in.log_date,
        bedtime=sleep_in.bedtime,
        wake_time=sleep_in.wake_time,
        total_sleep_minutes=sleep_in.total_sleep_minutes,
        sleep_quality_score=sleep_in.sleep_quality_score,
        consistency_score=consistency,
        notes=sleep_in.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[SleepRecordOut])
def get_sleep_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = current_user.athlete_profile
    if not athlete:
        return []
    records = db.query(SleepRecord).filter(
        SleepRecord.athlete_id == athlete.id
    ).order_by(SleepRecord.created_at.desc()).limit(30).all()
    return records
