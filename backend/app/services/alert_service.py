from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Notification, WorkoutSession, CoachAthleteRelationship, AthleteProfile, User
from collections import Counter


def evaluate_and_generate_technique_alerts(
    db: Session,
    session: WorkoutSession
) -> List[Notification]:
    """
    Evaluates session repetitions for repetitive high-severity technique deviations.
    Dispatches alerts to the athlete and linked coaches.
    Example: 'Technique Alert: 6 of 10 Squat repetitions exhibited Knee Inward Deviation (Valgus).'
    """
    if not session.repetitions or len(session.repetitions) < 3:
        return []

    created_notifications = []
    
    # Collect detected error occurrences
    error_counts: Counter = Counter()
    for rep in session.repetitions:
        if rep.detected_errors:
            for err in rep.detected_errors:
                error_counts[err.get("error_name", "Deviation")] += 1

    total_reps = len(session.repetitions)
    
    # Alert condition: if any error occurred on >= 40% of reps
    for err_name, count in error_counts.items():
        ratio = count / total_reps
        if ratio >= 0.35:
            severity = "ALERT" if ratio >= 0.50 else "WARNING"
            ex_name = session.exercise.name if session.exercise else "Exercise"
            
            title = f"Technique {severity.capitalize()}: {ex_name}"
            message = (
                f"{count} of {total_reps} {ex_name} repetitions exhibited "
                f"'{err_name}'. Review joint alignment and form cues."
            )

            # 1. Notify Athlete
            athlete_profile = db.query(AthleteProfile).filter(AthleteProfile.id == session.athlete_id).first()
            if athlete_profile:
                notif_athlete = Notification(
                    user_id=athlete_profile.user_id,
                    title=title,
                    message=message,
                    severity=severity,
                    category="TECHNIQUE_ALERT"
                )
                db.add(notif_athlete)
                created_notifications.append(notif_athlete)

                # 2. Notify linked coaches
                relationships = db.query(CoachAthleteRelationship).filter(
                    CoachAthleteRelationship.athlete_id == athlete_profile.user_id,
                    CoachAthleteRelationship.status == "active"
                ).all()

                for rel in relationships:
                    notif_coach = Notification(
                        user_id=rel.coach_id,
                        title=f"Athlete Technique Alert: {athlete_profile.user.full_name if athlete_profile.user else 'Athlete'}",
                        message=f"{athlete_profile.user.full_name if athlete_profile.user else 'Athlete'} performed {total_reps} reps of {ex_name}: {count} reps showed '{err_name}'.",
                        severity=severity,
                        category="TECHNIQUE_ALERT"
                    )
                    db.add(notif_coach)
                    created_notifications.append(notif_coach)

    db.commit()
    return created_notifications
