from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, athletes, coaches, exercises, analysis, sleep, nutrition, recovery, research, ai_assistant
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(athletes.router, prefix="/athletes", tags=["Athletes"])
api_router.include_router(coaches.router, prefix="/coaches", tags=["Coaches"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["Exercises"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Biomechanics & CV Analysis"])
api_router.include_router(sleep.router, prefix="/sleep", tags=["Sleep Tracking"])
api_router.include_router(nutrition.router, prefix="/nutrition", tags=["Nutrition Tracking"])
api_router.include_router(recovery.router, prefix="/recovery", tags=["Recovery & Readiness"])
api_router.include_router(research.router, prefix="/research", tags=["Scientific Research Laboratory"])
api_router.include_router(ai_assistant.router, prefix="/ai-assistant", tags=["AI Assistant"])
api_router.include_router(ai_assistant.router, prefix="/ai", tags=["AI Assistant Direct"])

