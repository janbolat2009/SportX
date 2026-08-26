from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


# Standard Pydantic v2 configuration
DBModel = ConfigDict(from_attributes=True, protected_namespaces=())


# --- Auth & User ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    role: str
    full_name: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "athlete"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    sport: Optional[str] = "General Fitness"
    training_level: Optional[str] = "Intermediate"
    organization: Optional[str] = None
    specialization: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = DBModel


# --- Athlete Profile ---
class AthleteProfileOut(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[str]
    gender: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    sport: str
    training_level: str
    fitness_goals: Optional[str]
    anonymized_subject_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    model_config = DBModel


class AthleteProfileUpdate(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    sport: Optional[str] = None
    training_level: Optional[str] = None
    fitness_goals: Optional[str] = None


# --- Coach Profile ---
class CoachProfileOut(BaseModel):
    id: int
    user_id: int
    organization: Optional[str]
    specialization: Optional[str]
    bio: Optional[str]
    certifications: Optional[str]
    full_name: Optional[str] = None
    email: Optional[str] = None
    model_config = DBModel


# --- Exercises ---
class ExerciseOut(BaseModel):
    id: int
    name: str
    slug: str
    target_muscles: str
    description: str
    default_camera_angle: str
    camera_setup_instructions: str
    ideal_rom_degrees: float
    normative_cadence_seconds: float
    model_config = DBModel


# --- Sessions & Reps ---
class TechniqueIssueOut(BaseModel):
    id: Optional[int] = None
    error_code: str
    error_name: str
    severity: str
    confidence: float
    description: str
    corrective_instruction: str
    timestamp: float
    model_config = DBModel


class RepetitionOut(BaseModel):
    id: int
    rep_number: int
    start_time: float
    end_time: float
    duration_seconds: float
    rep_score: float
    alignment_score: float
    rom_score: float
    symmetry_score: float
    tempo_score: float
    stability_score: float
    peak_angle: float
    min_angle: float
    is_valid: bool
    phase_durations: Optional[Dict[str, Any]] = None
    detected_errors: Optional[List[Dict[str, Any]]] = None
    model_config = DBModel


class WorkoutSessionCreate(BaseModel):
    exercise_slug: str
    session_type: str = "LIVE_CAMERA"
    duration_seconds: float = 0.0
    total_reps: int = 0
    valid_reps: int = 0
    overall_score: float = 0.0
    alignment_score: float = 0.0
    rom_score: float = 0.0
    symmetry_score: float = 0.0
    tempo_score: float = 0.0
    stability_score: float = 0.0
    feedback_summary: Optional[str] = None
    repetitions: List[Dict[str, Any]] = []
    issues: List[Dict[str, Any]] = []


class WorkoutSessionOut(BaseModel):
    id: int
    athlete_id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    exercise_slug: Optional[str] = None
    session_type: str
    video_url: Optional[str] = None
    duration_seconds: float
    total_reps: int
    valid_reps: int
    overall_score: float
    alignment_score: float
    rom_score: float
    symmetry_score: float
    tempo_score: float
    stability_score: float
    model_version: str
    feature_version: str
    scoring_version: str
    feedback_summary: Optional[str] = None
    created_at: datetime
    repetitions: List[RepetitionOut] = []
    issues: List[TechniqueIssueOut] = []
    model_config = DBModel


# --- Real-Time / Live Frame ---
class LandmarkItem(BaseModel):
    x: float
    y: float
    z: float
    visibility: float = 1.0


class LiveAnalysisFrameIn(BaseModel):
    exercise_slug: str
    frame_index: int
    timestamp: float
    landmarks: List[LandmarkItem]
    session_state_id: Optional[str] = None


class LiveFeedbackOut(BaseModel):
    exercise: str
    phase: str
    current_rep: int
    instantaneous_score: float
    primary_joint_angle: float
    secondary_joint_angle: float
    symmetry_ratio: float
    torso_angle: float
    is_in_frame: bool
    confidence: float
    detected_issue: Optional[str] = None
    corrective_instruction: Optional[str] = None
    severity: Optional[str] = None
    rep_completed: bool = False
    completed_rep_data: Optional[Dict[str, Any]] = None


# --- Holistic Tracking ---
class SleepRecordCreate(BaseModel):
    log_date: str
    bedtime: Optional[str] = "22:30"
    wake_time: Optional[str] = "06:30"
    total_sleep_minutes: int = 480
    sleep_quality_score: float = 80.0
    notes: Optional[str] = None


class SleepRecordOut(SleepRecordCreate):
    id: int
    athlete_id: int
    consistency_score: float
    created_at: datetime
    model_config = DBModel


class NutritionRecordCreate(BaseModel):
    log_date: str
    meal_type: str = "LUNCH"
    meal_description: Optional[str] = None
    calories: int = 600
    protein_g: float = 35.0
    carbs_g: float = 70.0
    fats_g: float = 20.0
    water_ml: float = 500.0


class NutritionRecordOut(NutritionRecordCreate):
    id: int
    athlete_id: int
    created_at: datetime
    model_config = DBModel


class RecoveryRecordCreate(BaseModel):
    log_date: str
    soreness_level: int = 3
    fatigue_level: int = 3
    stress_level: int = 2
    training_load_estimate: float = 50.0
    notes: Optional[str] = None


class RecoveryRecordOut(RecoveryRecordCreate):
    id: int
    athlete_id: int
    calculated_readiness_score: float
    created_at: datetime
    model_config = DBModel


# --- Coaching & Alerts ---
class TrainingPlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_weeks: int = 4


class TrainingPlanOut(TrainingPlanCreate):
    id: int
    coach_id: int
    created_at: datetime
    model_config = DBModel


class AssignedExerciseCreate(BaseModel):
    athlete_id: int
    exercise_id: int
    plan_id: Optional[int] = None
    target_sets: int = 3
    target_reps: int = 10
    target_tempo: Optional[str] = "3-1-2"
    target_rom: Optional[float] = 90.0
    target_weight_kg: Optional[float] = None
    notes: Optional[str] = None


class AssignExerciseCreate(AssignedExerciseCreate):
    pass


class AssignedExerciseOut(BaseModel):
    id: int
    athlete_id: int
    coach_id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    exercise_slug: Optional[str] = None
    plan_id: Optional[int]
    target_sets: int
    target_reps: int
    target_tempo: Optional[str]
    target_rom: Optional[float]
    target_weight_kg: Optional[float]
    notes: Optional[str]
    is_completed: bool
    created_at: datetime
    model_config = DBModel


class CoachCommentCreate(BaseModel):
    session_id: int
    repetition_id: Optional[int] = None
    content: str


class CoachCommentOut(BaseModel):
    id: int
    coach_id: int
    coach_name: Optional[str] = None
    session_id: int
    repetition_id: Optional[int]
    content: str
    created_at: datetime
    model_config = DBModel


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    severity: str
    is_read: bool
    category: str
    created_at: datetime
    model_config = DBModel


# --- Research & Benchmarks ---
class ModelVersionOut(BaseModel):
    id: int
    model_name: str
    model_type: str
    version_tag: str
    description: str
    feature_version: str
    trained_on_dataset: Optional[str]
    test_accuracy: float
    test_f1: float
    test_mae: float
    latency_fps: float
    is_active: bool
    created_at: datetime
    model_config = DBModel


class DatasetRegistryOut(BaseModel):
    id: int
    dataset_name: str
    slug: str
    source: str
    url: Optional[str]
    license: str
    sample_count: int
    subject_count: int
    exercises_covered: str
    labels_description: str
    has_technique_labels: bool
    legal_research_use: bool
    limitations: str
    created_at: datetime
    model_config = DBModel


class EvaluationResultOut(BaseModel):
    id: int
    model_version_id: int
    model_name: Optional[str] = None
    model_version_tag: Optional[str] = None
    dataset_id: Optional[int]
    dataset_name: Optional[str] = None
    run_timestamp: datetime
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: Optional[Dict[str, Any]]
    per_class_metrics: Optional[Dict[str, Any]]
    latency_ms: float
    notes: Optional[str]
    model_config = DBModel


class RunExperimentRequest(BaseModel):
    model_type: str = "RANDOM_FOREST"
    dataset_slug: str = "sportx_biomech_benchmark"
    n_samples: int = 400
    test_split_ratio: float = 0.30
    model_config = DBModel


class HumanEvaluationCreate(BaseModel):
    session_id: int
    repetition_id: Optional[int] = None
    technique_score: float
    detected_error: Optional[str] = None
    severity: str = "moderate"
    confidence: float = 1.0
    comments: Optional[str] = None


class HumanEvaluationOut(BaseModel):
    id: int
    session_id: int
    repetition_id: Optional[int]
    evaluator_user_id: int
    technique_score: float
    detected_error: Optional[str]
    severity: str
    confidence: float
    comments: Optional[str]
    created_at: datetime
    model_config = DBModel
