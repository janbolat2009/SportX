from typing import List, Dict, Any
from collections import Counter


def generate_structured_feedback(
    exercise_name: str,
    overall_score: float,
    scores_breakdown: Dict[str, float],
    repetitions: List[Dict[str, Any]],
    issues: List[Dict[str, Any]]
) -> str:
    """
    Generates youth-friendly, encouraging, and actionable technique feedback
    derived solely from measured biomechanical features.
    Explicitly non-medical and scientific.
    """
    total_reps = len(repetitions)
    valid_reps = sum(1 for r in repetitions if r.get("is_valid", False))
    
    lines = []
    
    # 1. Opening Summary
    if overall_score >= 90.0:
        lines.append(f"Outstanding performance on your {exercise_name} session! You completed {total_reps} repetitions with strong overall control and precision.")
    elif overall_score >= 75.0:
        lines.append(f"Solid work on your {exercise_name} session! You completed {total_reps} repetitions ({valid_reps} with high technique quality).")
    elif overall_score >= 60.0:
        lines.append(f"Good effort on your {exercise_name} session! You completed {total_reps} repetitions. With a few key technique adjustments, your movement efficiency will improve significantly.")
    else:
        lines.append(f"You completed {total_reps} repetitions of {exercise_name}. Several measurable movement deviations were detected that you can focus on refining in your next session.")

    # 2. Strongest Component
    sub_scores = {
        "Joint Alignment": scores_breakdown.get("alignment_score", 0.0),
        "Range of Motion": scores_breakdown.get("rom_score", 0.0),
        "Bilateral Symmetry": scores_breakdown.get("symmetry_score", 0.0),
        "Cadence & Tempo": scores_breakdown.get("tempo_score", 0.0),
        "Movement Stability": scores_breakdown.get("stability_score", 0.0),
    }
    strongest_category, strongest_val = max(sub_scores.items(), key=lambda x: x[1])
    if strongest_val >= 80.0:
        lines.append(f"Strengths: Your {strongest_category.lower()} was your highest scoring attribute at {strongest_val}/100.")

    # 3. Key Biomechanical Deviations & Cues
    if issues:
        error_names = [i.get("error_name", "Technique variance") for i in issues]
        error_counts = Counter(error_names)
        most_common_error, count = error_counts.most_common(1)[0]
        
        # Find corresponding corrective instruction
        sample_issue = next((i for i in issues if i.get("error_name") == most_common_error), None)
        cue = sample_issue.get("corrective_instruction", "") if sample_issue else ""

        lines.append(f"Focus Area: '{most_common_error}' was observed across {count} of your {total_reps} repetitions.")
        if cue:
            lines.append(f"Coach Cue: {cue}")
    else:
        lines.append("Form Consistency: No major biomechanical alignment deviations were flagged during this set. Keep maintaining this solid pattern!")

    return " ".join(lines)
