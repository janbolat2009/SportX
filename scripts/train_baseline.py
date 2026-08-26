"""
SportX Baseline Models Training Script
Trains Logistic Regression, Random Forest, Gradient Boosting, and SVM with video-level splitting.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


def train_baseline_models():
    feat_path = os.path.join("data", "features", "biomechanical_features.csv")
    models_dir = os.path.join("data", "models")
    eval_dir = os.path.join("data", "evaluation")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("Loading feature matrix...", flush=True)
    df = pd.read_csv(feat_path)
    print(f"Loaded {len(df)} samples across {df['vid_id'].nunique()} videos.", flush=True)

    feature_cols = [c for c in df.columns if c not in ["vid_id", "frame_order", "canonical_label"]]
    X = df[feature_cols].values
    y = df["canonical_label"].values
    groups = df["vid_id"].values

    # Step 1: Strict Video-Level Split (70% Train, 15% Val, 15% Test)
    gss_test = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_val_idx, test_idx = next(gss_test.split(X, y, groups=groups))

    X_train_val, y_train_val, groups_train_val = X[train_val_idx], y[train_val_idx], groups[train_val_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.1765, random_state=42)
    train_idx, val_idx = next(gss_val.split(X_train_val, y_train_val, groups=groups_train_val))

    X_train, y_train = X_train_val[train_idx], y_train_val[train_idx]
    X_val, y_val = X_train_val[val_idx], y_train_val[val_idx]

    print(f"Video-Level Split: Train={len(X_train)} frames, Val={len(X_val)} frames, Test={len(X_test)} frames", flush=True)

    # Model dictionary
    models = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=300, random_state=42))
        ]),
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", GradientBoostingClassifier(n_estimators=60, max_depth=4, random_state=42))
        ]),
        "SVM_Linear": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", CalibratedClassifierCV(LinearSVC(max_iter=2000, random_state=42)))
        ])
    }

    results = {}

    for name, pipeline in models.items():
        print(f"\n--- Training {name} ---", flush=True)
        pipeline.fit(X_train, y_train)

        # Validation prediction
        y_val_pred = pipeline.predict(X_val)
        val_acc = accuracy_score(y_val, y_val_pred)
        val_p, val_r, val_f1, _ = precision_recall_fscore_support(y_val, y_val_pred, average="weighted", zero_division=0)

        # Test prediction
        y_test_pred = pipeline.predict(X_test)
        test_acc = accuracy_score(y_test, y_test_pred)
        test_p, test_r, test_f1, _ = precision_recall_fscore_support(y_test, y_test_pred, average="weighted", zero_division=0)

        print(f"{name} Results: Val Acc={val_acc:.4f}, Val F1={val_f1:.4f} | Test Acc={test_acc:.4f}, Test F1={test_f1:.4f}", flush=True)

        results[name] = {
            "validation": {
                "accuracy": round(float(val_acc), 4),
                "precision": round(float(val_p), 4),
                "recall": round(float(val_r), 4),
                "f1_score": round(float(val_f1), 4)
            },
            "test": {
                "accuracy": round(float(test_acc), 4),
                "precision": round(float(test_p), 4),
                "recall": round(float(test_r), 4),
                "f1_score": round(float(test_f1), 4)
            }
        }

        # Save model checkpoint
        joblib_path = os.path.join(models_dir, f"{name.lower()}_model.joblib")
        joblib.dump(pipeline, joblib_path)
        print(f"Saved checkpoint: {joblib_path}", flush=True)

    # Save summary metrics
    results_path = os.path.join(eval_dir, "baseline_models_results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Save split metadata for evaluation script
    split_meta = {
        "feature_cols": feature_cols,
        "classes": sorted(list(np.unique(y))),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test)
    }
    with open(os.path.join(models_dir, "split_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)

    # Save test dataset for standalone evaluation
    test_df = df.iloc[test_idx].copy()
    test_df.to_csv(os.path.join(eval_dir, "held_out_test_set.csv"), index=False)

    print(f"\nAll baseline models trained successfully! Results saved to {results_path}", flush=True)


if __name__ == "__main__":
    train_baseline_models()
