import numpy as np
from typing import List, Tuple, Dict, Any


def subject_wise_train_test_split(
    X: np.ndarray,
    y: np.ndarray,
    subject_ids: List[str],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_seed: int = 42
) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
    """
    Performs strict subject-wise data splitting to prevent data leakage.
    Ensures all samples from a single subject reside solely in one split (train, val, or test).
    """
    unique_subjects = np.unique(subject_ids)
    np.random.seed(random_seed)
    shuffled_subjects = np.random.permutation(unique_subjects)

    n_total = len(shuffled_subjects)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_subjs = set(shuffled_subjects[:n_train])
    val_subjs = set(shuffled_subjects[n_train:n_train + n_val])
    test_subjs = set(shuffled_subjects[n_train + n_val:])

    # If test set is empty due to small subject count, assign at least 1 subject
    if not test_subjs and len(val_subjs) > 1:
        moved = val_subjs.pop()
        test_subjs.add(moved)

    train_mask = np.array([s in train_subjs for s in subject_ids])
    val_mask = np.array([s in val_subjs for s in subject_ids])
    test_mask = np.array([s in test_subjs for s in subject_ids])

    return {
        "train": (X[train_mask], y[train_mask]),
        "val": (X[val_mask], y[val_mask]),
        "test": (X[test_mask], y[test_mask]),
        "train_subjects": list(train_subjs),
        "val_subjects": list(val_subjs),
        "test_subjects": list(test_subjs),
        "stats": {
            "train_samples": int(np.sum(train_mask)),
            "val_samples": int(np.sum(val_mask)),
            "test_samples": int(np.sum(test_mask)),
            "train_subjects": len(train_subjs),
            "val_subjects": len(val_subjs),
            "test_subjects": len(test_subjs)
        }
    }
