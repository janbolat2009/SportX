import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from scipy.stats import pearsonr, spearmanr
from sklearn.metrics import cohen_kappa_score, mean_absolute_error


def calculate_human_ai_agreement(
    human_scores: List[float],
    ai_scores: List[float],
    human_error_labels: Optional[List[str]] = None,
    ai_error_labels: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Computes statistical inter-rater agreement between Expert Human Coach ratings and AI Technique scores:
    1. Pearson Correlation (r): Linear score agreement
    2. Spearman Rank Correlation (rho): Monotonic rank agreement
    3. Mean Absolute Error (MAE): Average score disparity
    4. Cohen's Kappa (kappa): Categorical error diagnosis agreement
    5. Bland-Altman Limits of Agreement: Bias and 95% confidence intervals
    """
    if len(human_scores) < 3 or len(ai_scores) < 3 or len(human_scores) != len(ai_scores):
        return {
            "n_evaluations": len(human_scores),
            "pearson_r": 0.0,
            "pearson_p_value": 1.0,
            "spearman_rho": 0.0,
            "spearman_p_value": 1.0,
            "mae": 0.0,
            "mean_bias": 0.0,
            "limits_of_agreement": [-10.0, 10.0],
            "cohens_kappa": 0.0,
            "agreement_strength": "Insufficient Data"
        }

    h_arr = np.array(human_scores, dtype=np.float64)
    ai_arr = np.array(ai_scores, dtype=np.float64)

    # 1. Pearson r
    r_val, p_val = pearsonr(h_arr, ai_arr)

    # 2. Spearman rho
    rho_val, rho_p_val = spearmanr(h_arr, ai_arr)

    # 3. MAE
    mae = float(mean_absolute_error(h_arr, ai_arr))

    # 4. Bland-Altman Limits of Agreement
    diffs = ai_arr - h_arr
    mean_bias = float(np.mean(diffs))
    std_diff = float(np.std(diffs))
    loa_lower = round(mean_bias - 1.96 * std_diff, 2)
    loa_upper = round(mean_bias + 1.96 * std_diff, 2)

    # 5. Cohen's Kappa for categorical error diagnosis (if labels provided)
    kappa = 0.0
    if human_error_labels and ai_error_labels and len(human_error_labels) == len(ai_error_labels):
        try:
            kappa = float(cohen_kappa_score(human_error_labels, ai_error_labels))
        except Exception:
            kappa = 0.0

    # Agreement Strength qualitative interpretation (Landis & Koch standard)
    if r_val >= 0.85:
        strength = "Very High Inter-Rater Reliability"
    elif r_val >= 0.70:
        strength = "Substantial Reliability"
    elif r_val >= 0.50:
        strength = "Moderate Agreement"
    else:
        strength = "Fair to Poor Agreement"

    return {
        "n_evaluations": len(human_scores),
        "pearson_r": round(float(r_val), 4),
        "pearson_p_value": round(float(p_val), 6),
        "spearman_rho": round(float(rho_val), 4),
        "spearman_p_value": round(float(rho_p_val), 6),
        "mae": round(mae, 2),
        "mean_bias": round(mean_bias, 2),
        "limits_of_agreement": [loa_lower, loa_upper],
        "cohens_kappa": round(kappa, 3),
        "agreement_strength": strength
    }
