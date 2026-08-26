import numpy as np
from typing import List, Dict, Any, Optional


class LandmarkSmoother:
    """
    Applies Exponential Moving Average (EMA) smoothing to continuous landmark streams
    to minimize jitter while preserving movement responsiveness.
    """
    def __init__(self, alpha: float = 0.65):
        self.alpha = alpha
        self.smoothed_landmarks: Optional[List[Dict[str, float]]] = None

    def smooth(self, raw_landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
        if not raw_landmarks or len(raw_landmarks) < 33:
            return raw_landmarks

        if self.smoothed_landmarks is None:
            self.smoothed_landmarks = [
                {"x": lm.get("x", 0.0), "y": lm.get("y", 0.0), "z": lm.get("z", 0.0), "visibility": lm.get("visibility", 1.0)}
                for lm in raw_landmarks
            ]
            return self.smoothed_landmarks

        result = []
        for i in range(len(raw_landmarks)):
            curr = raw_landmarks[i]
            prev = self.smoothed_landmarks[i]
            
            # EMA formula: s_t = alpha * x_t + (1 - alpha) * s_{t-1}
            sm_x = self.alpha * curr.get("x", 0.0) + (1.0 - self.alpha) * prev["x"]
            sm_y = self.alpha * curr.get("y", 0.0) + (1.0 - self.alpha) * prev["y"]
            sm_z = self.alpha * curr.get("z", 0.0) + (1.0 - self.alpha) * prev["z"]
            vis = curr.get("visibility", 1.0)
            
            smoothed_lm = {"x": sm_x, "y": sm_y, "z": sm_z, "visibility": vis}
            result.append(smoothed_lm)

        self.smoothed_landmarks = result
        return result

    def reset(self):
        self.smoothed_landmarks = None


def apply_butterworth_smoothing(data: np.ndarray, cutoff: float = 4.0, fs: float = 30.0, order: int = 2) -> np.ndarray:
    """
    Applies zero-phase 2nd order Butterworth low-pass filter to an array of trajectory values.
    """
    if len(data) < 10:
        return data
    try:
        from scipy.signal import butter, filtfilt
        nyq = 0.5 * fs
        normal_cutoff = cutoff / nyq
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        smoothed = filtfilt(b, a, data)
        return smoothed
    except Exception:
        # Fallback to simple moving average if scipy is not available or errors
        window = 3
        return np.convolve(data, np.ones(window)/window, mode='same')
