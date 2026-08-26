import numpy as np
from typing import List, Dict, Any, Optional
from app.ml.exercises.base_analyzer import BaseExerciseAnalyzer
from app.ml.biomechanics.geometry import extract_key_joint_angles, PoseLandmark
from app.ml.biomechanics.normalization import normalize_landmarks_body_relative, check_landmarks_visibility
from app.ml.biomechanics.symmetry import calculate_bilateral_symmetry


class SquatAnalyzer(BaseExerciseAnalyzer):
    """
    Biomechanical analyzer for Squats.
    Monitors depth (knee flexion), valgus collapse, torso inclination, descent tempo, and bilateral symmetry.
    """
    def __init__(self):
        super().__init__(
            exercise_slug="squat",
            required_landmarks=[
                PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
                PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE,
                PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE,
                PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER
            ]
        )
        self.standing_angle_thresh = 155.0
        self.descent_trigger_thresh = 145.0
        self.bottom_depth_thresh = 100.0
        self.min_knee_angle_in_rep = 180.0
        self.max_torso_angle_in_rep = 0.0
        self.valgus_detected = False

    def process_frame(
        self,
        frame_index: int,
        timestamp: float,
        raw_landmarks: List[Dict[str, float]]
    ) -> Dict[str, Any]:
        self.total_frames_processed += 1
        
        is_visible, confidence = check_landmarks_visibility(raw_landmarks, self.required_landmarks)
        if not is_visible or confidence < 0.5:
            return {
                "exercise": self.exercise_slug,
                "phase": "CAMERA_OCCLUDED",
                "current_rep": self.rep_count,
                "instantaneous_score": 0.0,
                "primary_joint_angle": 180.0,
                "secondary_joint_angle": 0.0,
                "symmetry_ratio": 100.0,
                "torso_angle": 0.0,
                "is_in_frame": False,
                "confidence": confidence,
                "detected_issue": "Body parts out of camera view",
                "corrective_instruction": "Position full body including knees and ankles clearly in camera frame.",
                "rep_completed": False
            }

        smoothed = self.smoother.smooth(raw_landmarks)
        normalized = normalize_landmarks_body_relative(smoothed)
        angles = extract_key_joint_angles(smoothed)
        kinematics = self.kinematics_tracker.update(timestamp, angles)

        avg_knee = angles.get("avg_knee_angle", 180.0)
        l_knee = angles.get("left_knee_angle", 180.0)
        r_knee = angles.get("right_knee_angle", 180.0)
        torso_angle = angles.get("torso_angle", 0.0)
        knee_sym = calculate_bilateral_symmetry(l_knee, r_knee)

        # Knee Valgus check in normalized frontal plane
        l_knee_pt = normalized[PoseLandmark.LEFT_KNEE.value]
        r_knee_pt = normalized[PoseLandmark.RIGHT_KNEE.value]
        l_ank_pt = normalized[PoseLandmark.LEFT_ANKLE.value]
        r_ank_pt = normalized[PoseLandmark.RIGHT_ANKLE.value]
        
        knee_width = abs(r_knee_pt["x"] - l_knee_pt["x"])
        ankle_width = abs(r_ank_pt["x"] - l_ank_pt["x"])
        
        if ankle_width > 0.15:
            valgus_ratio = knee_width / ankle_width
            if valgus_ratio < 0.72 and avg_knee < 140.0:
                self.valgus_detected = True
                self.add_error_if_new("SQUAT_KNEE_VALGUS", timestamp)

        # State Machine Phase Transitions
        rep_completed = False
        completed_rep_data = None

        if self.current_phase == "IDLE" or self.current_phase == "STANDING":
            if avg_knee >= self.standing_angle_thresh:
                self.set_phase("STANDING", timestamp)
            elif avg_knee < self.descent_trigger_thresh:
                # Begin new rep
                self.set_phase("DESCENT", timestamp)
                self.rep_start_time = timestamp
                self.rep_frame_indices = [frame_index]
                self.rep_angles_history = [angles]
                self.rep_errors = []
                self.min_knee_angle_in_rep = avg_knee
                self.max_torso_angle_in_rep = torso_angle
                self.valgus_detected = False

        elif self.current_phase == "DESCENT":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_knee_angle_in_rep = min(self.min_knee_angle_in_rep, avg_knee)
            self.max_torso_angle_in_rep = max(self.max_torso_angle_in_rep, torso_angle)

            # Check forward lean
            if torso_angle > 45.0:
                self.add_error_if_new("SQUAT_EXCESSIVE_FORWARD_LEAN", timestamp)
            
            # Check asymmetry
            if abs(l_knee - r_knee) > 16.0:
                self.add_error_if_new("SQUAT_ASYMMETRIC_DESCENT", timestamp)

            if avg_knee <= self.bottom_depth_thresh:
                self.set_phase("BOTTOM", timestamp)
            elif kinematics.get("avg_knee_angle_velocity", 0.0) > 15.0 and avg_knee > self.min_knee_angle_in_rep + 5.0:
                # Started ascending without reaching bottom threshold
                self.set_phase("ASCENT", timestamp)

        elif self.current_phase == "BOTTOM":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_knee_angle_in_rep = min(self.min_knee_angle_in_rep, avg_knee)
            self.max_torso_angle_in_rep = max(self.max_torso_angle_in_rep, torso_angle)

            if kinematics.get("avg_knee_angle_velocity", 0.0) > 10.0 or avg_knee > self.min_knee_angle_in_rep + 8.0:
                self.set_phase("ASCENT", timestamp)

        elif self.current_phase == "ASCENT":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.max_torso_angle_in_rep = max(self.max_torso_angle_in_rep, torso_angle)

            if avg_knee >= self.standing_angle_thresh:
                # Repetition completed!
                self.set_phase("STANDING", timestamp)
                completed_rep_data = self.finalize_repetition(timestamp)
                rep_completed = True

        # Compute instantaneous score and active feedback
        current_issue = None
        current_instruction = None
        current_severity = None
        if self.rep_errors:
            active_err = self.rep_errors[-1]
            current_issue = active_err["error_name"]
            current_instruction = active_err["corrective_instruction"]
            current_severity = active_err["severity"]

        instant_score = max(50.0, 100.0 - (len(self.rep_errors) * 15.0) - max(0.0, (torso_angle - 35.0) * 1.5))

        return {
            "exercise": self.exercise_slug,
            "phase": self.current_phase,
            "current_rep": self.rep_count,
            "instantaneous_score": round(instant_score, 1),
            "primary_joint_angle": round(avg_knee, 1),
            "secondary_joint_angle": round(angles.get("avg_hip_angle", 180.0), 1),
            "symmetry_ratio": knee_sym,
            "torso_angle": round(torso_angle, 1),
            "is_in_frame": True,
            "confidence": round(confidence, 2),
            "detected_issue": current_issue,
            "corrective_instruction": current_instruction,
            "severity": current_severity,
            "rep_completed": rep_completed,
            "completed_rep_data": completed_rep_data
        }

    def finalize_repetition(self, end_timestamp: float) -> Dict[str, Any]:
        self.rep_count += 1
        duration = max(0.1, end_timestamp - self.rep_start_time)
        descent_duration = self.rep_phase_durations.get("DESCENT", 0.0)

        # Depth check: if minimum knee flexion angle didn't go below 95 degrees
        if self.min_knee_angle_in_rep > 95.0:
            self.add_error_if_new("SQUAT_INSUFFICIENT_DEPTH", end_timestamp)

        # Tempo check: if descent was under 0.9s
        if descent_duration > 0 and descent_duration < 0.9:
            self.add_error_if_new("SQUAT_RAPID_DESCENT", end_timestamp)

        # Sub-scores
        rom_score = max(0.0, min(100.0, 100.0 - max(0.0, (self.min_knee_angle_in_rep - 85.0) * 2.0)))
        align_score = 100.0
        if self.valgus_detected:
            align_score -= 30.0
        if self.max_torso_angle_in_rep > 40.0:
            align_score -= min(30.0, (self.max_torso_angle_in_rep - 40.0) * 2.0)
        align_score = max(40.0, align_score)

        symmetry_scores = [calculate_bilateral_symmetry(a.get("left_knee_angle", 180.0), a.get("right_knee_angle", 180.0)) for a in self.rep_angles_history]
        sym_score = float(np.mean(symmetry_scores)) if symmetry_scores else 90.0

        tempo_score = 90.0
        if duration < 1.8:
            tempo_score -= 25.0
        elif duration > 5.5:
            tempo_score -= 15.0

        stability_score = max(50.0, 100.0 - (len(self.rep_errors) * 10.0))

        # Overall composite score
        rep_score = round(
            0.30 * align_score +
            0.25 * rom_score +
            0.20 * sym_score +
            0.15 * tempo_score +
            0.10 * stability_score,
            1
        )

        rep_data = {
            "rep_number": self.rep_count,
            "start_time": round(self.rep_start_time, 2),
            "end_time": round(end_timestamp, 2),
            "duration_seconds": round(duration, 2),
            "rep_score": rep_score,
            "alignment_score": round(align_score, 1),
            "rom_score": round(rom_score, 1),
            "symmetry_score": round(sym_score, 1),
            "tempo_score": round(tempo_score, 1),
            "stability_score": round(stability_score, 1),
            "peak_angle": round(180.0, 1),
            "min_angle": round(self.min_knee_angle_in_rep, 1),
            "is_valid": rep_score >= 50.0 and self.min_knee_angle_in_rep <= 115.0,
            "phase_durations": {k: round(v, 2) for k, v in self.rep_phase_durations.items()},
            "detected_errors": list(self.rep_errors)
        }

        self.completed_repetitions.append(rep_data)
        return rep_data
