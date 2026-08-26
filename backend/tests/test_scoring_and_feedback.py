import pytest
from app.ml.scoring import compute_session_composite_score
from app.ml.feedback import generate_structured_feedback


def test_scoring_composite_calculation():
    reps = [
        {
            "rep_number": 1,
            "rep_score": 85.0,
            "alignment_score": 88.0,
            "rom_score": 90.0,
            "symmetry_score": 84.0,
            "tempo_score": 80.0,
            "stability_score": 82.0,
            "is_valid": True
        },
        {
            "rep_number": 2,
            "rep_score": 75.0,
            "alignment_score": 70.0,
            "rom_score": 80.0,
            "symmetry_score": 78.0,
            "tempo_score": 72.0,
            "stability_score": 75.0,
            "is_valid": True
        }
    ]
    issues = [
        {
            "error_code": "SQUAT_KNEE_VALGUS",
            "error_name": "Knee Inward Deviation (Valgus)",
            "severity": "moderate",
            "corrective_instruction": "Keep knees pushed outward."
        }
    ]

    scores = compute_session_composite_score(reps, issues)
    assert scores["overall_score"] == 80.0
    assert scores["total_reps"] == 2
    assert scores["valid_reps"] == 2
    assert scores["best_rep_number"] == 1
    assert scores["worst_rep_number"] == 2
    assert scores["rating_tier"] == "Good"


def test_feedback_generation_non_medical():
    scores_breakdown = {
        "alignment_score": 82.0,
        "rom_score": 90.0,
        "symmetry_score": 85.0,
        "tempo_score": 80.0,
        "stability_score": 84.0
    }
    reps = [{"rep_score": 85.0, "is_valid": True}]
    issues = [{
        "error_name": "Reduced Squat Depth",
        "corrective_instruction": "Lower your hips further until thighs are parallel with the floor."
    }]

    feedback = generate_structured_feedback(
        exercise_name="Squat",
        overall_score=85.0,
        scores_breakdown=scores_breakdown,
        repetitions=reps,
        issues=issues
    )

    assert "Solid work" in feedback
    assert "range of motion" in feedback.lower()
    assert "Lower your hips further" in feedback
    # Ensure non-medical language
    assert "injury" not in feedback.lower()
    assert "diagnos" not in feedback.lower()
