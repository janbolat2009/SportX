"""
SportX Model Export Script
Exports champion model and scaler weights to backend/app/ml/models/weights/ for live inference.
"""
import os
import shutil
import json
import joblib
import pandas as pd


def export_champion_model():
    models_dir = os.path.join("data", "models")
    eval_dir = os.path.join("data", "evaluation")
    backend_weights_dir = os.path.join("backend", "app", "ml", "models", "weights")
    os.makedirs(backend_weights_dir, exist_ok=True)

    eval_json_path = os.path.join(eval_dir, "all_models_evaluation.json")
    
    # Default to RandomForest if eval json not generated yet
    selected_model_name = "randomforest_model.joblib"
    champion_display_name = "Random Forest"

    if os.path.exists(eval_json_path):
        with open(eval_json_path, "r", encoding="utf-8") as f:
            eval_data = json.load(f)
            # Find model with highest weighted F1 score
            best_name = None
            best_f1 = -1.0
            for name, metrics in eval_data.items():
                if metrics.get("weighted_f1", 0) > best_f1:
                    best_f1 = metrics["weighted_f1"]
                    best_name = name

            if best_name == "Gradient Boosting":
                selected_model_name = "gradientboosting_model.joblib"
                champion_display_name = best_name
            elif best_name == "Random Forest":
                selected_model_name = "randomforest_model.joblib"
                champion_display_name = best_name

    source_path = os.path.join(models_dir, selected_model_name)
    target_path = os.path.join(backend_weights_dir, "sportx_model_v1.joblib")
    
    print(f"Exporting champion model '{champion_display_name}' ({source_path}) to {target_path}...")
    shutil.copyfile(source_path, target_path)

    # Export manifest
    split_meta_path = os.path.join(models_dir, "split_metadata.json")
    split_meta = {}
    if os.path.exists(split_meta_path):
        with open(split_meta_path, "r", encoding="utf-8") as f:
            split_meta = json.load(f)

    manifest = {
        "model_version": "sportx-ml-v1.0",
        "champion_architecture": champion_display_name,
        "weights_file": "sportx_model_v1.joblib",
        "exported_at": pd.Timestamp.now().isoformat(),
        "feature_count": len(split_meta.get("feature_cols", [])),
        "features": split_meta.get("feature_cols", []),
        "classes": split_meta.get("classes", ["jumping_jack", "pull_up", "push_up", "situp", "squat"]),
        "inference_engine": "scikit-learn / joblib pipeline",
        "latency_target_ms": "< 2.0 ms"
    }

    manifest_path = os.path.join(backend_weights_dir, "model_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Also copy manifest to data/models/
    shutil.copyfile(manifest_path, os.path.join(models_dir, "model_manifest.json"))

    print(f"Champion model successfully exported to {backend_weights_dir}!")


if __name__ == "__main__":
    export_champion_model()
