"""
SportX Dataset Preprocessing Script
Performs coordinate normalization, missing value handling, and label standardization.
"""
import os
import pandas as pd
import numpy as np


def preprocess_data():
    raw_dir = os.path.join("data", "raw")
    proc_dir = os.path.join("data", "processed")
    os.makedirs(proc_dir, exist_ok=True)

    print("Step 1: Loading raw datasets...")
    labels_df = pd.read_csv(os.path.join(raw_dir, "labels.csv"))
    angles_df = pd.read_csv(os.path.join(raw_dir, "angles.csv"))
    landmarks_df = pd.read_csv(os.path.join(raw_dir, "landmarks.csv"))
    exercise_angles_df = pd.read_csv(os.path.join(raw_dir, "exercise_angles.csv"))

    print(f"Loaded: labels={labels_df.shape}, angles={angles_df.shape}, landmarks={landmarks_df.shape}, exercise_angles={exercise_angles_df.shape}")

    # Standardize label mapping for video labels
    label_map = {
        "jumping_jack": "jumping_jack",
        "pull_up": "pull_up",
        "push_up": "push_up",
        "situp": "situp",
        "squat": "squat"
    }
    labels_df["canonical_label"] = labels_df["class"].map(label_map).fillna(labels_df["class"])

    print("Step 2: Merging video labels with landmark and angle sequence data...")
    angles_labeled = angles_df.merge(labels_df[["vid_id", "canonical_label"]], on="vid_id", how="left")
    landmarks_labeled = landmarks_df.merge(labels_df[["vid_id", "canonical_label"]], on="vid_id", how="left")

    print("Step 3: Performing body-relative coordinate normalization on landmarks...")
    # Calculate mid-hip: (left_hip + right_hip) / 2
    # In landmarks.csv: x_left_hip, y_left_hip, z_left_hip, x_right_hip, y_right_hip, z_right_hip
    mid_hip_x = (landmarks_labeled["x_left_hip"] + landmarks_labeled["x_right_hip"]) / 2.0
    mid_hip_y = (landmarks_labeled["y_left_hip"] + landmarks_labeled["y_right_hip"]) / 2.0
    mid_hip_z = (landmarks_labeled["z_left_hip"] + landmarks_labeled["z_right_hip"]) / 2.0

    # Calculate mid-shoulder: (left_shoulder + right_shoulder) / 2
    mid_sh_x = (landmarks_labeled["x_left_shoulder"] + landmarks_labeled["x_right_shoulder"]) / 2.0
    mid_sh_y = (landmarks_labeled["y_left_shoulder"] + landmarks_labeled["y_right_shoulder"]) / 2.0
    mid_sh_z = (landmarks_labeled["z_left_shoulder"] + landmarks_labeled["z_right_shoulder"]) / 2.0

    # Torso length L = || mid_shoulder - mid_hip ||
    torso_len = np.sqrt(
        (mid_sh_x - mid_hip_x) ** 2 +
        (mid_sh_y - mid_hip_y) ** 2 +
        (mid_sh_z - mid_hip_z) ** 2
    )
    # Prevent division by zero
    torso_len = np.where(torso_len < 1e-4, 1.0, torso_len)

    # Normalize all coordinate columns
    coord_cols = [c for c in landmarks_df.columns if c not in ["vid_id", "frame_order"]]
    norm_landmarks = landmarks_labeled.copy()

    for col in coord_cols:
        if col.startswith("x_"):
            norm_landmarks[col] = (norm_landmarks[col] - mid_hip_x) / torso_len
        elif col.startswith("y_"):
            norm_landmarks[col] = (norm_landmarks[col] - mid_hip_y) / torso_len
        elif col.startswith("z_"):
            norm_landmarks[col] = (norm_landmarks[col] - mid_hip_z) / torso_len

    print("Step 4: Standardizing exercise_angles dataset...")
    ea_label_map = {
        "Push Ups": "push_up",
        "Pull ups": "pull_up",
        "Jumping Jacks": "jumping_jack",
        "Squats": "squat",
        "Russian twists": "russian_twist"
    }
    clean_ea = exercise_angles_df.copy()
    clean_ea["canonical_label"] = clean_ea["Label"].map(ea_label_map).fillna(clean_ea["Label"])

    # Save processed outputs
    norm_landmarks_path = os.path.join(proc_dir, "normalized_landmarks.csv")
    angles_labeled_path = os.path.join(proc_dir, "angles_labeled.csv")
    clean_ea_path = os.path.join(proc_dir, "cleaned_exercise_angles.csv")

    print(f"Step 5: Saving processed data to {proc_dir}...")
    norm_landmarks.to_csv(norm_landmarks_path, index=False)
    angles_labeled.to_csv(angles_labeled_path, index=False)
    clean_ea.to_csv(clean_ea_path, index=False)

    print("Preprocessing completed successfully!")


if __name__ == "__main__":
    preprocess_data()
