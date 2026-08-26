import numpy as np
from typing import List, Dict, Any, Optional
from app.ml.exercises.base_analyzer import BaseExerciseAnalyzer
from app.ml.biomechanics.geometry import extract_key_joint_angles, PoseLandmark
from app.ml.biomechanics.normalization import normalize_landmarks_body_relative, check_landmarks_visibility
from app.ml.biomechanics.symmetry import calculate_bilateral_symmetry


class PushupAnalyzer(BaseExerciseAnalyzer):
    """
    Biomechanical analyzer for Push-ups.
    Monitors elbow flexion depth, plank hip alignment (sag vs. pike), elbow flare, and bilateral pressing symmetry.
    """
    def __init__(self):
        super().__init__(
            exercise_slug="pushup",
            required_landmarks=[
                PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
                PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
                PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
                PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
                PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE
            ]
        )
        self.plank_angle_thresh = 150.0
        self.descent_trigger_thresh = 140.0
        self.bottom_depth_thresh = 95.0
        self.min_elbow_angle_in_rep = 180.0
        self.min_body_line_in_rep = 180.0

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
                "secondary_joint_angle": 180.0,
                "symmetry_ratio": 100.0,
                "torso_angle": 0.0,
                "is_in_frame": False,
                "confidence": confidence,
                "detected_issue": "Body parts out of camera view",
                "corrective_instruction": "Position full body from head to toes in side-view camera frame.",
                "rep_completed": False
            }

        smoothed = self.smoother.smooth(raw_landmarks)
        normalized = normalize_landmarks_body_relative(smoothed)
        angles = extract_key_joint_angles(smoothed)
        kinematics = self.kinematics_tracker.update(timestamp, angles)

        avg_elbow = angles.get("avg_elbow_angle", 180.0)
        l_elbow = angles.get("left_elbow_angle", 180.0)
        r_elbow = angles.get("right_elbow_angle", 180.0)
        avg_body_line = angles.get("avg_body_line", 180.0)
        elbow_sym = calculate_bilateral_symmetry(l_elbow, r_elbow)

        # Check plank alignment: Shoulder-Hip-Ankle line
        if avg_body_line < 155.0:
            # Check if hip is sagging or piking
            l_sh = normalized[PoseLandmark.LEFT_SHOULDER.value]
            l_hip = normalized[PoseLandmark.LEFT_HIP.value]
            l_ank = normalized[PoseLandmark.LEFT_ANKLE.value]
            
            # Expected hip y on line
            expected_y = (l_sh["y"] + l_ank["y"]) / 2.0
            if l_hip["y"] > expected_y:  # screen coords y downwards
                self.add_error_if_new("PUSHUP_HIP_SAG", timestamp)
            else:
                self.add_error_if_new("PUSHUP_HIP_PIKE", timestamp)

        # Check elbow flare (shoulder angle relative to torso)
        avg_shoulder = (angles.get("left_shoulder_angle", 45.0) + angles.get("right_shoulder_angle", 45.0)) / 2.0
        if avg_shoulder > 75.0:
            self.add_error_if_new("PUSHUP_ELBOW_FLARE", timestamp)

        rep_completed = False
        completed_rep_data = None

        if self.current_phase == "IDLE" or self.current_phase == "PLANK_TOP":
            if avg_elbow >= self.plank_angle_thresh:
                self.set_phase("PLANK_TOP", timestamp)
            elif avg_elbow < self.descent_trigger_thresh:
                self.set_phase("DESCENT", timestamp)
                self.rep_start_time = timestamp
                self.rep_frame_indices = [frame_index]
                self.rep_angles_history = [angles]
                self.rep_errors = []
                self.min_elbow_angle_in_rep = avg_elbow
                self.min_body_line_in_rep = avg_body_line

        elif self.current_phase == "DESCENT":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_elbow_angle_in_rep = min(self.min_elbow_angle_in_rep, avg_elbow)
            self.min_body_line_in_rep = min(self.min_body_line_in_rep, avg_body_line)

            if abs(l_elbow - r_elbow) > 16.0:
                self.add_error_if_new("PUSHUP_ASYMMETRIC_PRESS", timestamp)

            if avg_elbow <= self.bottom_depth_thresh:
                self.set_phase("BOTTOM", timestamp)
            elif kinematics.get("avg_elbow_angle_velocity", 0.0) > 15.0 and avg_elbow > self.min_elbow_angle_in_rep + 6.0:
                self.set_phase("ASCENT", timestamp)

        elif self.current_phase == "BOTTOM":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_elbow_angle_in_rep = min(self.min_elbow_angle_in_rep, avg_elbow)

            if kinematics.get("avg_elbow_angle_velocity", 0.0) > 10.0 or avg_elbow > self.min_elbow_angle_in_rep + 8.0:
                self.set_phase("ASCENT", timestamp)

        elif self.current_phase == "ASCENT":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)

            if avg_elbow >= self.plank_angle_thresh:
                self.set_phase("PLANK_TOP", timestamp)
                completed_rep_data = self.finalize_repetition(timestamp)
                rep_completed = True

        current_issue = None
        current_instruction = None
        current_severity = None
        if self.rep_errors:
            active_err = self.rep_errors[-1]
            current_issue = active_err["error_name"]
            current_instruction = active_err["corrective_instruction"]
            current_severity = active_err["severity"]

        instant_score = max(50.0, 100.0 - (len(self.rep_errors) * 15.0) - max(0.0, (170.0 - avg_body_line) * 0.8))

        return {
            "exercise": self.exercise_slug,
            "phase": self.current_phase,
            "current_rep": self.rep_count,
            "instantaneous_score": round(instant_score, 1),
            "primary_joint_angle": round(avg_elbow, 1),
            "secondary_joint_angle": round(avg_body_line, 1),
            "symmetry_ratio": elbow_sym,
            "torso_angle": round(angles.get("torso_angle", 0.0), 1),
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

        if self.min_elbow_angle_in_rep > 95.0:
            self.add_error_if_new("PUSHUP_INSUFFICIENT_DEPTH", end_timestamp)

        rom_score = max(0.0, min(100.0, 100.0 - max(0.0, (self.min_elbow_angle_in_rep - 85.0) * 2.0)))
        align_score = max(40.0, 100.0 - max(0.0, (175.0 - self.min_body_line_in_rep) * 1.5))
        
        symmetry_scores = [calculate_bilateral_symmetry(a.get("left_elbow_angle", 180.0), a.get("right_elbow_angle", 180.0)) for a in self.rep_angles_history]
        sym_score = float(np.mean(symmetry_scores)) if symmetry_scores else 90.0

        tempo_score = 90.0
        if duration < 1.5:
            tempo_score -= 20.0
        elif duration > 5.0:
            tempo_score -= 15.0

        stability_score = max(50.0, 100.0 - (len(self.rep_errors) * 12.0))

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
            "min_angle": round(self.min_elbow_angle_in_rep, 1),
            "is_valid": rep_score >= 50.0 and self.min_elbow_angle_in_rep <= 110.0,
            "phase_durations": {k: round(v, 2) for k, v in self.rep_phase_durations.items()},
            "detected_errors": list(self.rep_errors)
        }

        self.completed_repetitions.append(rep_data)
        return rep_data
