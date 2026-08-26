from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import User, AthleteProfile, WorkoutSession, AssignedExercise, SleepRecord, RecoveryRecord
from app.schemas import AthleteProfileOut, AthleteProfileUpdate, WorkoutSessionOut, AssignedExerciseOut
from app.services.holistic_service import get_athlete_holistic_summary

router = APIRouter()


def _ensure_athlete_profile(db: Session, user: User) -> AthleteProfile:
    if not user.athlete_profile:
        prof = AthleteProfile(
            user_id=user.id,
            sport="General Fitness",
            training_level="Intermediate",
            anonymized_subject_id=f"SUBJ_{uuid.uuid4().hex[:8].upper()}"
        )
        db.add(prof)
        db.commit()
        db.refresh(user)
    return user.athlete_profile


@router.get("/me", response_model=AthleteProfileOut)
def get_current_athlete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _ensure_athlete_profile(db, current_user)
    return {
        "id": profile.id,
        "user_id": current_user.id,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "sport": profile.sport,
        "training_level": profile.training_level,
        "fitness_goals": profile.fitness_goals,
        "anonymized_subject_id": profile.anonymized_subject_id,
        "full_name": current_user.full_name,
        "email": current_user.email
    }


@router.put("/me", response_model=AthleteProfileOut)
def update_athlete_profile(
    update_in: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _ensure_athlete_profile(db, current_user)
    for field, val in update_in.model_dump(exclude_unset=True).items():
        setattr(profile, field, val)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "user_id": current_user.id,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "sport": profile.sport,
        "training_level": profile.training_level,
        "fitness_goals": profile.fitness_goals,
        "anonymized_subject_id": profile.anonymized_subject_id,
        "full_name": current_user.full_name,
        "email": current_user.email
    }


@router.get("/me/dashboard")
def get_athlete_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = _ensure_athlete_profile(db, current_user)
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.athlete_id == profile.id
    ).order_by(WorkoutSession.created_at.desc()).all()

    total_sessions = len(sessions)
    total_reps = sum(s.total_reps for s in sessions)
    avg_score = round(sum(s.overall_score for s in sessions) / total_sessions, 1) if total_sessions > 0 else 0.0

    # Assigned exercises
    assigned = db.query(AssignedExercise).filter(
        AssignedExercise.athlete_id == profile.id,
        AssignedExercise.status == "ASSIGNED"
    ).all()

    assigned_out = [
        {
            "id": a.id,
            "exercise_id": a.exercise_id,
            "exercise_name": a.exercise.name if a.exercise else "Exercise",
            "target_sets": a.target_sets,
            "target_reps": a.target_reps,
            "target_tempo": a.target_tempo,
            "target_rom": a.target_rom,
            "notes": a.notes
        }
        for a in assigned
    ]

    # Holistic summary
    holistic = get_athlete_holistic_summary(db, profile.id)

    # Score trend
    score_trend = [
        {
            "date": s.created_at.strftime("%b %d"),
            "score": s.overall_score,
            "exercise": s.exercise.name if s.exercise else "Exercise",
            "reps": s.total_reps
        }
        for s in reversed(sessions[:10])
    ]

    return {
        "athlete_name": current_user.full_name,
        "sport": profile.sport,
        "anonymized_subject_id": profile.anonymized_subject_id,
        "stats": {
            "total_workouts": total_sessions,
            "total_reps_analyzed": total_reps,
            "average_technique_score": avg_score,
            "pending_assigned_workouts": len(assigned)
        },
        "score_trend": score_trend,
        "assigned_workouts": assigned_out,
        "holistic": holistic,
        "recent_sessions": [
            {
                "id": s.id,
                "exercise_name": s.exercise.name if s.exercise else "Exercise",
                "exercise_slug": s.exercise.slug if s.exercise else "exercise",
                "session_type": s.session_type,
                "overall_score": s.overall_score,
                "total_reps": s.total_reps,
                "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for s in sessions[:5]
        ]
    }
