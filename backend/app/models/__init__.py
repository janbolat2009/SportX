from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ATHLETE = "athlete"
    COACH = "coach"
    RESEARCHER = "researcher"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.ATHLETE.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    athlete_profile = relationship("AthleteProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coach_profile = relationship("CoachProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    sport = Column(String(100), default="General Fitness")
    training_level = Column(String(50), default="Intermediate")
    fitness_goals = Column(Text, nullable=True)
    anonymized_subject_id = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="athlete_profile")
    sessions = relationship("WorkoutSession", back_populates="athlete", cascade="all, delete-orphan")
    sleep_records = relationship("SleepRecord", back_populates="athlete", cascade="all, delete-orphan")
    nutrition_records = relationship("NutritionRecord", back_populates="athlete", cascade="all, delete-orphan")
    recovery_records = relationship("RecoveryRecord", back_populates="athlete", cascade="all, delete-orphan")
    assigned_exercises = relationship("AssignedExercise", back_populates="athlete", cascade="all, delete-orphan")


class CoachProfile(Base):
    __tablename__ = "coach_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    organization = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    user = relationship("User", back_populates="coach_profile")
    training_plans = relationship("TrainingPlan", back_populates="coach", cascade="all, delete-orphan")
    comments = relationship("CoachComment", back_populates="coach", cascade="all, delete-orphan")


class CoachAthleteRelationship(Base):
    __tablename__ = "coach_athlete_relationships"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active")  # active, pending, archived
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    target_muscles = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    default_camera_angle = Column(String(100), default="side")
    camera_setup_instructions = Column(Text, nullable=False)
    ideal_rom_degrees = Column(Float, default=90.0)
    normative_cadence_seconds = Column(Float, default=3.0)
    is_active = Column(Boolean, default=True)

    sessions = relationship("WorkoutSession", back_populates="exercise")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    session_type = Column(String(50), default="LIVE_CAMERA")  # LIVE_CAMERA, VIDEO_UPLOAD
    video_url = Column(String(500), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    total_reps = Column(Integer, default=0)
    valid_reps = Column(Integer, default=0)
    overall_score = Column(Float, default=0.0)
    alignment_score = Column(Float, default=0.0)
    rom_score = Column(Float, default=0.0)
    symmetry_score = Column(Float, default=0.0)
    tempo_score = Column(Float, default=0.0)
    stability_score = Column(Float, default=0.0)
    model_version = Column(String(100), default="sportx-biomech-v1.0")
    feature_version = Column(String(100), default="pose-kinematics-v1.0")
    scoring_version = Column(String(100), default="biomech-scoring-v1.0")
    feedback_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    athlete = relationship("AthleteProfile", back_populates="sessions")
    exercise = relationship("Exercise", back_populates="sessions")
    repetitions = relationship("Repetition", back_populates="session", cascade="all, delete-orphan")
    issues = relationship("TechniqueIssue", back_populates="session", cascade="all, delete-orphan")
    comments = relationship("CoachComment", back_populates="session", cascade="all, delete-orphan")
    human_evaluations = relationship("HumanEvaluation", back_populates="session", cascade="all, delete-orphan")


class Repetition(Base):
    __tablename__ = "repetitions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    rep_number = Column(Integer, nullable=False)
    start_time = Column(Float, default=0.0)
    end_time = Column(Float, default=0.0)
    duration_seconds = Column(Float, default=0.0)
    rep_score = Column(Float, default=0.0)
    alignment_score = Column(Float, default=0.0)
    rom_score = Column(Float, default=0.0)
    symmetry_score = Column(Float, default=0.0)
    tempo_score = Column(Float, default=0.0)
    stability_score = Column(Float, default=0.0)
    peak_angle = Column(Float, default=0.0)
    min_angle = Column(Float, default=0.0)
    is_valid = Column(Boolean, default=True)
    phase_durations = Column(JSON, nullable=True)  # {"eccentric": 1.5, "isometric": 0.3, "concentric": 1.2}
    detected_errors = Column(JSON, nullable=True)  # list of error dicts
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship("WorkoutSession", back_populates="repetitions")
    pose_frames = relationship("PoseFrame", back_populates="repetition", cascade="all, delete-orphan")


class PoseFrame(Base):
    __tablename__ = "pose_frames"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    repetition_id = Column(Integer, ForeignKey("repetitions.id"), nullable=True)
    frame_index = Column(Integer, nullable=False)
    timestamp = Column(Float, default=0.0)
    landmarks_json = Column(JSON, nullable=False)  # Normalized 33 keypoints
    joint_angles_json = Column(JSON, nullable=False)  # knee, hip, elbow, torso etc.
    phase = Column(String(50), default="IDLE")
    instantaneous_score = Column(Float, default=100.0)

    repetition = relationship("Repetition", back_populates="pose_frames")


class TechniqueIssue(Base):
    __tablename__ = "technique_issues"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    repetition_id = Column(Integer, ForeignKey("repetitions.id"), nullable=True)
    error_code = Column(String(100), nullable=False)
    error_name = Column(String(255), nullable=False)
    severity = Column(String(50), default="moderate")  # mild, moderate, severe
    confidence = Column(Float, default=0.9)
    description = Column(Text, nullable=False)
    corrective_instruction = Column(Text, nullable=False)
    timestamp = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship("WorkoutSession", back_populates="issues")


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False)
    log_date = Column(String(50), nullable=False)
    bedtime = Column(String(50), nullable=True)
    wake_time = Column(String(50), nullable=True)
    total_sleep_minutes = Column(Integer, default=480)
    sleep_quality_score = Column(Float, default=80.0)  # 1 - 100
    consistency_score = Column(Float, default=85.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    athlete = relationship("AthleteProfile", back_populates="sleep_records")


class NutritionRecord(Base):
    __tablename__ = "nutrition_records"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False)
    log_date = Column(String(50), nullable=False)
    meal_type = Column(String(50), default="BREAKFAST")
    meal_description = Column(String(255), nullable=False)
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fats_g = Column(Float, default=0.0)
    water_ml = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    athlete = relationship("AthleteProfile", back_populates="nutrition_records")


class RecoveryRecord(Base):
    __tablename__ = "recovery_records"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False)
    log_date = Column(String(50), nullable=False)
    soreness_level = Column(Integer, default=3)  # 1-10
    fatigue_level = Column(Integer, default=3)   # 1-10
    stress_level = Column(Integer, default=3)    # 1-10
    calculated_readiness_score = Column(Float, default=85.0)  # 1-100
    training_load_estimate = Column(Float, default=50.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    athlete = relationship("AthleteProfile", back_populates="recovery_records")


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coach_profiles.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    coach = relationship("CoachProfile", back_populates="training_plans")
    assigned_exercises = relationship("AssignedExercise", back_populates="plan", cascade="all, delete-orphan")


class AssignedExercise(Base):
    __tablename__ = "assigned_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=True)
    coach_id = Column(Integer, ForeignKey("coach_profiles.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("athlete_profiles.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    target_sets = Column(Integer, default=3)
    target_reps = Column(Integer, default=10)
    target_tempo = Column(String(50), default="3-1-2")  # eccentric-pause-concentric
    target_rom = Column(Float, default=90.0)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime(timezone=True), default=utcnow)

    plan = relationship("TrainingPlan", back_populates="assigned_exercises")
    athlete = relationship("AthleteProfile", back_populates="assigned_exercises")
    exercise = relationship("Exercise")


class CoachComment(Base):
    __tablename__ = "coach_comments"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coach_profiles.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    repetition_id = Column(Integer, ForeignKey("repetitions.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    coach = relationship("CoachProfile", back_populates="comments")
    session = relationship("WorkoutSession", back_populates="comments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="INFO")  # INFO, WARNING, ALERT
    is_read = Column(Boolean, default=False)
    category = Column(String(50), default="GENERAL")  # TECHNIQUE_ALERT, WORKOUT_ASSIGNED, COACH_COMMENT
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="notifications")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # RANDOM_FOREST, GRADIENT_BOOSTING, LSTM, TEMPORAL_CNN, BIOMECHANICAL_RULES
    version_tag = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    feature_version = Column(String(50), default="pose-kinematics-v1.0")
    hyperparameters = Column(JSON, nullable=True)
    trained_on_dataset = Column(String(100), nullable=True)
    test_accuracy = Column(Float, default=0.0)
    test_f1 = Column(Float, default=0.0)
    test_mae = Column(Float, default=0.0)
    latency_fps = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class DatasetRegistry(Base):
    __tablename__ = "dataset_registry"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    source = Column(String(100), nullable=False)  # Kaggle, UCF, PhysioNet, SportX_Research
    url = Column(String(500), nullable=True)
    license = Column(String(100), nullable=False)
    sample_count = Column(Integer, default=0)
    subject_count = Column(Integer, default=0)
    exercises_covered = Column(String(255), nullable=False)
    labels_description = Column(Text, nullable=False)
    has_technique_labels = Column(Boolean, default=False)
    legal_research_use = Column(Boolean, default=True)
    limitations = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("dataset_registry.id"), nullable=True)
    run_timestamp = Column(DateTime(timezone=True), default=utcnow)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    confusion_matrix = Column(JSON, nullable=True)
    per_class_metrics = Column(JSON, nullable=True)
    latency_ms = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)


class HumanEvaluation(Base):
    __tablename__ = "human_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    repetition_id = Column(Integer, ForeignKey("repetitions.id"), nullable=True)
    evaluator_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technique_score = Column(Float, nullable=False)  # 0-100
    detected_error = Column(String(100), nullable=True)
    severity = Column(String(50), default="moderate")
    confidence = Column(Float, default=1.0)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship("WorkoutSession", back_populates="human_evaluations")
