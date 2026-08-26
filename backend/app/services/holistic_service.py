from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import SleepRecord, NutritionRecord, RecoveryRecord, AthleteProfile
import numpy as np


def compute_daily_readiness_score(
    sleep_score: float,
    soreness_1_to_10: int,
    fatigue_1_to_10: int,
    stress_1_to_10: int
) -> float:
    """
    Computes a transparent, non-medical recovery readiness score (0 - 100).
    Formula:
    Readiness = 0.35 * SleepScore + 0.25 * (100 - Soreness*10) + 0.25 * (100 - Fatigue*10) + 0.15 * (100 - Stress*10)
    """
    soreness_comp = max(0.0, 100.0 - (soreness_1_to_10 * 10.0))
    fatigue_comp = max(0.0, 100.0 - (fatigue_1_to_10 * 10.0))
    stress_comp = max(0.0, 100.0 - (stress_1_to_10 * 10.0))

    readiness = (
        0.35 * sleep_score +
        0.25 * soreness_comp +
        0.25 * fatigue_comp +
        0.15 * stress_comp
    )
    return round(float(readiness), 1)


def get_athlete_holistic_summary(db: Session, athlete_id: int) -> Dict[str, Any]:
    """
    Summarizes recent holistic health variables (Sleep, Nutrition, Recovery) for an athlete.
    """
    sleep_records = db.query(SleepRecord).filter(SleepRecord.athlete_id == athlete_id).order_by(SleepRecord.created_at.desc()).limit(14).all()
    nutrition_records = db.query(NutritionRecord).filter(NutritionRecord.athlete_id == athlete_id).order_by(NutritionRecord.created_at.desc()).limit(20).all()
    recovery_records = db.query(RecoveryRecord).filter(RecoveryRecord.athlete_id == athlete_id).order_by(RecoveryRecord.created_at.desc()).limit(14).all()

    # Sleep metrics
    avg_sleep_mins = float(np.mean([s.total_sleep_minutes for s in sleep_records])) if sleep_records else 480.0
    avg_sleep_qual = float(np.mean([s.sleep_quality_score for s in sleep_records])) if sleep_records else 80.0
    sleep_durations = [s.total_sleep_minutes for s in sleep_records]
    sleep_consistency = max(50.0, min(100.0, 100.0 - float(np.std(sleep_durations) / 10.0))) if len(sleep_durations) > 2 else 85.0

    # Nutrition metrics
    total_cals = sum(n.calories for n in nutrition_records)
    total_protein = sum(n.protein_g for n in nutrition_records)
    total_carbs = sum(n.carbs_g for n in nutrition_records)
    total_fats = sum(n.fats_g for n in nutrition_records)
    total_water = sum(n.water_ml for n in nutrition_records)

    macro_total_grams = (total_protein + total_carbs + total_fats) or 1.0
    protein_pct = round((total_protein / macro_total_grams) * 100.0, 1)
    carbs_pct = round((total_carbs / macro_total_grams) * 100.0, 1)
    fats_pct = round((total_fats / macro_total_grams) * 100.0, 1)

    # Recovery metrics
    avg_readiness = float(np.mean([r.calculated_readiness_score for r in recovery_records])) if recovery_records else 82.0
    latest_recovery = recovery_records[0] if recovery_records else None

    return {
        "sleep": {
            "average_hours": round(avg_sleep_mins / 60.0, 1),
            "average_quality_score": round(avg_sleep_qual, 1),
            "consistency_score": round(sleep_consistency, 1),
            "records_count": len(sleep_records),
            "recent_records": [
                {
                    "date": s.log_date,
                    "hours": round(s.total_sleep_minutes / 60.0, 1),
                    "quality": s.sleep_quality_score,
                    "bedtime": s.bedtime,
                    "wake_time": s.wake_time
                }
                for s in reversed(sleep_records[:7])
            ]
        },
        "nutrition": {
            "total_calories": round(total_cals, 1),
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fats_g": round(total_fats, 1),
            "water_ml": round(total_water, 1),
            "macros_ratio": {
                "protein_pct": protein_pct,
                "carbs_pct": carbs_pct,
                "fats_pct": fats_pct
            }
        },
        "recovery": {
            "average_readiness": round(avg_readiness, 1),
            "latest_readiness": latest_recovery.calculated_readiness_score if latest_recovery else 85.0,
            "latest_soreness": latest_recovery.soreness_level if latest_recovery else 3,
            "latest_fatigue": latest_recovery.fatigue_level if latest_recovery else 3,
            "latest_stress": latest_recovery.stress_level if latest_recovery else 3,
            "recent_trend": [
                {
                    "date": r.log_date,
                    "readiness": r.calculated_readiness_score,
                    "soreness": r.soreness_level,
                    "fatigue": r.fatigue_level
                }
                for r in reversed(recovery_records[:7])
            ]
        }
    }
