import numpy as np
from typing import List, Dict, Any, Tuple
import math


CLASS_NAMES = [
    "Correct Form",
    "Alignment Deviation",
    "Range of Motion Deviation",
    "Posture / Lean Deviation",
    "Tempo / Momentum Deviation"
]


def generate_synthetic_exercise_dataset(
    n_samples: int = 500,
    n_subjects: int = 30,
    frames_per_rep: int = 30,
    random_seed: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[str]]:
    """
    Generates a reproducible, scientifically calibrated synthetic dataset of kinematic
    exercise trajectories with subject-level IDs, controlled noise, and ground-truth technique labels.
    
    Returns:
    - X_tabular: (n_samples, n_features) - Feature vectors for classical ML
    - X_temporal: (n_samples, frames_per_rep, n_channels) - Sequence windows for LSTM/CNN
    - y: (n_samples,) - Integer class labels (0 to 4)
    - subject_ids: List of subject string identifiers (e.g. 'SUBJ_001')
    """
    np.random.seed(random_seed)
    
    # Generate unique subject profiles (anthropometric height factor, intrinsic asymmetry)
    subjects = []
    for i in range(n_subjects):
        subjects.append({
            "id": f"SUBJ_{i+1:03d}",
            "height_factor": np.random.uniform(0.9, 1.1),
            "baseline_symmetry": np.random.uniform(0.95, 1.0),
            "speed_factor": np.random.uniform(0.85, 1.15)
        })

    X_tabular_list = []
    X_temporal_list = []
    y_list = []
    subject_id_list = []

    t_norm = np.linspace(0, np.pi * 2, frames_per_rep)

    for i in range(n_samples):
        # Assign subject
        subj = subjects[i % n_subjects]
        subject_id_list.append(subj["id"])

        # Determine technique class
        # 0: Correct, 1: Alignment, 2: ROM, 3: Posture/Lean, 4: Tempo
        label = np.random.choice([0, 1, 2, 3, 4], p=[0.35, 0.20, 0.20, 0.15, 0.10])
        y_list.append(label)

        # Baseline kinematic trajectory (e.g. knee angle sinusoidal cycle 160 -> min_depth -> 160)
        target_min_angle = 80.0 if label != 2 else np.random.uniform(105.0, 125.0)  # ROM error
        knee_amplitude = (165.0 - target_min_angle) / 2.0
        knee_offset = (165.0 + target_min_angle) / 2.0
        
        # Knee angle curve
        knee_angles = knee_offset + knee_amplitude * np.cos(t_norm)

        # Hip angle curve
        hip_angles = 170.0 - (165.0 - knee_angles) * 0.75

        # Torso angle
        if label == 3:  # Excessive forward lean
            torso_angles = np.random.uniform(48.0, 62.0, frames_per_rep)
        else:
            torso_angles = np.random.uniform(15.0, 32.0, frames_per_rep) + 5.0 * np.sin(t_norm / 2.0)

        # Left vs Right Knee disparity (Alignment / Symmetry / Valgus error)
        if label == 1:
            valgus_disparity = np.random.uniform(18.0, 30.0, frames_per_rep) * np.sin(t_norm / 2.0)
            left_knee = knee_angles + valgus_disparity
            right_knee = knee_angles - valgus_disparity * 0.5
        else:
            jitter = np.random.normal(0, 1.5, frames_per_rep)
            left_knee = knee_angles + jitter
            right_knee = knee_angles - jitter

        # Elbow angle (for secondary exercises / full body kinematics)
        elbow_angles = 160.0 - 20.0 * np.sin(t_norm)

        # Add realistic sensor noise (MediaPipe landmark jitter)
        left_knee += np.random.normal(0, 1.2, frames_per_rep)
        right_knee += np.random.normal(0, 1.2, frames_per_rep)
        hip_angles += np.random.normal(0, 1.5, frames_per_rep)
        torso_angles += np.random.normal(0, 1.0, frames_per_rep)

        # Compute angular velocities
        dt = (3.0 * subj["speed_factor"]) / frames_per_rep
        if label == 4:  # Rapid / erratic tempo
            dt = (1.2 * subj["speed_factor"]) / frames_per_rep
            
        knee_vel = np.gradient(knee_angles, dt)
        hip_vel = np.gradient(hip_angles, dt)

        # Symmetry trajectory
        max_knee = np.maximum(np.abs(left_knee), np.abs(right_knee))
        symmetry_traj = np.maximum(0.0, 100.0 - (np.abs(left_knee - right_knee) / np.maximum(max_knee, 1.0) * 100.0))

        # Temporal sequence matrix: (frames_per_rep, 8 channels)
        seq = np.column_stack([
            left_knee,
            right_knee,
            hip_angles,
            torso_angles,
            elbow_angles,
            knee_vel,
            hip_vel,
            symmetry_traj
        ])
        X_temporal_list.append(seq)

        # Tabular engineered features (18 statistical kinematic descriptors):
        features = [
            float(np.mean(left_knee)),
            float(np.min(left_knee)),
            float(np.max(left_knee)),
            float(np.std(left_knee)),
            float(np.mean(right_knee)),
            float(np.min(right_knee)),
            float(np.max(right_knee)),
            float(np.mean(hip_angles)),
            float(np.min(hip_angles)),
            float(np.mean(torso_angles)),
            float(np.max(torso_angles)),
            float(np.mean(symmetry_traj)),
            float(np.min(symmetry_traj)),
            float(np.max(np.abs(knee_vel))),
            float(np.mean(np.abs(knee_vel))),
            float(np.std(knee_vel)),
            float(np.max(left_knee) - np.min(left_knee)),  # ROM
            float(np.max(right_knee) - np.min(right_knee))  # ROM
        ]
        X_tabular_list.append(features)

    return (
        np.array(X_tabular_list, dtype=np.float32),
        np.array(X_temporal_list, dtype=np.float32),
        np.array(y_list, dtype=np.int64),
        subject_id_list
    )
