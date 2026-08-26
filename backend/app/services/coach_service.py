from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import (
    User, CoachProfile, AthleteProfile, CoachAthleteRelationship,
    AssignedExercise, TrainingPlan, CoachComment, WorkoutSession
)


def get_coach_athletes_roster(db: Session, coach_user_id: int) -> List[Dict[str, Any]]:
    """
    Returns roster of athletes linked to a coach with recent scores, status, and alert flags.
    """
    relationships = db.query(CoachAthleteRelationship).filter(
        CoachAthleteRelationship.coach_id == coach_user_id,
        CoachAthleteRelationship.status == "active"
    ).all()

    roster = []
    for rel in relationships:
        athlete_user = db.query(User).filter(User.id == rel.athlete_id).first()
        if not athlete_user or not athlete_user.athlete_profile:
            continue
        
        profile = athlete_user.athlete_profile
        # Fetch recent sessions
        recent_sessions = db.query(WorkoutSession).filter(
            WorkoutSession.athlete_id == profile.id
        ).order_by(WorkoutSession.created_at.desc()).limit(5).all()

        latest_session = recent_sessions[0] if recent_sessions else None
        avg_score = round(sum(s.overall_score for s in recent_sessions) / len(recent_sessions), 1) if recent_sessions else 0.0

        # Pending assigned exercises
        pending_assignments = db.query(AssignedExercise).filter(
            AssignedExercise.athlete_id == profile.id,
            AssignedExercise.status == "ASSIGNED"
        ).count()

        roster.append({
            "athlete_id": profile.id,
            "user_id": athlete_user.id,
            "full_name": athlete_user.full_name,
            "email": athlete_user.email,
            "sport": profile.sport,
            "training_level": profile.training_level,
            "anonymized_subject_id": profile.anonymized_subject_id,
            "total_sessions": len(profile.sessions),
            "recent_average_score": avg_score,
            "latest_session_exercise": latest_session.exercise.name if latest_session and latest_session.exercise else "None",
            "latest_session_score": latest_session.overall_score if latest_session else None,
            "latest_session_date": latest_session.created_at.strftime("%b %d, %Y") if latest_session else "N/A",
            "pending_assignments": pending_assignments,
            "status": "Active"
        })

    return roster
