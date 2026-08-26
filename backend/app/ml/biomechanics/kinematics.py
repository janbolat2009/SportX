import numpy as np
from typing import List, Dict, Any, Optional


class KinematicsTracker:
    """
    Tracks kinematic variables (angles, velocities, accelerations, and trajectory smoothness)
    over a rolling temporal window.
    """
    def __init__(self, window_size: int = 15):
        self.window_size = window_size
        self.timestamps: List[float] = []
        self.angles_history: Dict[str, List[float]] = {}

    def update(self, timestamp: float, angles: Dict[str, float]) -> Dict[str, float]:
        """
        Updates history with new angles and returns derived kinematic features:
        - angular velocities (deg/s)
        - angular accelerations (deg/s^2)
        - movement smoothness index
        """
        self.timestamps.append(timestamp)
        if len(self.timestamps) > self.window_size:
            self.timestamps.pop(0)

        kinematics: Dict[str, float] = {}

        for key, val in angles.items():
            if key not in self.angles_history:
                self.angles_history[key] = []
            self.angles_history[key].append(val)
            if len(self.angles_history[key]) > self.window_size:
                self.angles_history[key].pop(0)

            # Compute 1st derivative (velocity)
            if len(self.timestamps) >= 2 and len(self.angles_history[key]) >= 2:
                dt = self.timestamps[-1] - self.timestamps[-2]
                if dt > 1e-4:
                    vel = (self.angles_history[key][-1] - self.angles_history[key][-2]) / dt
                    kinematics[f"{key}_velocity"] = round(float(vel), 2)
                else:
                    kinematics[f"{key}_velocity"] = 0.0
            else:
                kinematics[f"{key}_velocity"] = 0.0

            # Compute 2nd derivative (acceleration)
            if len(self.timestamps) >= 3 and len(self.angles_history[key]) >= 3:
                dt1 = self.timestamps[-1] - self.timestamps[-2]
                dt2 = self.timestamps[-2] - self.timestamps[-3]
                if dt1 > 1e-4 and dt2 > 1e-4:
                    v1 = (self.angles_history[key][-1] - self.angles_history[key][-2]) / dt1
                    v2 = (self.angles_history[key][-2] - self.angles_history[key][-3]) / dt2
                    acc = (v1 - v2) / ((dt1 + dt2) / 2.0)
                    kinematics[f"{key}_acceleration"] = round(float(acc), 2)
                else:
                    kinematics[f"{key}_acceleration"] = 0.0
            else:
                kinematics[f"{key}_acceleration"] = 0.0

        # Movement smoothness: variance of primary angle velocity
        primary_vel_key = "avg_knee_angle_velocity" if "avg_knee_angle_velocity" in kinematics else (
            "avg_elbow_angle_velocity" if "avg_elbow_angle_velocity" in kinematics else None
        )
        if primary_vel_key and len(self.angles_history.get("avg_knee_angle", self.angles_history.get("avg_elbow_angle", []))) >= 5:
            # lower variance means smoother trajectory
            diffs = np.diff(self.angles_history.get("avg_knee_angle", self.angles_history.get("avg_elbow_angle", [])))
            smoothness_penalty = float(np.std(diffs))
            kinematics["smoothness_index"] = max(0.0, round(100.0 - (smoothness_penalty * 5.0), 1))
        else:
            kinematics["smoothness_index"] = 90.0

        return kinematics
