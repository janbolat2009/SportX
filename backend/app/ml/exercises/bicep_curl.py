import numpy as np
from typing import List, Dict, Any, Optional
from app.ml.exercises.base_analyzer import BaseExerciseAnalyzer
from app.ml.biomechanics.geometry import extract_key_joint_angles, PoseLandmark
from app.ml.biomechanics.normalization import normalize_landmarks_body_relative, check_landmarks_visibility
from app.ml.biomechanics.symmetry import calculate_bilateral_symmetry


class BicepCurlAnalyzer(BaseExerciseAnalyzer):
    """
    Biomechanical analyzer for Bicep Curls.
    Monitors elbow flexion range of motion, upper arm / elbow stability, torso momentum swing, and lowering tempo.
    """
    def __init__(self):
        super().__init__(
            exercise_slug="bicep_curl",
            required_landmarks=[
                PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
                PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
                PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
                PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP
            ]
        )
        self.extension_angle_thresh = 145.0
        self.curl_trigger_thresh = 135.0
        self.peak_contraction_thresh = 60.0
        self.min_elbow_angle_in_rep = 180.0
        self.max_elbow_angle_in_rep = 0.0
        self.initial_torso_angle = 0.0
        self.max_torso_displacement = 0.0

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
                "detected_issue": "Arms or torso out of camera view",
                "corrective_instruction": "Position upper body and arms clearly in camera view.",
                "rep_completed": False
            }

        smoothed = self.smoother.smooth(raw_landmarks)
        normalized = normalize_landmarks_body_relative(smoothed)
        angles = extract_key_joint_angles(smoothed)
        kinematics = self.kinematics_tracker.update(timestamp, angles)

        avg_elbow = angles.get("avg_elbow_angle", 180.0)
        l_elbow = angles.get("left_elbow_angle", 180.0)
        r_elbow = angles.get("right_elbow_angle", 180.0)
        torso_angle = angles.get("torso_angle", 0.0)
        arm_sym = calculate_bilateral_symmetry(l_elbow, r_elbow)

        # Upper arm drift (shoulder-elbow angle)
        avg_shoulder_angle = (angles.get("left_shoulder_angle", 0.0) + angles.get("right_shoulder_angle", 0.0)) / 2.0
        if avg_shoulder_angle > 35.0:
            self.add_error_if_new("BICEP_CURL_ELBOW_DRIFT", timestamp)

        # Torso momentum check
        torso_displacement = abs(torso_angle - self.initial_torso_angle)
        if torso_displacement > 14.0 and avg_elbow < 130.0:
            self.add_error_if_new("BICEP_CURL_TORSO_MOMENTUM", timestamp)

        rep_completed = False
        completed_rep_data = None

        if self.current_phase == "IDLE" or self.current_phase == "EXTENSION":
            if avg_elbow >= self.extension_angle_thresh:
                self.set_phase("EXTENSION", timestamp)
                self.initial_torso_angle = torso_angle
            elif avg_elbow < self.curl_trigger_thresh:
                self.set_phase("CONCENTRIC_CURL", timestamp)
                self.rep_start_time = timestamp
                self.rep_frame_indices = [frame_index]
                self.rep_angles_history = [angles]
                self.rep_errors = []
                self.min_elbow_angle_in_rep = avg_elbow
                self.max_elbow_angle_in_rep = avg_elbow
                self.max_torso_displacement = 0.0

        elif self.current_phase == "CONCENTRIC_CURL":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_elbow_angle_in_rep = min(self.min_elbow_angle_in_rep, avg_elbow)
            self.max_torso_displacement = max(self.max_torso_displacement, torso_displacement)

            if avg_elbow <= self.peak_contraction_thresh:
                self.set_phase("PEAK_CONTRACTION", timestamp)
            elif kinematics.get("avg_elbow_angle_velocity", 0.0) > 15.0 and avg_elbow > self.min_elbow_angle_in_rep + 6.0:
                self.set_phase("ECCENTRIC_LOWER", timestamp)

        elif self.current_phase == "PEAK_CONTRACTION":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.min_elbow_angle_in_rep = min(self.min_elbow_angle_in_rep, avg_elbow)

            if kinematics.get("avg_elbow_angle_velocity", 0.0) > 10.0 or avg_elbow > self.min_elbow_angle_in_rep + 8.0:
                self.set_phase("ECCENTRIC_LOWER", timestamp)

        elif self.current_phase == "ECCENTRIC_LOWER":
            self.rep_frame_indices.append(frame_index)
            self.rep_angles_history.append(angles)
            self.max_elbow_angle_in_rep = max(self.max_elbow_angle_in_rep, avg_elbow)

            if avg_elbow >= self.extension_angle_thresh:
                self.set_phase("EXTENSION", timestamp)
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

        instant_score = max(50.0, 100.0 - (len(self.rep_errors) * 15.0) - max(0.0, (avg_shoulder_angle - 25.0) * 1.5))

        return {
            "exercise": self.exercise_slug,
            "phase": self.current_phase,
            "current_rep": self.rep_count,
            "instantaneous_score": round(instant_score, 1),
            "primary_joint_angle": round(avg_elbow, 1),
            "secondary_joint_angle": round(avg_shoulder_angle, 1),
            "symmetry_ratio": arm_sym,
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
        eccentric_dur = self.rep_phase_durations.get("ECCENTRIC_LOWER", 0.0)

        if self.min_elbow_angle_in_rep > 65.0 or self.max_elbow_angle_in_rep < 135.0:
            self.add_error_if_new("BICEP_CURL_INCOMPLETE_ROM", end_timestamp)

        if eccentric_dur > 0 and eccentric_dur < 0.7:
            self.add_error_if_new("BICEP_CURL_RAPID_DROP", end_timestamp)

        rom_score = max(0.0, min(100.0, 100.0 - max(0.0, (self.min_elbow_angle_in_rep - 50.0) * 1.8)))
        align_score = max(40.0, 100.0 - (self.max_torso_displacement * 3.0))
        
        symmetry_scores = [calculate_bilateral_symmetry(a.get("left_elbow_angle", 180.0), a.get("right_elbow_angle", 180.0)) for a in self.rep_angles_history]
        sym_score = float(np.mean(symmetry_scores)) if symmetry_scores else 90.0

        tempo_score = 90.0
        if duration < 1.4:
            tempo_score -= 25.0
        elif duration > 5.0:
            tempo_score -= 10.0

        stability_score = max(50.0, 100.0 - (len(self.rep_errors) * 12.0))

        rep_score = round(
            0.25 * align_score +
            0.30 * rom_score +
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
            "peak_angle": round(self.max_elbow_angle_in_rep, 1),
            "min_angle": round(self.min_elbow_angle_in_rep, 1),
            "is_valid": rep_score >= 50.0 and self.min_elbow_angle_in_rep <= 80.0,
            "phase_durations": {k: round(v, 2) for k, v in self.rep_phase_durations.items()},
            "detected_errors": list(self.rep_errors)
        }

        self.completed_repetitions.append(rep_data)
        return rep_data
