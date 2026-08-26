from typing import Dict, Any, List
from enum import Enum


class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class TechniqueErrorCategory(str, Enum):
    ALIGNMENT = "alignment"
    RANGE_OF_MOTION = "range_of_motion"
    SYMMETRY = "symmetry"
    TEMPO = "tempo"
    STABILITY = "stability"
    POSTURE = "posture"


ERROR_TAXONOMY: Dict[str, Dict[str, Any]] = {
    # --- Squat Errors ---
    "SQUAT_INSUFFICIENT_DEPTH": {
        "id": "SQUAT_INSUFFICIENT_DEPTH",
        "name": "Reduced Squat Depth",
        "category": TechniqueErrorCategory.RANGE_OF_MOTION.value,
        "exercises": ["squat"],
        "description": "Knee flexion angle did not reach the target depth threshold (hip crease parallel with or below knees).",
        "corrective_instruction": "Lower your hips further until thighs are parallel with the ground before driving back up.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "SQUAT_KNEE_VALGUS": {
        "id": "SQUAT_KNEE_VALGUS",
        "name": "Knee Inward Deviation (Valgus)",
        "category": TechniqueErrorCategory.ALIGNMENT.value,
        "exercises": ["squat"],
        "description": "One or both knees collapsed medially (inward) relative to the hip-to-ankle alignment axis during descent or ascent.",
        "corrective_instruction": "Actively push your knees outward in line with your middle toes throughout the movement.",
        "default_severity": Severity.SEVERE.value,
        "confidence_threshold": 0.85
    },
    "SQUAT_EXCESSIVE_FORWARD_LEAN": {
        "id": "SQUAT_EXCESSIVE_FORWARD_LEAN",
        "name": "Excessive Torso Forward Lean",
        "category": TechniqueErrorCategory.POSTURE.value,
        "exercises": ["squat"],
        "description": "Torso inclination angle relative to vertical exceeded the recommended threshold, shifting center of mass forward.",
        "corrective_instruction": "Maintain a proud chest and focus your gaze forward to keep your torso more upright.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "SQUAT_ASYMMETRIC_DESCENT": {
        "id": "SQUAT_ASYMMETRIC_DESCENT",
        "name": "Asymmetric Lowering",
        "category": TechniqueErrorCategory.SYMMETRY.value,
        "exercises": ["squat"],
        "description": "Disparity in knee flexion or hip loading between left and right sides during the squat cycle.",
        "corrective_instruction": "Distribute your body weight evenly across both feet and descend symmetrically.",
        "default_severity": Severity.MILD.value,
        "confidence_threshold": 0.75
    },
    "SQUAT_RAPID_DESCENT": {
        "id": "SQUAT_RAPID_DESCENT",
        "name": "Uncontrolled Descent Tempo",
        "category": TechniqueErrorCategory.TEMPO.value,
        "exercises": ["squat"],
        "description": "Eccentric descent duration was significantly faster than the recommended cadence (under 1.2 seconds).",
        "corrective_instruction": "Control the lowering phase over 2-3 seconds to build stability and control.",
        "default_severity": Severity.MILD.value,
        "confidence_threshold": 0.85
    },

    # --- Push-up Errors ---
    "PUSHUP_HIP_SAG": {
        "id": "PUSHUP_HIP_SAG",
        "name": "Hip Sag / Lumbar Extension",
        "category": TechniqueErrorCategory.POSTURE.value,
        "exercises": ["pushup"],
        "description": "Hips dropped below the linear alignment plane connecting shoulders, hips, and ankles.",
        "corrective_instruction": "Brace your core and squeeze your glutes to maintain a straight line from head to heels.",
        "default_severity": Severity.SEVERE.value,
        "confidence_threshold": 0.85
    },
    "PUSHUP_HIP_PIKE": {
        "id": "PUSHUP_HIP_PIKE",
        "name": "Hip Pike / Elevated Hips",
        "category": TechniqueErrorCategory.POSTURE.value,
        "exercises": ["pushup"],
        "description": "Hips pushed upward above the shoulder-ankle plane, reducing load on chest and core.",
        "corrective_instruction": "Lower your hips until your body forms a flat plank position.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "PUSHUP_INSUFFICIENT_DEPTH": {
        "id": "PUSHUP_INSUFFICIENT_DEPTH",
        "name": "Insufficient Push-up Depth",
        "category": TechniqueErrorCategory.RANGE_OF_MOTION.value,
        "exercises": ["pushup"],
        "description": "Elbow flexion did not reach approximately 90 degrees at the bottom of the movement.",
        "corrective_instruction": "Lower your chest closer to the floor until your elbows bend to at least 90 degrees.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "PUSHUP_ELBOW_FLARE": {
        "id": "PUSHUP_ELBOW_FLARE",
        "name": "Excessive Elbow Flare",
        "category": TechniqueErrorCategory.ALIGNMENT.value,
        "exercises": ["pushup"],
        "description": "Elbows flared outwards away from the ribcage at an angle greater than 70-80 degrees relative to torso.",
        "corrective_instruction": "Tuck your elbows to approximately 45 degrees relative to your torso for better joint mechanics.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.75
    },
    "PUSHUP_ASYMMETRIC_PRESS": {
        "id": "PUSHUP_ASYMMETRIC_PRESS",
        "name": "Asymmetric Pressing",
        "category": TechniqueErrorCategory.SYMMETRY.value,
        "exercises": ["pushup"],
        "description": "Unequal elbow extension rates between left and right arms during the pressing phase.",
        "corrective_instruction": "Push through both palms simultaneously with equal force.",
        "default_severity": Severity.MILD.value,
        "confidence_threshold": 0.80
    },

    # --- Bicep Curl Errors ---
    "BICEP_CURL_ELBOW_DRIFT": {
        "id": "BICEP_CURL_ELBOW_DRIFT",
        "name": "Upper Arm / Elbow Drift",
        "category": TechniqueErrorCategory.STABILITY.value,
        "exercises": ["bicep_curl"],
        "description": "Elbow moved forward or backward excessively from the side of the ribcage during the curl.",
        "corrective_instruction": "Keep your upper arms pinned steadily against the sides of your torso.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "BICEP_CURL_TORSO_MOMENTUM": {
        "id": "BICEP_CURL_TORSO_MOMENTUM",
        "name": "Torso Swing / Momentum Compensation",
        "category": TechniqueErrorCategory.STABILITY.value,
        "exercises": ["bicep_curl"],
        "description": "Torso rocked backward during the concentric phase to use momentum rather than isolated bicep contraction.",
        "corrective_instruction": "Keep your upper body completely still without leaning back to swing the weight.",
        "default_severity": Severity.SEVERE.value,
        "confidence_threshold": 0.85
    },
    "BICEP_CURL_INCOMPLETE_ROM": {
        "id": "BICEP_CURL_INCOMPLETE_ROM",
        "name": "Incomplete Range of Motion",
        "category": TechniqueErrorCategory.RANGE_OF_MOTION.value,
        "exercises": ["bicep_curl"],
        "description": "Arms were not fully extended at the bottom or fully flexed at the top of the curl.",
        "corrective_instruction": "Fully extend your arms at the bottom and curl all the way to full contraction.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "BICEP_CURL_RAPID_DROP": {
        "id": "BICEP_CURL_RAPID_DROP",
        "name": "Uncontrolled Eccentric Drop",
        "category": TechniqueErrorCategory.TEMPO.value,
        "exercises": ["bicep_curl"],
        "description": "Weight was dropped rapidly during the lowering phase without controlled eccentric resistance.",
        "corrective_instruction": "Lower the weight with control over 2 full seconds.",
        "default_severity": Severity.MILD.value,
        "confidence_threshold": 0.80
    },

    # --- Shoulder Press Errors ---
    "SHOULDER_PRESS_INCOMPLETE_LOCKOUT": {
        "id": "SHOULDER_PRESS_INCOMPLETE_LOCKOUT",
        "name": "Incomplete Overhead Lockout",
        "category": TechniqueErrorCategory.RANGE_OF_MOTION.value,
        "exercises": ["shoulder_press"],
        "description": "Elbows did not achieve full extension at the top of the overhead press.",
        "corrective_instruction": "Press straight overhead until your arms are fully extended and stable.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "SHOULDER_PRESS_LUMBAR_HYPEREXTENSION": {
        "id": "SHOULDER_PRESS_LUMBAR_HYPEREXTENSION",
        "name": "Excessive Lower Back Arching",
        "category": TechniqueErrorCategory.POSTURE.value,
        "exercises": ["shoulder_press"],
        "description": "Torso leaned backward excessively during the overhead press, shifting load into lumbar hyperextension.",
        "corrective_instruction": "Brace your abdominal muscles and glutes to keep your spine neutral throughout the press.",
        "default_severity": Severity.SEVERE.value,
        "confidence_threshold": 0.85
    },
    "SHOULDER_PRESS_ASYMMETRIC_PRESS": {
        "id": "SHOULDER_PRESS_ASYMMETRIC_PRESS",
        "name": "Asymmetric Overhead Press",
        "category": TechniqueErrorCategory.SYMMETRY.value,
        "exercises": ["shoulder_press"],
        "description": "One arm locked out significantly earlier or higher than the other arm.",
        "corrective_instruction": "Press both arms upward with equal speed and coordinate the lockout simultaneously.",
        "default_severity": Severity.MODERATE.value,
        "confidence_threshold": 0.80
    },
    "SHOULDER_PRESS_RAPID_DROP": {
        "id": "SHOULDER_PRESS_RAPID_DROP",
        "name": "Rapid Lowering from Overhead",
        "category": TechniqueErrorCategory.TEMPO.value,
        "exercises": ["shoulder_press"],
        "description": "Descent from overhead lockout to shoulder rack was rushed without eccentric control.",
        "corrective_instruction": "Lower the weight smoothly back to shoulder height under control.",
        "default_severity": Severity.MILD.value,
        "confidence_threshold": 0.80
    },
}


def get_errors_for_exercise(exercise_slug: str) -> List[Dict[str, Any]]:
    return [err for err in ERROR_TAXONOMY.values() if exercise_slug in err["exercises"]]
