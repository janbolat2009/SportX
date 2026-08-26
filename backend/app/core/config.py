import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SportX"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "sportx-super-secret-jwt-key-for-research-and-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./sportx.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Upload storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 100
    
    # MediaPipe / Pose Analysis
    POSE_MIN_DETECTION_CONFIDENCE: float = 0.5
    POSE_MIN_TRACKING_CONFIDENCE: float = 0.5
    
    # Model & Feature Versions (for scientific reproducibility)
    DEFAULT_MODEL_VERSION: str = "sportx-biomech-v1.0"
    DEFAULT_FEATURE_VERSION: str = "pose-kinematics-v1.0"
    DEFAULT_SCORING_VERSION: str = "biomech-scoring-v1.0"
    
    # Disclaimers
    MEDICAL_DISCLAIMER: str = (
        "SportX is a fitness biomechanics and movement analysis platform designed for "
        "technique feedback and research. It does not provide medical diagnoses, clinical "
        "assessments, or guarantees of injury prevention."
    )

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
