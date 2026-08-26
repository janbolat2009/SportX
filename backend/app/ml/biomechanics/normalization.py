import numpy as np
import math
from typing import List, Dict, Any, Tuple
from app.ml.biomechanics.geometry import PoseLandmark


def check_landmarks_visibility(
    landmarks: List[Dict[str, float]],
    required_landmarks: List[PoseLandmark],
    min_confidence: float = 0.5
) -> Tuple[bool, float]:
    """
    Validates if required body landmarks are present and meet minimum confidence.
    Returns (is_valid, average_confidence).
    """
    if not landmarks or len(landmarks) < 33:
        return False, 0.0
    
    confidences = []
    for lm_idx in required_landmarks:
        lm = landmarks[lm_idx.value]
        vis = lm.get("visibility", lm.get("presence", 1.0))
        confidences.append(vis)
        if vis < min_confidence:
            return False, float(np.mean(confidences))
            
    return True, float(np.mean(confidences))


def normalize_landmarks_body_relative(landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
    """
    Normalizes 3D coordinates relative to the person's torso dimensions.
    1. Origin (0,0,0) is shifted to the midpoint between Left and Right Hips.
    2. Coordinates are scaled by the Torso Length = distance(Mid-Shoulder, Mid-Hip).
    
    This ensures scale-invariance across different distances from camera and body sizes.
    """
    if len(landmarks) < 33:
        return landmarks

    l_hip = landmarks[PoseLandmark.LEFT_HIP.value]
    r_hip = landmarks[PoseLandmark.RIGHT_HIP.value]
    l_sh = landmarks[PoseLandmark.LEFT_SHOULDER.value]
    r_sh = landmarks[PoseLandmark.RIGHT_SHOULDER.value]

    mid_hip_x = (l_hip.get("x", 0.0) + r_hip.get("x", 0.0)) / 2.0
    mid_hip_y = (l_hip.get("y", 0.0) + r_hip.get("y", 0.0)) / 2.0
    mid_hip_z = (l_hip.get("z", 0.0) + r_hip.get("z", 0.0)) / 2.0

    mid_sh_x = (l_sh.get("x", 0.0) + r_sh.get("x", 0.0)) / 2.0
    mid_sh_y = (l_sh.get("y", 0.0) + r_sh.get("y", 0.0)) / 2.0
    mid_sh_z = (l_sh.get("z", 0.0) + r_sh.get("z", 0.0)) / 2.0

    # Torso length (Euclidean distance)
    torso_length = math.sqrt(
        (mid_sh_x - mid_hip_x)**2 +
        (mid_sh_y - mid_hip_y)**2 +
        (mid_sh_z - mid_hip_z)**2
    )

    # Avoid division by zero
    scale = torso_length if torso_length > 1e-4 else 1.0

    normalized = []
    for lm in landmarks:
        norm_x = (lm.get("x", 0.0) - mid_hip_x) / scale
        norm_y = (lm.get("y", 0.0) - mid_hip_y) / scale
        norm_z = (lm.get("z", 0.0) - mid_hip_z) / scale
        normalized.append({
            "x": round(norm_x, 4),
            "y": round(norm_y, 4),
            "z": round(norm_z, 4),
            "visibility": lm.get("visibility", 1.0)
        })

    return normalized


def flatten_normalized_landmarks(normalized_landmarks: List[Dict[str, float]]) -> np.ndarray:
    """
    Flattens 33 normalized landmarks into a 1D feature array of length 99 (33 * 3).
    """
    flat = []
    for lm in normalized_landmarks:
        flat.extend([lm.get("x", 0.0), lm.get("y", 0.0), lm.get("z", 0.0)])
    return np.array(flat, dtype=np.float32)
