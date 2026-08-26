"""
SportX Model Benchmark & Evaluation Script
Evaluates all trained models on held-out test data, measuring Accuracy, F1, Confusion Matrices, and Inference FPS.
"""
import os
import time
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report


def evaluate_models():
    eval_dir = os.path.join("data", "evaluation")
    models_dir = os.path.join("data", "models")
    test_csv = os.path.join(eval_dir, "held_out_test_set.csv")

    if not os.path.exists(test_csv):
        print(f"Error: {test_csv} not found. Please run train_baseline.py first.")
        return

    print("Loading held-out test set...")
    test_df = pd.read_csv(test_csv)
    feature_cols = [c for c in test_df.columns if c not in ["vid_id", "frame_order", "canonical_label"]]
    X_test = test_df[feature_cols].values
    y_test = test_df["canonical_label"].values

    classes = sorted(list(np.unique(y_test)))
    print(f"Test Set: {len(X_test)} samples across classes: {classes}")

    model_files = {
        "Logistic Regression": "logisticregression_model.joblib",
        "Random Forest": "randomforest_model.joblib",
        "Gradient Boosting": "gradientboosting_model.joblib",
        "Support Vector Machine (Linear)": "svm_linear_model.joblib"
    }

    all_evaluations = {}
    benchmark_table_rows = []

    for display_name, file_name in model_files.items():
        model_path = os.path.join(models_dir, file_name)
        if not os.path.exists(model_path):
            print(f"Skipping {display_name} (file not found)")
            continue

        pipeline = joblib.load(model_path)
        file_size_kb = round(os.path.getsize(model_path) / 1024, 1)

        # Benchmark latency (run 5 warmup batches, then measure 1000 single-sample inferences)
        _ = pipeline.predict(X_test[:10])
        
        n_bench = min(1000, len(X_test))
        t_start = time.perf_counter()
        for i in range(n_bench):
            _ = pipeline.predict(X_test[i:i+1])
        t_elapsed = time.perf_counter() - t_start
        latency_ms = (t_elapsed / n_bench) * 1000.0
        fps = round(1000.0 / latency_ms, 1) if latency_ms > 0 else 0

        # Full test evaluation
        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        p_w, r_w, f1_w, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
        p_m, r_m, f1_m, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
        cm = confusion_matrix(y_test, y_pred, labels=classes)
        clf_rep = classification_report(y_test, y_pred, labels=classes, output_dict=True)

        all_evaluations[display_name] = {
            "file_size_kb": file_size_kb,
            "accuracy": round(float(acc), 4),
            "weighted_precision": round(float(p_w), 4),
            "weighted_recall": round(float(r_w), 4),
            "weighted_f1": round(float(f1_w), 4),
            "macro_f1": round(float(f1_m), 4),
            "latency_ms": round(float(latency_ms), 3),
            "inference_fps": fps,
            "confusion_matrix": cm.tolist(),
            "per_class_metrics": {k: v for k, v in clf_rep.items() if k in classes}
        }

        benchmark_table_rows.append(
            f"| **{display_name}** | {acc*100:.2f}% | {p_w*100:.2f}% | {r_w*100:.2f}% | {f1_w*100:.2f}% | {latency_ms:.2f} ms | {fps:,.0f} FPS | {file_size_kb} KB |"
        )

    # Markdown report generation
    md_lines = [
        "# SportX Machine Learning Model Benchmark Report",
        f"**Date**: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "**Dataset**: Kaggle Pose & Exercise Kinematics (Held-out 15% Video Split)",
        f"**Test Set Samples**: {len(X_test):,} frames",
        "---",
        "## 1. Comparative Model Leaderboard\n",
        "| Model Architecture | Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Latency (ms) | Throughput (FPS) | Model Size |",
        "|---|---|---|---|---|---|---|---|"
    ]
    md_lines.extend(benchmark_table_rows)

    md_lines.append("\n## 2. Confusion Matrices & Per-Class Performance\n")
    for name, data in all_evaluations.items():
        md_lines.append(f"### {name}")
        md_lines.append(f"- **Overall F1-Score**: {data['weighted_f1']*100:.2f}%")
        md_lines.append(f"- **Inference Speed**: {data['inference_fps']:,.0f} FPS ({data['latency_ms']} ms/sample)")
        md_lines.append("\n**Class Performance Breakdown:**")
        md_lines.append("| Exercise Class | Precision | Recall | F1-Score | Support |")
        md_lines.append("|---|---|---|---|---|")
        for cls_name, metrics in data["per_class_metrics"].items():
            md_lines.append(
                f"| `{cls_name}` | {metrics['precision']*100:.1f}% | {metrics['recall']*100:.1f}% | {metrics['f1-score']*100:.1f}% | {int(metrics['support']):,} |"
            )
        md_lines.append("\n")

    md_path = os.path.join(eval_dir, "MODEL_BENCHMARK_REPORT.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    json_path = os.path.join(eval_dir, "all_models_evaluation.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_evaluations, f, indent=2)

    print(f"\nModel evaluation finished! Scientific benchmark report written to {md_path}")


if __name__ == "__main__":
    evaluate_models()
