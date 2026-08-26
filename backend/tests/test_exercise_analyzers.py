import pytest
import numpy as np
from app.ml.exercises.squat import SquatAnalyzer
from app.ml.exercises.pushup import PushupAnalyzer
from app.ml.exercises.bicep_curl import BicepCurlAnalyzer
from app.ml.exercises.shoulder_press import ShoulderPressAnalyzer


def _create_squat_landmarks(knee_angle_deg=170.0, valgus=False):
    lms = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.95} for _ in range(33)]
    lms[11] = {"x": 0.42, "y": 0.20, "z": 0.0, "visibility": 0.95}
    lms[12] = {"x": 0.58, "y": 0.20, "z": 0.0, "visibility": 0.95}
    lms[23] = {"x": 0.45, "y": 0.40, "z": 0.0, "visibility": 0.95}
    lms[24] = {"x": 0.55, "y": 0.40, "z": 0.0, "visibility": 0.95}
    
    knee_y = 0.65
    lms[25] = {"x": 0.45, "y": knee_y, "z": 0.0, "visibility": 0.95}
    lms[26] = {"x": 0.55, "y": knee_y, "z": 0.0, "visibility": 0.95}
    
    flexion_rad = np.radians(180.0 - knee_angle_deg)
    L = 0.25
    ank_l_x = 0.45 + L * np.sin(flexion_rad)
    ank_r_x = 0.55 - L * np.sin(flexion_rad)
    ank_y = knee_y + L * np.cos(flexion_rad)

    lms[27] = {"x": ank_l_x, "y": ank_y, "z": 0.0, "visibility": 0.95}
    lms[28] = {"x": ank_r_x, "y": ank_y, "z": 0.0, "visibility": 0.95}
    return lms


def _create_pushup_landmarks(elbow_angle_deg=165.0):
    lms = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.95} for _ in range(33)]
    lms[11] = {"x": 0.40, "y": 0.30, "z": 0.0, "visibility": 0.95}
    lms[12] = {"x": 0.60, "y": 0.30, "z": 0.0, "visibility": 0.95}
    
    elbow_y = 0.50
    lms[13] = {"x": 0.40, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    lms[14] = {"x": 0.60, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    
    flexion_rad = np.radians(180.0 - elbow_angle_deg)
    L = 0.20
    lms[15] = {"x": 0.40 + L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    lms[16] = {"x": 0.60 - L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    
    lms[23] = {"x": 0.45, "y": 0.65, "z": 0.0, "visibility": 0.95}
    lms[24] = {"x": 0.55, "y": 0.65, "z": 0.0, "visibility": 0.95}
    lms[27] = {"x": 0.45, "y": 0.90, "z": 0.0, "visibility": 0.95}
    lms[28] = {"x": 0.55, "y": 0.90, "z": 0.0, "visibility": 0.95}
    return lms


def _create_curl_landmarks(elbow_angle_deg=160.0):
    lms = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.95} for _ in range(33)]
    lms[11] = {"x": 0.40, "y": 0.30, "z": 0.0, "visibility": 0.95}
    lms[12] = {"x": 0.60, "y": 0.30, "z": 0.0, "visibility": 0.95}
    
    elbow_y = 0.50
    lms[13] = {"x": 0.40, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    lms[14] = {"x": 0.60, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    
    flexion_rad = np.radians(180.0 - elbow_angle_deg)
    L = 0.20
    lms[15] = {"x": 0.40 + L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    lms[16] = {"x": 0.60 - L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    
    lms[23] = {"x": 0.45, "y": 0.70, "z": 0.0, "visibility": 0.95}
    lms[24] = {"x": 0.55, "y": 0.70, "z": 0.0, "visibility": 0.95}
    return lms


def _create_press_landmarks(elbow_angle_deg=80.0):
    lms = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.95} for _ in range(33)]
    lms[11] = {"x": 0.40, "y": 0.30, "z": 0.0, "visibility": 0.95}
    lms[12] = {"x": 0.60, "y": 0.30, "z": 0.0, "visibility": 0.95}
    
    elbow_y = 0.50
    lms[13] = {"x": 0.40, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    lms[14] = {"x": 0.60, "y": elbow_y, "z": 0.0, "visibility": 0.95}
    
    flexion_rad = np.radians(180.0 - elbow_angle_deg)
    L = 0.20
    lms[15] = {"x": 0.40 + L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    lms[16] = {"x": 0.60 - L * np.sin(flexion_rad), "y": elbow_y + L * np.cos(flexion_rad), "z": 0.0, "visibility": 0.95}
    
    lms[23] = {"x": 0.45, "y": 0.70, "z": 0.0, "visibility": 0.95}
    lms[24] = {"x": 0.55, "y": 0.70, "z": 0.0, "visibility": 0.95}
    return lms


def test_squat_analyzer_full_repetition():
    analyzer = SquatAnalyzer()
    rep_counted = False
    
    for i in range(5):
        res = analyzer.process_frame(i, i * 0.1, _create_squat_landmarks(knee_angle_deg=170.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(5, 15):
        angle = 170.0 - (i - 4) * 8.0
        res = analyzer.process_frame(i, i * 0.1, _create_squat_landmarks(knee_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(15, 20):
        res = analyzer.process_frame(i, i * 0.1, _create_squat_landmarks(knee_angle_deg=85.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(20, 30):
        angle = 85.0 + (i - 19) * 8.5
        res = analyzer.process_frame(i, i * 0.1, _create_squat_landmarks(knee_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    final = analyzer.process_frame(30, 3.1, _create_squat_landmarks(knee_angle_deg=170.0))
    if final.get("rep_completed"):
        rep_counted = True

    assert rep_counted is True
    assert analyzer.rep_count == 1


def test_pushup_analyzer_rep_completion():
    analyzer = PushupAnalyzer()
    rep_counted = False

    for i in range(5):
        res = analyzer.process_frame(i, i * 0.1, _create_pushup_landmarks(elbow_angle_deg=165.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(5, 15):
        angle = 165.0 - (i - 4) * 8.0
        res = analyzer.process_frame(i, i * 0.1, _create_pushup_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(15, 20):
        res = analyzer.process_frame(i, i * 0.1, _create_pushup_landmarks(elbow_angle_deg=88.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(20, 30):
        angle = 88.0 + (i - 19) * 8.5
        res = analyzer.process_frame(i, i * 0.1, _create_pushup_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    final = analyzer.process_frame(30, 3.1, _create_pushup_landmarks(elbow_angle_deg=165.0))
    if final.get("rep_completed"):
        rep_counted = True

    assert rep_counted is True
    assert analyzer.rep_count == 1


def test_bicep_curl_analyzer_rep_completion():
    analyzer = BicepCurlAnalyzer()
    rep_counted = False

    for i in range(5):
        res = analyzer.process_frame(i, i * 0.1, _create_curl_landmarks(elbow_angle_deg=160.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(5, 15):
        angle = 160.0 - (i - 4) * 11.0
        res = analyzer.process_frame(i, i * 0.1, _create_curl_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(15, 20):
        res = analyzer.process_frame(i, i * 0.1, _create_curl_landmarks(elbow_angle_deg=50.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(20, 30):
        angle = 50.0 + (i - 19) * 11.0
        res = analyzer.process_frame(i, i * 0.1, _create_curl_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    final = analyzer.process_frame(30, 3.1, _create_curl_landmarks(elbow_angle_deg=160.0))
    if final.get("rep_completed"):
        rep_counted = True

    assert rep_counted is True
    assert analyzer.rep_count == 1


def test_shoulder_press_analyzer_rep_completion():
    analyzer = ShoulderPressAnalyzer()
    rep_counted = False

    for i in range(5):
        res = analyzer.process_frame(i, i * 0.1, _create_press_landmarks(elbow_angle_deg=80.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(5, 15):
        angle = 80.0 + (i - 4) * 9.0
        res = analyzer.process_frame(i, i * 0.1, _create_press_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(15, 20):
        res = analyzer.process_frame(i, i * 0.1, _create_press_landmarks(elbow_angle_deg=168.0))
        if res.get("rep_completed"):
            rep_counted = True

    for i in range(20, 30):
        angle = 168.0 - (i - 19) * 9.0
        res = analyzer.process_frame(i, i * 0.1, _create_press_landmarks(elbow_angle_deg=angle))
        if res.get("rep_completed"):
            rep_counted = True

    final = analyzer.process_frame(30, 3.1, _create_press_landmarks(elbow_angle_deg=80.0))
    if final.get("rep_completed"):
        rep_counted = True

    assert rep_counted is True
    assert analyzer.rep_count == 1
