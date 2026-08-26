from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import time
from app.ml.biomechanics.geometry import extract_key_joint_angles, PoseLandmark
from app.ml.biomechanics.normalization import normalize_landmarks_body_relative, check_landmarks_visibility
from app.ml.biomechanics.kinematics import KinematicsTracker
from app.ml.biomechanics.symmetry import compute_frame_symmetry
from app.ml.biomechanics.noise_filter import LandmarkSmoother
from app.ml.taxonomy import ERROR_TAXONOMY


class BaseExerciseAnalyzer(ABC):
    """
    Abstract Base Class for all biomechanical exercise analyzers.
    Maintains a deterministic state machine for phase detection, rep segmentation,
    dynamic error detection, and score accumulation.
    """
    def __init__(self, exercise_slug: str, required_landmarks: List[PoseLandmark]):
        self.exercise_slug = exercise_slug
        self.required_landmarks = required_landmarks
        
        self.smoother = LandmarkSmoother(alpha=0.65)
        self.kinematics_tracker = KinematicsTracker(window_size=15)
        
        # State machine variables
        self.current_phase = "IDLE"
        self.rep_count = 0
        self.completed_repetitions: List[Dict[str, Any]] = []
        self.session_issues: List[Dict[str, Any]] = []
        
        # Current rep tracking
        self.rep_start_time: float = 0.0
        self.rep_frame_indices: List[int] = []
        self.rep_angles_history: List[Dict[str, float]] = []
        self.rep_phase_durations: Dict[str, float] = {}
        self.phase_start_time: float = 0.0
        self.rep_errors: List[Dict[str, Any]] = []
        
        # Session metrics
        self.total_frames_processed = 0

    def reset(self):
        self.smoother.reset()
        self.current_phase = "IDLE"
        self.rep_count = 0
        self.completed_repetitions = []
        self.session_issues = []
        self.rep_start_time = 0.0
        self.rep_frame_indices = []
        self.rep_angles_history = []
        self.rep_phase_durations = {}
        self.phase_start_time = 0.0
        self.rep_errors = []
        self.total_frames_processed = 0

    def set_phase(self, new_phase: str, timestamp: float):
        if self.current_phase != new_phase:
            if self.phase_start_time > 0:
                duration = max(0.0, timestamp - self.phase_start_time)
                self.rep_phase_durations[self.current_phase] = self.rep_phase_durations.get(self.current_phase, 0.0) + duration
            self.current_phase = new_phase
            self.phase_start_time = timestamp

    def add_error_if_new(self, error_code: str, timestamp: float, severity_override: Optional[str] = None):
        tax_entry = ERROR_TAXONOMY.get(error_code)
        if not tax_entry:
            return
        
        # Avoid duplicate errors in the same repetition
        existing = [e for e in self.rep_errors if e["error_code"] == error_code]
        if not existing:
            err = {
                "error_code": error_code,
                "error_name": tax_entry["name"],
                "severity": severity_override or tax_entry["default_severity"],
                "confidence": tax_entry["confidence_threshold"],
                "description": tax_entry["description"],
                "corrective_instruction": tax_entry["corrective_instruction"],
                "timestamp": timestamp
            }
            self.rep_errors.append(err)
            self.session_issues.append(err)

    @abstractmethod
    def process_frame(
        self,
        frame_index: int,
        timestamp: float,
        raw_landmarks: List[Dict[str, float]]
    ) -> Dict[str, Any]:
        """
        Processes a single video/camera frame and updates the state machine.
        """
        pass

    @abstractmethod
    def finalize_repetition(self, end_timestamp: float) -> Dict[str, Any]:
        """
        Calculates biomechanical scores, ROM, symmetry, and error summary for a completed rep.
        """
        pass
