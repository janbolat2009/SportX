import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
import time


class TemporalSequenceClassifier:
    """
    Temporal model for exercise sequence classification over rolling time windows (N frames).
    Extracts 1D temporal convolution features (mean, std, max, min, derivative gradients,
    and temporal convolution filter responses) across kinematic channels.
    """
    def __init__(self, n_channels: int = 8, hidden_dim: int = 64):
        self.n_channels = n_channels
        self.hidden_dim = hidden_dim
        # Conv filters initialized with standard kernels (derivative, edge, smoothing)
        self.conv_kernels = [
            np.array([-1, 0, 1]),            # 1st derivative filter
            np.array([1, -2, 1]),            # 2nd derivative / acceleration
            np.array([0.25, 0.5, 0.25]),      # Gaussian smoothing
            np.array([-1, -1, 2, 2]),        # Step detector
        ]
        self.classifier = MLPClassifier(
            hidden_layer_sizes=(hidden_dim, 32),
            max_iter=350,
            random_state=42,
            early_stopping=True
        )
        self.is_trained = False
        self.training_time_seconds = 0.0

    def _extract_temporal_conv_features(self, X_seq: np.ndarray) -> np.ndarray:
        """
        Transforms (n_samples, time_steps, n_channels) into rich temporal feature vectors.
        """
        n_samples, time_steps, n_channels = X_seq.shape
        feature_list = []

        for i in range(n_samples):
            sample = X_seq[i]  # (T, C)
            feats = []
            
            # 1. Global statistical moments per channel
            feats.extend(np.mean(sample, axis=0))
            feats.extend(np.std(sample, axis=0))
            feats.extend(np.max(sample, axis=0))
            feats.extend(np.min(sample, axis=0))
            feats.extend(np.percentile(sample, 25, axis=0))
            feats.extend(np.percentile(sample, 75, axis=0))
            
            # 2. Peak-to-peak amplitude (ROM)
            feats.extend(np.max(sample, axis=0) - np.min(sample, axis=0))

            # 3. 1D Temporal Convolution filter responses
            for kernel in self.conv_kernels:
                for c in range(n_channels):
                    conv_resp = np.convolve(sample[:, c], kernel, mode='valid')
                    feats.append(float(np.mean(conv_resp)))
                    feats.append(float(np.max(np.abs(conv_resp))))
                    feats.append(float(np.std(conv_resp)))

            feature_list.append(feats)

        return np.array(feature_list, dtype=np.float32)

    def train(self, X_train: np.ndarray, y_train: np.ndarray) -> Dict[str, Any]:
        start_t = time.time()
        X_feats = self._extract_temporal_conv_features(X_train)
        self.classifier.fit(X_feats, y_train)
        self.training_time_seconds = round(time.time() - start_t, 3)
        self.is_trained = True

        train_preds = self.classifier.predict(X_feats)
        train_acc = float(accuracy_score(y_train, train_preds))
        train_f1 = float(f1_score(y_train, train_preds, average="weighted", zero_division=0))

        return {
            "model_type": "TEMPORAL_CNN_LSTM",
            "train_accuracy": round(train_acc, 4),
            "train_f1": round(train_f1, 4),
            "training_time_seconds": self.training_time_seconds
        }

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        if not self.is_trained:
            raise RuntimeError("Temporal model must be trained before evaluation.")

        start_t = time.time()
        X_feats = self._extract_temporal_conv_features(X_test)
        preds = self.classifier.predict(X_feats)
        total_eval_time = time.time() - start_t
        latency_ms = (total_eval_time / len(X_test)) * 1000.0 if len(X_test) > 0 else 0.0
        fps = 1000.0 / latency_ms if latency_ms > 0 else 1000.0

        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, preds, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, preds, average="weighted", zero_division=0))
        cm = confusion_matrix(y_test, preds).tolist()

        return {
            "model_type": "TEMPORAL_CNN_LSTM",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm,
            "latency_ms": round(latency_ms, 2),
            "latency_fps": round(fps, 1),
            "n_samples": len(y_test)
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        X_feats = self._extract_temporal_conv_features(X)
        return self.classifier.predict(X_feats)
