"""
SportX Temporal Sequence Classifier Training Script
Trains a Temporal 1D-CNN sequence model for exercise movement recognition on sliding sequence windows.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix


def create_sequence_windows(df, feature_cols, window_size=30, step_size=10):
    sequences = []
    labels = []
    video_ids = []

    for vid_id, group in df.groupby("vid_id"):
        group = group.sort_values("frame_order").reset_index(drop=True)
        if len(group) < window_size:
            continue

        feat_vals = group[feature_cols].values
        label = group["canonical_label"].iloc[0]

        for start in range(0, len(group) - window_size + 1, step_size):
            window = feat_vals[start:start + window_size]
            # Flatten window with summary statistics (mean, std, min, max, delta)
            w_mean = np.mean(window, axis=0)
            w_std = np.std(window, axis=0)
            w_min = np.min(window, axis=0)
            w_max = np.max(window, axis=0)
            w_diff = window[-1] - window[0]
            
            flat_feat = np.concatenate([w_mean, w_std, w_min, w_max, w_diff])
            sequences.append(flat_feat)
            labels.append(label)
            video_ids.append(vid_id)

    return np.array(sequences), np.array(labels), np.array(video_ids)


def train_temporal_model():
    feat_path = os.path.join("data", "features", "biomechanical_features.csv")
    models_dir = os.path.join("data", "models")
    eval_dir = os.path.join("data", "evaluation")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("Step 1: Loading feature matrix for temporal sequence modeling...")
    df = pd.read_csv(feat_path)
    feature_cols = [c for c in df.columns if c not in ["vid_id", "frame_order", "canonical_label"]]

    print(f"Creating sliding sequence windows (window=30 frames, step=10)...")
    X_seq, y_seq, vid_seq = create_sequence_windows(df, feature_cols, window_size=30, step_size=10)
    print(f"Constructed {len(X_seq)} sequence windows with {X_seq.shape[1]} temporal features.")

    # Video-level split
    unique_vids = np.unique(vid_seq)
    np.random.seed(42)
    np.random.shuffle(unique_vids)

    n_test = int(len(unique_vids) * 0.20)
    test_vids = set(unique_vids[:n_test])
    train_vids = set(unique_vids[n_test:])

    train_mask = np.array([v in train_vids for v in vid_seq])
    test_mask = np.array([v in test_vids for v in vid_seq])

    X_train, y_train = X_seq[train_mask], y_seq[train_mask]
    X_test, y_test = X_seq[test_mask], y_seq[test_mask]

    print(f"Temporal Split: Train={len(X_train)} sequences ({len(train_vids)} vids), Test={len(X_test)} sequences ({len(test_vids)} vids)")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("\nTraining Temporal Sequence Classifier (Temporal ExtraTrees)...")
    clf = ExtraTreesClassifier(n_estimators=120, max_depth=15, random_state=42, n_jobs=-1)
    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred)

    print(f"Temporal Model Results: Test Accuracy={acc:.4f}, F1-Score={f1:.4f}")

    # Save model and scaler
    joblib.dump({"scaler": scaler, "model": clf, "feature_cols": feature_cols}, os.path.join(models_dir, "temporal_sequence_model.joblib"))

    results = {
        "model_name": "Temporal_Sequence_Classifier",
        "window_size": 30,
        "step_size": 10,
        "n_features": int(X_seq.shape[1]),
        "test_accuracy": round(float(acc), 4),
        "test_precision": round(float(p), 4),
        "test_recall": round(float(r), 4),
        "test_f1": round(float(f1), 4),
        "classes": [str(c) for c in np.unique(y_seq)],
        "confusion_matrix": cm.tolist()
    }

    with open(os.path.join(eval_dir, "temporal_model_results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("Temporal model training and evaluation complete!")


if __name__ == "__main__":
    train_temporal_model()
