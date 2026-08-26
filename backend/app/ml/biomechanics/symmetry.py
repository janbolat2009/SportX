import numpy as np
from typing import Dict, Any, Tuple


def calculate_bilateral_symmetry(left_val: float, right_val: float) -> float:
    """
    Calculates Bilateral Symmetry Index (BSI) in percentage [0, 100].
    100% = perfect symmetry.
    Formula: 100 - (|Left - Right| / max(Left, Right, 1.0) * 100)
    """
    max_val = max(abs(left_val), abs(right_val), 1.0)
    diff = abs(left_val - right_val)
    disparity_ratio = diff / max_val
    symmetry_score = max(0.0, 100.0 - (disparity_ratio * 100.0))
    return round(symmetry_score, 1)


def compute_frame_symmetry(joint_angles: Dict[str, float]) -> Dict[str, float]:
    """
    Evaluates bilateral symmetry across key joint pairs:
    - Knee symmetry
    - Hip symmetry
    - Elbow symmetry
    - Shoulder symmetry
    """
    knee_sym = calculate_bilateral_symmetry(
        joint_angles.get("left_knee_angle", 180.0),
        joint_angles.get("right_knee_angle", 180.0)
    )
    hip_sym = calculate_bilateral_symmetry(
        joint_angles.get("left_hip_angle", 180.0),
        joint_angles.get("right_hip_angle", 180.0)
    )
    elbow_sym = calculate_bilateral_symmetry(
        joint_angles.get("left_elbow_angle", 180.0),
        joint_angles.get("right_elbow_angle", 180.0)
    )
    shoulder_sym = calculate_bilateral_symmetry(
        joint_angles.get("left_shoulder_angle", 0.0),
        joint_angles.get("right_shoulder_angle", 0.0)
    )

    overall_sym = round((knee_sym + hip_sym + elbow_sym + shoulder_sym) / 4.0, 1)

    return {
        "knee_symmetry": knee_sym,
        "hip_symmetry": hip_sym,
        "elbow_symmetry": elbow_sym,
        "shoulder_symmetry": shoulder_sym,
        "overall_symmetry": overall_sym
    }
