import pytest
import numpy as np
from app.ml.biomechanics.geometry import (
    calculate_angle_2d, calculate_angle_3d, calculate_inclination_to_vertical, extract_key_joint_angles
)
from app.ml.biomechanics.normalization import (
    normalize_landmarks_body_relative, check_landmarks_visibility, flatten_normalized_landmarks
)
from app.ml.biomechanics.kinematics import KinematicsTracker
from app.ml.biomechanics.symmetry import calculate_bilateral_symmetry, compute_frame_symmetry
from app.ml.biomechanics.noise_filter import LandmarkSmoother


def test_angle_2d_orthogonal():
    # 90-degree right angle at (0, 0)
    p1 = (0.0, 1.0)
    p2 = (0.0, 0.0)
    p3 = (1.0, 0.0)
    angle = calculate_angle_2d(p1, p2, p3)
    assert pytest.approx(angle, 0.1) == 90.0


def test_angle_3d_straight_line():
    # 180-degree straight line
    p1 = (0.0, 1.0, 0.0)
    p2 = (0.0, 0.0, 0.0)
    p3 = (0.0, -1.0, 0.0)
    angle = calculate_angle_3d(p1, p2, p3)
    assert pytest.approx(angle, 0.1) == 180.0


def test_inclination_to_vertical():
    # True vertical
    p1 = (0.5, 0.2)
    p2 = (0.5, 0.8)
    inc_vertical = calculate_inclination_to_vertical(p1, p2)
    assert pytest.approx(inc_vertical, 0.1) == 0.0

    # 45-degree inclination
    p1_diag = (0.0, 0.0)
    p2_diag = (1.0, 1.0)
    inc_diag = calculate_inclination_to_vertical(p1_diag, p2_diag)
    assert pytest.approx(inc_diag, 0.5) == 45.0


def test_bilateral_symmetry():
    # Perfect symmetry
    assert calculate_bilateral_symmetry(90.0, 90.0) == 100.0
    # 10% disparity
    assert calculate_bilateral_symmetry(90.0, 81.0) == 90.0
    # Large disparity
    assert calculate_bilateral_symmetry(100.0, 50.0) == 50.0


def test_normalization_scale_invariance():
    # Create 33 mock landmarks at scale 1.0
    landmarks_small = [{"x": 0.5, "y": 0.5 + i * 0.01, "z": 0.0, "visibility": 0.9} for i in range(33)]
    landmarks_small[11] = {"x": 0.4, "y": 0.3, "z": 0.0, "visibility": 0.9} # Shoulder
    landmarks_small[12] = {"x": 0.6, "y": 0.3, "z": 0.0, "visibility": 0.9}
    landmarks_small[23] = {"x": 0.45, "y": 0.6, "z": 0.0, "visibility": 0.9} # Hip
    landmarks_small[24] = {"x": 0.55, "y": 0.6, "z": 0.0, "visibility": 0.9}

    norm_small = normalize_landmarks_body_relative(landmarks_small)

    # Double the scale and shift position
    landmarks_large = [{"x": lm["x"] * 2.0 + 1.0, "y": lm["y"] * 2.0 + 2.0, "z": 0.0, "visibility": 0.9} for lm in landmarks_small]
    norm_large = normalize_landmarks_body_relative(landmarks_large)

    # Relative normalized coordinates should match
    assert pytest.approx(norm_small[11]["x"], 0.05) == norm_large[11]["x"]
    assert pytest.approx(norm_small[11]["y"], 0.05) == norm_large[11]["y"]


def test_kinematics_tracker_derivatives():
    tracker = KinematicsTracker(window_size=10)
    
    # Simulate steady angular velocity of 30 deg/sec
    t0 = 0.0
    angles0 = {"avg_knee_angle": 180.0}
    k0 = tracker.update(t0, angles0)
    
    t1 = 1.0
    angles1 = {"avg_knee_angle": 150.0}
    k1 = tracker.update(t1, angles1)
    
    assert pytest.approx(k1["avg_knee_angle_velocity"], 0.1) == -30.0
