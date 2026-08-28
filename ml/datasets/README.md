# SportX Machine Learning & Dataset Pipeline

This directory contains the machine-learning pipeline for training and evaluating exercise technique classification and temporal sequence models.

## Directory Structure

```
ml/
├── datasets/           # Raw and processed pose landmark datasets (CSV, JSON, NPZ)
│   └── README.md       # Dataset format specification and data contribution guidelines
├── preprocessing/      # Coordinate normalization, bounding box scaling, rotation alignment
│   ├── normalizer.py   # Subject-invariant scale and translation normalization
│   └── filter.py       # Butterworth / EMA temporal landmark filtering
├── features/           # Biomechanical feature engineering
│   ├── angles.py       # 2D/3D joint angle and angular velocity extraction
│   └── spatio_temporal.py # Multi-frame kinematic vectors
├── models/             # Trained model artifacts and PyTorch / ONNX definitions
│   ├── pose_classifier.py     # Static landmark deviation classifier
│   └── temporal_sequence.py   # Bi-LSTM / Transformer repetition & phase segmenter
├── training/           # Training scripts with GroupKFold cross-validation
│   ├── train_classifier.py    # Training script preventing subject data leakage
│   └── train_sequence.py      # Temporal sequence model training
└── evaluation/         # Model evaluation, ROC curves, and inter-rater reliability
    ├── metrics.py             # Macro F1, Precision, Recall, and confusion matrices
    └── benchmark.py           # Benchmark script comparing rule-based vs ML models
```

## Dataset Format Specification

Datasets placed in `ml/datasets/` must contain the standard 33 MediaPipe landmark coordinates along with timestamp, subject ID, exercise label, and technique quality label:

```json
{
  "exercise": "squat",
  "subject_id": "athlete_042",
  "camera_view": "side_90deg",
  "fps": 30,
  "frames": [
    {
      "frame_idx": 0,
      "timestamp_ms": 0,
      "phase": "STANDING",
      "landmarks": [
        {"x": 0.521, "y": 0.145, "z": -0.05, "visibility": 0.98},
        ...
      ],
      "technique_labels": {
        "depth_valid": true,
        "valgus_deviation": false,
        "torso_lean_degrees": 12.4
      }
    }
  ]
}
```

## Running Model Training

1. Place dataset files in `ml/datasets/`
2. Run feature extraction:
   ```bash
   python ml/preprocessing/normalizer.py
   python ml/features/angles.py
   ```
3. Train with subject-level cross validation:
   ```bash
   python ml/training/train_classifier.py --dataset ml/datasets/squat_dataset.json
   ```
4. Evaluate benchmark agreement:
   ```bash
   python ml/evaluation/benchmark.py
   ```
