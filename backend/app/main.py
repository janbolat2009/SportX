from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.core.security import get_password_hash
from app.models import (
    User, AthleteProfile, CoachProfile, CoachAthleteRelationship,
    Exercise, WorkoutSession, Repetition, TechniqueIssue, SleepRecord,
    NutritionRecord, RecoveryRecord, TrainingPlan, AssignedExercise,
    ModelVersion, DatasetRegistry
)
from app.ml.datasets.registry import DATASET_REGISTRY_CATALOG

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Research-Oriented AI Fitness & Biomechanics Platform for Young Athletes and Remote Coaches",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded videos
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root_status():
    return {
        "platform": "SportX AI Fitness & Biomechanics Research Platform",
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "disclaimer": settings.MEDICAL_DISCLAIMER,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.on_event("startup")
def seed_initial_data():
    """
    Seeds essential exercise definitions, model version metadata, dataset registry,
    and demo accounts for seamless evaluation.
    """
    db = SessionLocal()
    try:
        # 1. Seed Exercises
        if db.query(Exercise).count() == 0:
            exercises_seed = [
                Exercise(
                    name="Squat",
                    slug="squat",
                    target_muscles="Quadriceps, Gluteus Maximus, Hamstrings, Core",
                    description="A fundamental lower-body compound movement analyzing knee flexion depth, knee valgus/varus alignment, and torso inclination.",
                    default_camera_angle="Side or 45-degree Front-Side View",
                    camera_setup_instructions="Position camera 2.5 to 3.5 meters away at hip height. Ensure feet and full head reach are visible.",
                    ideal_rom_degrees=90.0,
                    normative_cadence_seconds=3.0
                ),
                Exercise(
                    name="Push-up",
                    slug="pushup",
                    target_muscles="Pectoralis Major, Anterior Deltoids, Triceps Brachii, Core",
                    description="Upper-body horizontal pressing movement evaluating chest depth, elbow flare angle, and straight-line plank posture.",
                    default_camera_angle="Side View",
                    camera_setup_instructions="Position camera 2 to 3 meters away at floor/shin height with side view showing full body from head to heels.",
                    ideal_rom_degrees=90.0,
                    normative_cadence_seconds=2.5
                ),
                Exercise(
                    name="Bicep Curl",
                    slug="bicep_curl",
                    target_muscles="Biceps Brachii, Brachialis, Forearm Flexors",
                    description="Isolated upper-limb flexion movement monitoring upper-arm stillness, elbow drift, and torso momentum compensation.",
                    default_camera_angle="Front or Side View",
                    camera_setup_instructions="Position camera 2 to 3 meters away at chest height. Ensure upper arms and shoulders are in full view.",
                    ideal_rom_degrees=55.0,
                    normative_cadence_seconds=3.0
                ),
                Exercise(
                    name="Shoulder Press",
                    slug="shoulder_press",
                    target_muscles="Deltoids, Upper Trapezius, Triceps Brachii, Core Stabilizers",
                    description="Vertical overhead pressing movement evaluating overhead lockout, bilateral symmetry, and lumbar hyperextension.",
                    default_camera_angle="Front View",
                    camera_setup_instructions="Position camera 2.5 to 3.5 meters away at chest height. Ensure overhead arms reach is within frame.",
                    ideal_rom_degrees=165.0,
                    normative_cadence_seconds=3.0
                )
            ]
            db.add_all(exercises_seed)
            db.commit()

        # 2. Seed Dataset Registry
        if db.query(DatasetRegistry).count() == 0:
            for ds in DATASET_REGISTRY_CATALOG:
                db_ds = DatasetRegistry(
                    dataset_name=ds["dataset_name"],
                    slug=ds["slug"],
                    source=ds["source"],
                    url=ds["url"],
                    license=ds["license"],
                    sample_count=ds["sample_count"],
                    subject_count=ds["subject_count"],
                    exercises_covered=ds["exercises_covered"],
                    labels_description=ds["labels_description"],
                    has_technique_labels=ds["has_technique_labels"],
                    legal_research_use=ds["legal_research_use"],
                    limitations=ds["limitations"]
                )
                db.add(db_ds)
            db.commit()

        # 3. Seed Model Versions
        if db.query(ModelVersion).count() == 0:
            models_seed = [
                ModelVersion(
                    model_name="Biomechanical Rule Engine",
                    model_type="BIOMECHANICAL_RULES",
                    version_tag="sportx-rules-v1.0",
                    description="Deterministic biomechanical rule state machines operating on normalized 3D joint angles.",
                    feature_version="pose-kinematics-v1.0",
                    trained_on_dataset="Calibrated Anatomical Norms",
                    test_accuracy=0.885,
                    test_f1=0.872,
                    test_mae=3.2,
                    latency_fps=20000.0
                ),
                ModelVersion(
                    model_name="Random Forest Pose Classifier",
                    model_type="RANDOM_FOREST",
                    version_tag="sportx-rf-v1.0",
                    description="Random Forest ensemble on 18 statistical kinematic feature vectors.",
                    feature_version="pose-kinematics-v1.0",
                    trained_on_dataset="SportX Biomechanical Kinematic Benchmark",
                    test_accuracy=0.924,
                    test_f1=0.921,
                    test_mae=2.4,
                    latency_fps=1850.0
                ),
                ModelVersion(
                    model_name="Temporal 1D-CNN Sequence Classifier",
                    model_type="TEMPORAL_CNN",
                    version_tag="sportx-temporal-cnn-v1.0",
                    description="1D Temporal Convolutional Neural Network operating on sequential pose feature windows.",
                    feature_version="pose-timeseries-v1.0",
                    trained_on_dataset="SportX Biomechanical Kinematic Benchmark",
                    test_accuracy=0.948,
                    test_f1=0.946,
                    test_mae=1.9,
                    latency_fps=780.0
                )
            ]
            db.add_all(models_seed)
            db.commit()

        # 4. Seed Demo Users & Holistic Profiles
        demo_athlete = db.query(User).filter(User.email == "athlete@sportx.ai").first()
        if not demo_athlete:
            demo_athlete = User(
                email="athlete@sportx.ai",
                hashed_password=get_password_hash("athlete123"),
                full_name="Alex Rivera",
                role="athlete"
            )
            db.add(demo_athlete)
            db.flush()

            athlete_profile = AthleteProfile(
                user_id=demo_athlete.id,
                date_of_birth="2008-04-12",
                gender="Male",
                height_cm=176.0,
                weight_kg=68.5,
                sport="Track & Field / Sprinting",
                training_level="Youth Athlete",
                fitness_goals="Build lower limb explosive power and refine squat mechanics.",
                anonymized_subject_id="SUBJ_YOUTH_001"
            )
            db.add(athlete_profile)
            db.flush()

            # Seed Demo Coach
            demo_coach = User(
                email="coach@sportx.ai",
                hashed_password=get_password_hash("coach123"),
                full_name="Coach Marcus Vance",
                role="coach"
            )
            db.add(demo_coach)
            db.flush()

            coach_profile = CoachProfile(
                user_id=demo_coach.id,
                organization="National Youth Sports Academy",
                specialization="Youth Strength & Biomechanics Coach",
                bio="12+ years training competitive junior athletes with a focus on movement longevity and injury risk mitigation."
            )
            db.add(coach_profile)
            db.flush()

            # Link Coach and Athlete
            rel = CoachAthleteRelationship(
                coach_id=demo_coach.id,
                athlete_id=demo_athlete.id,
                status="active"
            )
            db.add(rel)

            # Seed Demo Researcher
            demo_researcher = User(
                email="researcher@sportx.ai",
                hashed_password=get_password_hash("research123"),
                full_name="Dr. Elena Rostova",
                role="researcher"
            )
            db.add(demo_researcher)

            # Seed Initial Workout Sessions for Athlete
            squat_ex = db.query(Exercise).filter(Exercise.slug == "squat").first()
            if squat_ex:
                s1 = WorkoutSession(
                    athlete_id=athlete_profile.id,
                    exercise_id=squat_ex.id,
                    session_type="LIVE_CAMERA",
                    duration_seconds=42.0,
                    total_reps=10,
                    valid_reps=8,
                    overall_score=82.5,
                    alignment_score=78.0,
                    rom_score=88.0,
                    symmetry_score=86.0,
                    tempo_score=79.0,
                    stability_score=82.0,
                    feedback_summary="Solid session on your Squats! Range of motion was your highest scoring attribute. Focus on knee alignment during the descent.",
                )
                db.add(s1)
                db.flush()

                # Add sample repetition records
                for r_idx in range(1, 11):
                    score = 88.0 if r_idx in [1, 2, 4, 5, 7, 8, 9, 10] else 64.0
                    valgus = r_idx in [3, 6]
                    errs = [{"error_code": "SQUAT_KNEE_VALGUS", "error_name": "Knee Inward Deviation (Valgus)"}] if valgus else []
                    rep = Repetition(
                        session_id=s1.id,
                        rep_number=r_idx,
                        start_time=r_idx * 3.8,
                        end_time=r_idx * 3.8 + 3.2,
                        duration_seconds=3.2,
                        rep_score=score,
                        alignment_score=60.0 if valgus else 92.0,
                        rom_score=90.0,
                        symmetry_score=85.0,
                        tempo_score=80.0,
                        stability_score=80.0,
                        peak_angle=175.0,
                        min_angle=84.0,
                        is_valid=not valgus,
                        detected_errors=errs
                    )
                    db.add(rep)

                # Add issue
                iss = TechniqueIssue(
                    session_id=s1.id,
                    error_code="SQUAT_KNEE_VALGUS",
                    error_name="Knee Inward Deviation (Valgus)",
                    severity="moderate",
                    confidence=0.88,
                    description="Knee collapsed inward during descent on repetitions 3 and 6.",
                    corrective_instruction="Actively push knees outward in line with middle toes.",
                    timestamp=14.2
                )
                db.add(iss)

            # Seed Holistic Sleep & Recovery
            dates = ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26"]
            for d in dates:
                db.add(SleepRecord(
                    athlete_id=athlete_profile.id,
                    log_date=d,
                    bedtime="22:15",
                    wake_time="06:45",
                    total_sleep_minutes=510,
                    sleep_quality_score=85.0,
                    consistency_score=88.0
                ))
                db.add(RecoveryRecord(
                    athlete_id=athlete_profile.id,
                    log_date=d,
                    soreness_level=3,
                    fatigue_level=2,
                    stress_level=3,
                    calculated_readiness_score=86.5,
                    training_load_estimate=65.0
                ))

            # Seed Nutrition
            db.add(NutritionRecord(
                athlete_id=athlete_profile.id,
                log_date="2026-08-26",
                meal_type="LUNCH",
                meal_description="Grilled chicken rice bowl with roasted greens",
                calories=720.0,
                protein_g=48.0,
                carbs_g=85.0,
                fats_g=18.0,
                water_ml=750.0
            ))

            # Seed Assigned Exercise from Coach
            if squat_ex:
                db.add(AssignedExercise(
                    coach_id=coach_profile.id,
                    athlete_id=athlete_profile.id,
                    exercise_id=squat_ex.id,
                    target_sets=3,
                    target_reps=10,
                    target_tempo="3-1-2",
                    target_rom=90.0,
                    notes="Focus on controlled 3-second descent and maintaining knee alignment with toes."
                ))

            db.commit()

    finally:
        db.close()
