import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
import time


class PoseFeatureClassifier:
    """
    Classical Machine Learning model suite operating on engineered kinematic pose feature vectors.
    Supports Random Forest, Gradient Boosting, Logistic Regression, and MLP.
    """
    def __init__(self, model_type: str = "RANDOM_FOREST", **kwargs):
        self.model_type = model_type.upper()
        self.hyperparameters = kwargs
        self.model = self._init_model()
        self.is_trained = False
        self.training_time_seconds = 0.0

    def _init_model(self):
        if self.model_type == "RANDOM_FOREST":
            n_estimators = self.hyperparameters.get("n_estimators", 100)
            max_depth = self.hyperparameters.get("max_depth", 10)
            return RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=42,
                class_weight="balanced"
            )
        elif self.model_type == "GRADIENT_BOOSTING":
            n_estimators = self.hyperparameters.get("n_estimators", 80)
            learning_rate = self.hyperparameters.get("learning_rate", 0.1)
            return GradientBoostingClassifier(
                n_estimators=n_estimators,
                learning_rate=learning_rate,
                random_state=42
            )
        elif self.model_type == "LOGISTIC_REGRESSION":
            return LogisticRegression(max_iter=500, random_state=42)
        elif self.model_type == "MLP":
            hidden_layer_sizes = self.hyperparameters.get("hidden_layer_sizes", (64, 32))
            return MLPClassifier(
                hidden_layer_sizes=hidden_layer_sizes,
                max_iter=300,
                random_state=42
            )
        else:
            return RandomForestClassifier(n_estimators=100, random_state=42)

    def train(self, X_train: np.ndarray, y_train: np.ndarray) -> Dict[str, Any]:
        start_t = time.time()
        self.model.fit(X_train, y_train)
        self.training_time_seconds = round(time.time() - start_t, 3)
        self.is_trained = True
        
        train_preds = self.model.predict(X_train)
        train_acc = float(accuracy_score(y_train, train_preds))
        train_f1 = float(f1_score(y_train, train_preds, average="weighted", zero_division=0))
        
        return {
            "model_type": self.model_type,
            "train_accuracy": round(train_acc, 4),
            "train_f1": round(train_f1, 4),
            "training_time_seconds": self.training_time_seconds
        }

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        if not self.is_trained:
            raise RuntimeError("Model must be trained before evaluation.")
            
        start_t = time.time()
        preds = self.model.predict(X_test)
        total_eval_time = time.time() - start_t
        latency_ms = (total_eval_time / len(X_test)) * 1000.0 if len(X_test) > 0 else 0.0
        fps = 1000.0 / latency_ms if latency_ms > 0 else 1000.0

        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, preds, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, preds, average="weighted", zero_division=0))
        cm = confusion_matrix(y_test, preds).tolist()

        return {
            "model_type": self.model_type,
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
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if hasattr(self.model, "predict_proba"):
            return self.model.predict_proba(X)
        return np.zeros((len(X), 5))
