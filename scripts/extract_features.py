"""
SportX Biomechanical Feature Extraction Script
Extracts 24+ kinematic and spatial features from normalized landmarks and angle sequences.
"""
import os
import json
import pandas as pd
import numpy as np


def extract_features():
    proc_dir = os.path.join("data", "processed")
    feat_dir = os.path.join("data", "features")
    os.makedirs(feat_dir, exist_ok=True)

    print("Loading normalized landmarks and labeled angles...")
    norm_lms = pd.read_csv(os.path.join(proc_dir, "normalized_landmarks.csv"))
    angles_df = pd.read_csv(os.path.join(proc_dir, "angles_labeled.csv"))

    print(f"Landmarks: {norm_lms.shape}, Angles: {angles_df.shape}")

    # Merge on vid_id and frame_order
    merged = norm_lms.merge(
        angles_df.drop(columns=["canonical_label"], errors="ignore"),
        on=["vid_id", "frame_order"],
        how="inner"
    )

    print(f"Merged dataset for feature extraction: {merged.shape}")

    feature_records = []
    
    # Group by vid_id to compute time-derivatives correctly per video
    for vid_id, group in merged.groupby("vid_id"):
        group = group.sort_values("frame_order").reset_index(drop=True)
        n_frames = len(group)
        if n_frames < 2:
            continue

        label = group["canonical_label"].iloc[0]

        # Key angle columns
        # right_hip_right_knee_right_ankle (Right Knee Angle)
        # left_hip_left_knee_left_ankle (Left Knee Angle)
        # right_elbow_right_shoulder_right_hip (Right Shoulder Angle)
        # left_elbow_left_shoulder_left_hip (Left Shoulder Angle)
        # right_wrist_right_elbow_right_shoulder (Right Elbow Angle)
        # left_wrist_left_elbow_left_shoulder (Left Elbow Angle)
        
        r_knee = group["right_hip_right_knee_right_ankle"].values
        l_knee = group["left_hip_left_knee_left_ankle"].values
        r_elbow = group["right_wrist_right_elbow_right_shoulder"].values
        l_elbow = group["left_wrist_left_elbow_left_shoulder"].values
        r_shoulder = group["right_elbow_right_shoulder_right_hip"].values
        l_shoulder = group["left_elbow_left_shoulder_left_hip"].values
        knee_spread = group["right_knee_mid_hip_left_knee"].values

        # 1. Bilateral Symmetry Index (BSI = 100 * (1 - |L - R| / ((L + R)/2 + 1e-4)))
        knee_sym = 100.0 * (1.0 - np.abs(l_knee - r_knee) / ((l_knee + r_knee) / 2.0 + 1e-4))
        elbow_sym = 100.0 * (1.0 - np.abs(l_elbow - r_elbow) / ((l_elbow + r_elbow) / 2.0 + 1e-4))
        shoulder_sym = 100.0 * (1.0 - np.abs(l_shoulder - r_shoulder) / ((l_shoulder + r_shoulder) / 2.0 + 1e-4))

        # 2. Kinematic Velocities (First-order differences, assuming ~30fps -> dt = 1/30)
        dt = 1.0 / 30.0
        r_knee_vel = np.gradient(r_knee, dt)
        l_knee_vel = np.gradient(l_knee, dt)
        r_elbow_vel = np.gradient(r_elbow, dt)
        l_elbow_vel = np.gradient(l_elbow, dt)

        # 3. Kinematic Accelerations (Second-order differences)
        r_knee_acc = np.gradient(r_knee_vel, dt)
        l_knee_acc = np.gradient(l_knee_vel, dt)
        r_elbow_acc = np.gradient(r_elbow_vel, dt)
        l_elbow_acc = np.gradient(l_elbow_vel, dt)

        # 4. Normalized Spatial Distances
        # Knee width = || left_knee - right_knee ||
        dx_knee = group["x_left_knee"].values - group["x_right_knee"].values
        dy_knee = group["y_left_knee"].values - group["y_right_knee"].values
        knee_dist = np.sqrt(dx_knee**2 + dy_knee**2)

        # Hip width = || left_hip - right_hip ||
        dx_hip = group["x_left_hip"].values - group["x_right_hip"].values
        dy_hip = group["y_left_hip"].values - group["y_right_hip"].values
        hip_dist = np.sqrt(dx_hip**2 + dy_hip**2)
        knee_to_hip_ratio = knee_dist / np.where(hip_dist < 1e-4, 1.0, hip_dist)

        # Ankle width = || left_ankle - right_ankle ||
        dx_ank = group["x_left_ankle"].values - group["x_right_ankle"].values
        dy_ank = group["y_left_ankle"].values - group["y_right_ankle"].values
        ankle_dist = np.sqrt(dx_ank**2 + dy_ank**2)
        ankle_to_hip_ratio = ankle_dist / np.where(hip_dist < 1e-4, 1.0, hip_dist)

        # Torso inclination from vertical: dx, dy between mid_shoulder and mid_hip
        mid_sh_x = (group["x_left_shoulder"].values + group["x_right_shoulder"].values) / 2.0
        mid_sh_y = (group["y_left_shoulder"].values + group["y_right_shoulder"].values) / 2.0
        mid_hp_x = (group["x_left_hip"].values + group["x_right_hip"].values) / 2.0
        mid_hp_y = (group["y_left_hip"].values + group["y_right_hip"].values) / 2.0
        torso_lean = np.degrees(np.arctan2(np.abs(mid_sh_x - mid_hp_x), np.abs(mid_sh_y - mid_hp_y) + 1e-4))

        for i in range(n_frames):
            feature_records.append({
                "vid_id": vid_id,
                "frame_order": group["frame_order"].iloc[i],
                "canonical_label": label,
                # Angles
                "r_knee_angle": round(float(r_knee[i]), 2),
                "l_knee_angle": round(float(l_knee[i]), 2),
                "avg_knee_angle": round(float((r_knee[i] + l_knee[i]) / 2.0), 2),
                "r_elbow_angle": round(float(r_elbow[i]), 2),
                "l_elbow_angle": round(float(l_elbow[i]), 2),
                "avg_elbow_angle": round(float((r_elbow[i] + l_elbow[i]) / 2.0), 2),
                "r_shoulder_angle": round(float(r_shoulder[i]), 2),
                "l_shoulder_angle": round(float(l_shoulder[i]), 2),
                "knee_spread_angle": round(float(knee_spread[i]), 2),
                "torso_lean_angle": round(float(torso_lean[i]), 2),
                # Symmetry
                "knee_symmetry": round(float(np.clip(knee_sym[i], 0, 100)), 2),
                "elbow_symmetry": round(float(np.clip(elbow_sym[i], 0, 100)), 2),
                "shoulder_symmetry": round(float(np.clip(shoulder_sym[i], 0, 100)), 2),
                # Velocities
                "r_knee_vel": round(float(r_knee_vel[i]), 2),
                "l_knee_vel": round(float(l_knee_vel[i]), 2),
                "r_elbow_vel": round(float(r_elbow_vel[i]), 2),
                "l_elbow_vel": round(float(l_elbow_vel[i]), 2),
                # Accelerations
                "r_knee_acc": round(float(r_knee_acc[i]), 2),
                "l_knee_acc": round(float(l_knee_acc[i]), 2),
                "r_elbow_acc": round(float(r_elbow_acc[i]), 2),
                "l_elbow_acc": round(float(l_elbow_acc[i]), 2),
                # Spatial Ratios
                "knee_dist": round(float(knee_dist[i]), 4),
                "hip_dist": round(float(hip_dist[i]), 4),
                "knee_to_hip_ratio": round(float(knee_to_hip_ratio[i]), 4),
                "ankle_to_hip_ratio": round(float(ankle_to_hip_ratio[i]), 4)
            })

    feat_df = pd.DataFrame(feature_records)
    print(f"Extracted feature matrix: {feat_df.shape}")

    feat_csv_path = os.path.join(feat_dir, "biomechanical_features.csv")
    feat_df.to_csv(feat_csv_path, index=False)

    meta = {
        "total_samples": len(feat_df),
        "total_videos": feat_df["vid_id"].nunique(),
        "feature_count": feat_df.shape[1] - 3,
        "feature_names": [c for c in feat_df.columns if c not in ["vid_id", "frame_order", "canonical_label"]],
        "class_distribution": feat_df["canonical_label"].value_counts().to_dict()
    }
    with open(os.path.join(feat_dir, "features_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Features saved to {feat_csv_path}")


if __name__ == "__main__":
    extract_features()
