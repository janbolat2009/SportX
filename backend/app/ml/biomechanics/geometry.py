import numpy as np
import math
from typing import List, Tuple, Dict, Any, Optional
from enum import IntEnum


class PoseLandmark(IntEnum):
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


def calculate_angle_2d(p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
    """
    Calculates the 2D joint angle at vertex p2 formed by lines (p2 -> p1) and (p2 -> p3).
    Returns degrees in range [0, 180].
    """
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
    
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    if norm1 < 1e-6 or norm2 < 1e-6:
        return 180.0
    
    cosine_angle = np.dot(v1, v2) / (norm1 * norm2)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))
    return float(angle)


def calculate_angle_3d(p1: Tuple[float, float, float], p2: Tuple[float, float, float], p3: Tuple[float, float, float]) -> float:
    """
    Calculates the 3D joint angle at vertex p2.
    Returns degrees in range [0, 180].
    """
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]])
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]])
    
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    
    if norm1 < 1e-6 or norm2 < 1e-6:
        return 180.0
    
    cosine_angle = np.dot(v1, v2) / (norm1 * norm2)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))
    return float(angle)


def calculate_inclination_to_vertical(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Calculates the absolute angle of line p1->p2 relative to true vertical (0, -1).
    0 deg = perfectly upright/vertical, 90 deg = horizontal.
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    
    # In screen coordinates, y increases downward. Vertical up is (0, -1).
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return 0.0
    
    # Angle from vertical (dy negative is upwards)
    angle_rad = math.atan2(abs(dx), abs(dy))
    return float(math.degrees(angle_rad))


def get_midpoint(p1: Tuple[float, float, float], p2: Tuple[float, float, float]) -> Tuple[float, float, float]:
    return (
        (p1[0] + p2[0]) / 2.0,
        (p1[1] + p2[1]) / 2.0,
        (p1[2] + p2[2]) / 2.0
    )


def extract_key_joint_angles(landmarks: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Extracts standard biomechanical joint angles from a 33-landmark list.
    """
    if len(landmarks) < 33:
        return {}
    
    def pt(idx: PoseLandmark) -> Tuple[float, float, float]:
        lm = landmarks[idx.value]
        x = lm.get("x", 0.0)
        y = lm.get("y", 0.0)
        z = lm.get("z", 0.0)
        return (x, y, z)

    l_shoulder = pt(PoseLandmark.LEFT_SHOULDER)
    r_shoulder = pt(PoseLandmark.RIGHT_SHOULDER)
    l_elbow = pt(PoseLandmark.LEFT_ELBOW)
    r_elbow = pt(PoseLandmark.RIGHT_ELBOW)
    l_wrist = pt(PoseLandmark.LEFT_WRIST)
    r_wrist = pt(PoseLandmark.RIGHT_WRIST)
    
    l_hip = pt(PoseLandmark.LEFT_HIP)
    r_hip = pt(PoseLandmark.RIGHT_HIP)
    l_knee = pt(PoseLandmark.LEFT_KNEE)
    r_knee = pt(PoseLandmark.RIGHT_KNEE)
    l_ankle = pt(PoseLandmark.LEFT_ANKLE)
    r_ankle = pt(PoseLandmark.RIGHT_ANKLE)

    mid_shoulder = get_midpoint(l_shoulder, r_shoulder)
    mid_hip = get_midpoint(l_hip, r_hip)
    mid_knee = get_midpoint(l_knee, r_knee)
    mid_ankle = get_midpoint(l_ankle, r_ankle)

    # Knee flexion angles (Hip - Knee - Ankle)
    left_knee_angle = calculate_angle_3d(l_hip, l_knee, l_ankle)
    right_knee_angle = calculate_angle_3d(r_hip, r_knee, r_ankle)

    # Hip flexion angles (Shoulder - Hip - Knee)
    left_hip_angle = calculate_angle_3d(l_shoulder, l_hip, l_knee)
    right_hip_angle = calculate_angle_3d(r_shoulder, r_hip, r_knee)

    # Elbow angles (Shoulder - Elbow - Wrist)
    left_elbow_angle = calculate_angle_3d(l_shoulder, l_elbow, l_wrist)
    right_elbow_angle = calculate_angle_3d(r_shoulder, r_elbow, r_wrist)

    # Shoulder abduction / elevation (Hip - Shoulder - Elbow)
    left_shoulder_angle = calculate_angle_3d(l_hip, l_shoulder, l_elbow)
    right_shoulder_angle = calculate_angle_3d(r_hip, r_shoulder, r_elbow)

    # Torso inclination relative to vertical
    torso_angle = calculate_inclination_to_vertical((mid_hip[0], mid_hip[1]), (mid_shoulder[0], mid_shoulder[1]))
    
    # Body straightness / plank alignment (Shoulder - Hip - Ankle)
    left_body_line = calculate_angle_2d((l_shoulder[0], l_shoulder[1]), (l_hip[0], l_hip[1]), (l_ankle[0], l_ankle[1]))
    right_body_line = calculate_angle_2d((r_shoulder[0], r_shoulder[1]), (r_hip[0], r_hip[1]), (r_ankle[0], r_ankle[1]))

    return {
        "left_knee_angle": round(left_knee_angle, 2),
        "right_knee_angle": round(right_knee_angle, 2),
        "avg_knee_angle": round((left_knee_angle + right_knee_angle) / 2.0, 2),
        "left_hip_angle": round(left_hip_angle, 2),
        "right_hip_angle": round(right_hip_angle, 2),
        "avg_hip_angle": round((left_hip_angle + right_hip_angle) / 2.0, 2),
        "left_elbow_angle": round(left_elbow_angle, 2),
        "right_elbow_angle": round(right_elbow_angle, 2),
        "avg_elbow_angle": round((left_elbow_angle + right_elbow_angle) / 2.0, 2),
        "left_shoulder_angle": round(left_shoulder_angle, 2),
        "right_shoulder_angle": round(right_shoulder_angle, 2),
        "torso_angle": round(torso_angle, 2),
        "left_body_line": round(left_body_line, 2),
        "right_body_line": round(right_body_line, 2),
        "avg_body_line": round((left_body_line + right_body_line) / 2.0, 2),
    }
