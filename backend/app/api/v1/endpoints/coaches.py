from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models import (
    User, CoachProfile, AthleteProfile, CoachAthleteRelationship,
    AssignedExercise, CoachComment, Notification, Exercise, WorkoutSession
)
from app.schemas import (
    CoachProfileOut, AssignExerciseCreate, AssignedExerciseOut, CoachCommentCreate, CoachCommentOut, NotificationOut
)
from app.services.coach_service import get_coach_athletes_roster
from app.services.holistic_service import get_athlete_holistic_summary

router = APIRouter()


@router.get("/me", response_model=CoachProfileOut)
def get_current_coach_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = current_user.coach_profile
    if not profile:
        profile = CoachProfile(
            user_id=current_user.id,
            organization="Elite Performance Academy",
            specialization="Youth Biomechanics & Conditioning"
        )
        db.add(profile)
        db.commit()
        db.refresh(current_user)
        profile = current_user.coach_profile

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "organization": profile.organization,
        "specialization": profile.specialization,
        "bio": profile.bio,
        "certifications": profile.certifications,
        "full_name": current_user.full_name,
        "email": current_user.email
    }


@router.get("/roster")
def get_coach_roster(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roster = get_coach_athletes_roster(db, current_user.id)
    return roster


@router.get("/athletes/{athlete_id}")
def get_athlete_detail_for_coach(
    athlete_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    athlete = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.athlete_id == athlete.id
    ).order_by(WorkoutSession.created_at.desc()).all()

    holistic = get_athlete_holistic_summary(db, athlete.id)

    # Issue frequency distribution
    issue_counts: Dict[str, int] = {}
    for s in sessions:
        for iss in s.issues:
            issue_counts[iss.error_name] = issue_counts.get(iss.error_name, 0) + 1

    return {
        "athlete_id": athlete.id,
        "user_id": athlete.user_id,
        "full_name": athlete.user.full_name if athlete.user else "Athlete",
        "sport": athlete.sport,
        "training_level": athlete.training_level,
        "height_cm": athlete.height_cm,
        "weight_kg": athlete.weight_kg,
        "fitness_goals": athlete.fitness_goals,
        "anonymized_subject_id": athlete.anonymized_subject_id,
        "total_sessions": len(sessions),
        "issue_distribution": issue_counts,
        "holistic": holistic,
        "sessions": [
            {
                "id": s.id,
                "exercise_name": s.exercise.name if s.exercise else "Exercise",
                "exercise_slug": s.exercise.slug if s.exercise else "exercise",
                "session_type": s.session_type,
                "overall_score": s.overall_score,
                "total_reps": s.total_reps,
                "valid_reps": s.valid_reps,
                "created_at": s.created_at.strftime("%Y-%m-%d %H:%M"),
                "feedback_summary": s.feedback_summary,
                "issues_count": len(s.issues)
            }
            for s in sessions
        ]
    }


@router.post("/assign-exercise", response_model=AssignedExerciseOut)
def assign_exercise_to_athlete(
    assign_in: AssignExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    coach_profile = current_user.coach_profile
    if not coach_profile:
        coach_profile = CoachProfile(user_id=current_user.id)
        db.add(coach_profile)
        db.flush()

    assigned = AssignedExercise(
        coach_id=coach_profile.id,
        athlete_id=assign_in.athlete_id,
        exercise_id=assign_in.exercise_id,
        target_sets=assign_in.target_sets,
        target_reps=assign_in.target_reps,
        target_tempo=assign_in.target_tempo,
        target_rom=assign_in.target_rom,
        notes=assign_in.notes,
        status="ASSIGNED"
    )
    db.add(assigned)

    # Send Notification to Athlete
    athlete_prof = db.query(AthleteProfile).filter(AthleteProfile.id == assign_in.athlete_id).first()
    ex = db.query(Exercise).filter(Exercise.id == assign_in.exercise_id).first()
    if athlete_prof and ex:
        notif = Notification(
            user_id=athlete_prof.user_id,
            title=f"New Workout Assigned: {ex.name}",
            message=f"Coach {current_user.full_name} assigned {assign_in.target_sets} sets of {assign_in.target_reps} reps of {ex.name}.",
            severity="INFO",
            category="WORKOUT_ASSIGNED"
        )
        db.add(notif)

    db.commit()
    db.refresh(assigned)
    return assigned


@router.post("/comment", response_model=CoachCommentOut)
def add_coach_comment(
    comment_in: CoachCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    coach_prof = current_user.coach_profile
    if not coach_prof:
        coach_prof = CoachProfile(user_id=current_user.id)
        db.add(coach_prof)
        db.flush()

    comment = CoachComment(
        coach_id=coach_prof.id,
        session_id=comment_in.session_id,
        repetition_id=comment_in.repetition_id,
        content=comment_in.content
    )
    db.add(comment)

    # Notify athlete
    session = db.query(WorkoutSession).filter(WorkoutSession.id == comment_in.session_id).first()
    if session and session.athlete:
        notif = Notification(
            user_id=session.athlete.user_id,
            title=f"Coach Feedback: {session.exercise.name if session.exercise else 'Workout'}",
            message=f"Coach {current_user.full_name} left a comment: \"{comment_in.content[:80]}...\"",
            severity="INFO",
            category="COACH_COMMENT"
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "coach_id": coach_prof.id,
        "coach_name": current_user.full_name,
        "session_id": comment.session_id,
        "repetition_id": comment.repetition_id,
        "content": comment.content,
        "created_at": comment.created_at
    }


@router.get("/alerts", response_model=List[NotificationOut])
def get_coach_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()
    return alerts
