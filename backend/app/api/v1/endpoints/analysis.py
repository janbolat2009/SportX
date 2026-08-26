import os
import shutil
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user
from app.models import (
    User, AthleteProfile, Exercise, WorkoutSession, Repetition, TechniqueIssue, PoseFrame
)
from app.schemas import (
    LiveAnalysisFrameIn, LiveFeedbackOut, WorkoutSessionCreate, WorkoutSessionOut
)
from app.ml.exercises import get_exercise_analyzer, BaseExerciseAnalyzer
from app.services.video_analyzer import process_video_file
from app.services.alert_service import evaluate_and_generate_technique_alerts

router = APIRouter()

# Active in-memory state machines for real-time live frame streaming sessions
LIVE_SESSION_STATE_MACHINES: Dict[str, BaseExerciseAnalyzer] = {}


@router.post("/live-frame", response_model=LiveFeedbackOut)
def analyze_live_frame(
    frame_in: LiveAnalysisFrameIn,
    current_user: User = Depends(get_current_user)
):
    """
    Processes a single frame's pose landmarks from real-time webcam stream.
    Updates deterministic exercise state machine and returns instantaneous biomechanical feedback.
    """
    state_key = frame_in.session_state_id or f"{current_user.id}_{frame_in.exercise_slug}"
    
    if state_key not in LIVE_SESSION_STATE_MACHINES:
        analyzer = get_exercise_analyzer(frame_in.exercise_slug)
        LIVE_SESSION_STATE_MACHINES[state_key] = analyzer
    else:
        analyzer = LIVE_SESSION_STATE_MACHINES[state_key]

    raw_lms = [{"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility} for lm in frame_in.landmarks]
    
    result = analyzer.process_frame(
        frame_index=frame_in.frame_index,
        timestamp=frame_in.timestamp,
        raw_landmarks=raw_lms
    )
    return result


@router.post("/finalize-session", response_model=WorkoutSessionOut)
def finalize_live_session(
    session_data: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finalizes and stores a live camera workout session in the database.
    """
    athlete = current_user.athlete_profile
    if not athlete:
        # Create athlete profile if user registered with a different role or lacks profile
        athlete = AthleteProfile(
            user_id=current_user.id,
            sport="General Fitness",
            training_level="Intermediate",
            anonymized_subject_id=f"SUBJ_{uuid.uuid4().hex[:8].upper()}"
        )
        db.add(athlete)
        db.flush()

    exercise = db.query(Exercise).filter(Exercise.slug == session_data.exercise_slug.lower()).first()
    if not exercise:
        raise HTTPException(status_code=404, detail=f"Exercise '{session_data.exercise_slug}' not found")

    session = WorkoutSession(
        athlete_id=athlete.id,
        exercise_id=exercise.id,
        session_type=session_data.session_type,
        duration_seconds=session_data.duration_seconds,
        total_reps=session_data.total_reps,
        valid_reps=session_data.valid_reps,
        overall_score=session_data.overall_score,
        alignment_score=session_data.alignment_score,
        rom_score=session_data.rom_score,
        symmetry_score=session_data.symmetry_score,
        tempo_score=session_data.tempo_score,
        stability_score=session_data.stability_score,
        feedback_summary=session_data.feedback_summary
    )
    db.add(session)
    db.flush()

    # Save Repetitions
    for rep in session_data.repetitions:
        db_rep = Repetition(
            session_id=session.id,
            rep_number=rep.get("rep_number", 1),
            start_time=rep.get("start_time", 0.0),
            end_time=rep.get("end_time", 0.0),
            duration_seconds=rep.get("duration_seconds", 0.0),
            rep_score=rep.get("rep_score", 0.0),
            alignment_score=rep.get("alignment_score", 0.0),
            rom_score=rep.get("rom_score", 0.0),
            symmetry_score=rep.get("symmetry_score", 0.0),
            tempo_score=rep.get("tempo_score", 0.0),
            stability_score=rep.get("stability_score", 0.0),
            peak_angle=rep.get("peak_angle", 0.0),
            min_angle=rep.get("min_angle", 0.0),
            is_valid=rep.get("is_valid", True),
            phase_durations=rep.get("phase_durations", {}),
            detected_errors=rep.get("detected_errors", [])
        )
        db.add(db_rep)

    # Save Issues
    for iss in session_data.issues:
        db_iss = TechniqueIssue(
            session_id=session.id,
            error_code=iss.get("error_code", "UNKNOWN"),
            error_name=iss.get("error_name", "Technique Deviation"),
            severity=iss.get("severity", "moderate"),
            confidence=iss.get("confidence", 0.9),
            description=iss.get("description", ""),
            corrective_instruction=iss.get("corrective_instruction", ""),
            timestamp=iss.get("timestamp", 0.0)
        )
        db.add(db_iss)

    db.commit()
    db.refresh(session)

    # Trigger alerts if repetitive severe issues detected
    evaluate_and_generate_technique_alerts(db, session)

    # Clear active state machine
    state_key = f"{current_user.id}_{session_data.exercise_slug}"
    if state_key in LIVE_SESSION_STATE_MACHINES:
        del LIVE_SESSION_STATE_MACHINES[state_key]

    return session


@router.post("/video")
async def analyze_uploaded_video(
    file: UploadFile = File(...),
    exercise_slug: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts an uploaded video file, processes it frame-by-frame through MediaPipe Pose and
    biomechanical state machines, and stores the resulting session.
    """
    athlete = current_user.athlete_profile
    if not athlete:
        athlete = AthleteProfile(
            user_id=current_user.id,
            sport="General Fitness",
            training_level="Intermediate",
            anonymized_subject_id=f"SUBJ_{uuid.uuid4().hex[:8].upper()}"
        )
        db.add(athlete)
        db.flush()

    exercise = db.query(Exercise).filter(Exercise.slug == exercise_slug.lower()).first()
    if not exercise:
        raise HTTPException(status_code=404, detail=f"Exercise '{exercise_slug}' not found")

    file_ext = os.path.splitext(file.filename)[1] or ".mp4"
    saved_filename = f"video_{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        report = process_video_file(saved_path, exercise_slug.lower())
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

    session = WorkoutSession(
        athlete_id=athlete.id,
        exercise_id=exercise.id,
        session_type="VIDEO_UPLOAD",
        video_url=saved_path,
        duration_seconds=report["video_duration_seconds"],
        total_reps=report["total_reps"],
        valid_reps=report["valid_reps"],
        overall_score=report["overall_score"],
        alignment_score=report["alignment_score"],
        rom_score=report["rom_score"],
        symmetry_score=report["symmetry_score"],
        tempo_score=report["tempo_score"],
        stability_score=report["stability_score"],
        feedback_summary=report["feedback_summary"]
    )
    db.add(session)
    db.flush()

    for rep in report["repetitions"]:
        db_rep = Repetition(
            session_id=session.id,
            rep_number=rep.get("rep_number", 1),
            start_time=rep.get("start_time", 0.0),
            end_time=rep.get("end_time", 0.0),
            duration_seconds=rep.get("duration_seconds", 0.0),
            rep_score=rep.get("rep_score", 0.0),
            alignment_score=rep.get("alignment_score", 0.0),
            rom_score=rep.get("rom_score", 0.0),
            symmetry_score=rep.get("symmetry_score", 0.0),
            tempo_score=rep.get("tempo_score", 0.0),
            stability_score=rep.get("stability_score", 0.0),
            peak_angle=rep.get("peak_angle", 0.0),
            min_angle=rep.get("min_angle", 0.0),
            is_valid=rep.get("is_valid", True),
            phase_durations=rep.get("phase_durations", {}),
            detected_errors=rep.get("detected_errors", [])
        )
        db.add(db_rep)

    for iss in report["issues"]:
        db_iss = TechniqueIssue(
            session_id=session.id,
            error_code=iss.get("error_code", "UNKNOWN"),
            error_name=iss.get("error_name", "Deviation"),
            severity=iss.get("severity", "moderate"),
            confidence=iss.get("confidence", 0.9),
            description=iss.get("description", ""),
            corrective_instruction=iss.get("corrective_instruction", ""),
            timestamp=iss.get("timestamp", 0.0)
        )
        db.add(db_iss)

    db.commit()
    db.refresh(session)

    evaluate_and_generate_technique_alerts(db, session)

    return {
        "session_id": session.id,
        "report": report
    }


@router.get("/sessions/{session_id}", response_model=WorkoutSessionOut)
def get_workout_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Enrich with exercise details
    session_out = {
        "id": session.id,
        "athlete_id": session.athlete_id,
        "exercise_id": session.exercise_id,
        "exercise_name": session.exercise.name if session.exercise else None,
        "exercise_slug": session.exercise.slug if session.exercise else None,
        "session_type": session.session_type,
        "video_url": session.video_url,
        "duration_seconds": session.duration_seconds,
        "total_reps": session.total_reps,
        "valid_reps": session.valid_reps,
        "overall_score": session.overall_score,
        "alignment_score": session.alignment_score,
        "rom_score": session.rom_score,
        "symmetry_score": session.symmetry_score,
        "tempo_score": session.tempo_score,
        "stability_score": session.stability_score,
        "model_version": session.model_version,
        "feature_version": session.feature_version,
        "scoring_version": session.scoring_version,
        "feedback_summary": session.feedback_summary,
        "created_at": session.created_at,
        "repetitions": session.repetitions,
        "issues": session.issues
    }
    return session_out
