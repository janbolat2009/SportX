from typing import Dict, Type
from app.ml.exercises.base_analyzer import BaseExerciseAnalyzer
from app.ml.exercises.squat import SquatAnalyzer
from app.ml.exercises.pushup import PushupAnalyzer
from app.ml.exercises.bicep_curl import BicepCurlAnalyzer
from app.ml.exercises.shoulder_press import ShoulderPressAnalyzer

ANALYZER_MAP: Dict[str, Type[BaseExerciseAnalyzer]] = {
    "squat": SquatAnalyzer,
    "pushup": PushupAnalyzer,
    "bicep_curl": BicepCurlAnalyzer,
    "shoulder_press": ShoulderPressAnalyzer
}


def get_exercise_analyzer(exercise_slug: str) -> BaseExerciseAnalyzer:
    normalized_slug = exercise_slug.lower().replace("-", "_").strip()
    analyzer_cls = ANALYZER_MAP.get(normalized_slug)
    if not analyzer_cls:
        raise ValueError(f"Unsupported exercise slug: '{exercise_slug}'. Available: {list(ANALYZER_MAP.keys())}")
    return analyzer_cls()
