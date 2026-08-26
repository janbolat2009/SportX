import pytest
import numpy as np
from app.ml.datasets.dataset_generator import generate_synthetic_exercise_dataset
from app.ml.datasets.splitter import subject_wise_train_test_split
from app.ml.models.feature_models import PoseFeatureClassifier
from app.ml.models.temporal_models import TemporalSequenceClassifier
from app.ml.models.evaluator import run_full_model_comparison_benchmark
from app.ml.models.human_agreement import calculate_human_ai_agreement


def test_dataset_generation_and_subject_leakage_prevention():
    X_tab, X_seq, y, subject_ids = generate_synthetic_exercise_dataset(
        n_samples=150,
        n_subjects=15,
        frames_per_rep=30,
        random_seed=42
    )

    assert X_tab.shape == (150, 18)
    assert X_seq.shape == (150, 30, 8)
    assert len(y) == 150
    assert len(subject_ids) == 150

    # Perform subject-wise split
    split = subject_wise_train_test_split(X_tab, y, subject_ids, train_ratio=0.70, test_ratio=0.30)
    
    train_subjs = set(split["train_subjects"])
    test_subjs = set(split["test_subjects"])

    # Strict assertion: no subject data leakage
    overlap = train_subjs.intersection(test_subjs)
    assert len(overlap) == 0
    assert len(split["train"][0]) > 0
    assert len(split["test"][0]) > 0


def test_random_forest_pose_classifier():
    X_tab, _, y, subject_ids = generate_synthetic_exercise_dataset(
        n_samples=200,
        n_subjects=20,
        random_seed=42
    )
    split = subject_wise_train_test_split(X_tab, y, subject_ids, train_ratio=0.70, test_ratio=0.30)
    X_train, y_train = split["train"]
    X_test, y_test = split["test"]

    clf = PoseFeatureClassifier(model_type="RANDOM_FOREST", n_estimators=60)
    train_res = clf.train(X_train, y_train)
    eval_res = clf.evaluate(X_test, y_test)

    assert eval_res["accuracy"] >= 0.60
    assert eval_res["f1_score"] >= 0.55
    assert len(eval_res["confusion_matrix"]) == 5
    assert eval_res["latency_fps"] > 100.0


def test_temporal_sequence_classifier():
    _, X_seq, y, subject_ids = generate_synthetic_exercise_dataset(
        n_samples=160,
        n_subjects=16,
        frames_per_rep=30,
        random_seed=42
    )
    split = subject_wise_train_test_split(X_seq, y, subject_ids, train_ratio=0.70, test_ratio=0.30)
    X_train, y_train = split["train"]
    X_test, y_test = split["test"]

    temp_clf = TemporalSequenceClassifier(n_channels=8, hidden_dim=32)
    temp_clf.train(X_train, y_train)
    eval_res = temp_clf.evaluate(X_test, y_test)

    assert eval_res["accuracy"] >= 0.45
    assert eval_res["f1_score"] >= 0.40


def test_full_model_comparison_benchmark():
    results = run_full_model_comparison_benchmark(n_samples=180, n_subjects=18, random_seed=42)
    
    assert "models" in results
    assert "random_forest" in results["models"]
    assert "gradient_boosting" in results["models"]
    assert "temporal_cnn" in results["models"]
    assert "biomechanical_rules" in results["models"]


def test_human_ai_inter_rater_agreement():
    human = [90.0, 85.0, 70.0, 60.0, 95.0, 80.0, 75.0]
    ai =    [88.0, 84.0, 72.0, 62.0, 93.0, 78.0, 76.0]
    
    res = calculate_human_ai_agreement(human, ai)
    assert res["pearson_r"] > 0.90
    assert res["mae"] < 3.0
    assert res["agreement_strength"] == "Very High Inter-Rater Reliability"
