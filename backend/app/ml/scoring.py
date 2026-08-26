from typing import List, Dict, Any
import numpy as np


def compute_session_composite_score(
    repetitions: List[Dict[str, Any]],
    issues: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes an explainable, transparent composite technique score from 0 to 100.
    Weighted formula:
    Score = 0.30 * Alignment + 0.25 * ROM + 0.20 * Symmetry + 0.15 * Tempo + 0.10 * Stability
    """
    if not repetitions:
        return {
            "overall_score": 0.0,
            "alignment_score": 0.0,
            "rom_score": 0.0,
            "symmetry_score": 0.0,
            "tempo_score": 0.0,
            "stability_score": 0.0,
            "rating_tier": "Incomplete Session",
            "tier_color": "gray",
            "best_rep_number": None,
            "worst_rep_number": None,
            "consistency_index": 0.0,
            "total_reps": 0,
            "valid_reps": 0
        }

    rep_scores = [r.get("rep_score", 0.0) for r in repetitions]
    align_scores = [r.get("alignment_score", 0.0) for r in repetitions]
    rom_scores = [r.get("rom_score", 0.0) for r in repetitions]
    sym_scores = [r.get("symmetry_score", 0.0) for r in repetitions]
    tempo_scores = [r.get("tempo_score", 0.0) for r in repetitions]
    stab_scores = [r.get("stability_score", 0.0) for r in repetitions]
    valid_reps = sum(1 for r in repetitions if r.get("is_valid", False))

    mean_overall = float(np.mean(rep_scores))
    mean_align = float(np.mean(align_scores))
    mean_rom = float(np.mean(rom_scores))
    mean_sym = float(np.mean(sym_scores))
    mean_tempo = float(np.mean(tempo_scores))
    mean_stab = float(np.mean(stab_scores))

    # Consistency index: inverse of standard deviation across repetitions
    std_score = float(np.std(rep_scores))
    consistency = max(0.0, min(100.0, round(100.0 - (std_score * 3.0), 1)))

    best_idx = int(np.argmax(rep_scores)) + 1
    worst_idx = int(np.argmin(rep_scores)) + 1

    # Tier categorization
    if mean_overall >= 90.0:
        rating_tier = "Excellent"
        tier_color = "emerald"
    elif mean_overall >= 75.0:
        rating_tier = "Good"
        tier_color = "blue"
    elif mean_overall >= 60.0:
        rating_tier = "Needs Improvement"
        tier_color = "amber"
    else:
        rating_tier = "Significant Technique Deviations"
        tier_color = "rose"

    return {
        "overall_score": round(mean_overall, 1),
        "alignment_score": round(mean_align, 1),
        "rom_score": round(mean_rom, 1),
        "symmetry_score": round(mean_sym, 1),
        "tempo_score": round(mean_tempo, 1),
        "stability_score": round(mean_stab, 1),
        "rating_tier": rating_tier,
        "tier_color": tier_color,
        "best_rep_number": best_idx,
        "worst_rep_number": worst_idx,
        "consistency_index": consistency,
        "total_reps": len(repetitions),
        "valid_reps": valid_reps
    }
