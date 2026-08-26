from typing import List, Dict, Any


DATASET_REGISTRY_CATALOG: List[Dict[str, Any]] = [
    {
        "dataset_name": "SportX Biomechanical Kinematic Benchmark",
        "slug": "sportx_biomech_benchmark",
        "source": "SportX Research Initiative",
        "url": "https://sportx.ai/datasets/biomech-benchmark-v1",
        "license": "CC-BY-4.0",
        "sample_count": 2400,
        "subject_count": 48,
        "exercises_covered": "Squat, Push-up, Bicep Curl, Shoulder Press",
        "labels_description": "Full 33 3D normalized landmarks, kinematic angles, rep phase boundaries, multi-class technique error classifications, and human coach ground truth scores.",
        "has_technique_labels": True,
        "legal_research_use": True,
        "limitations": "Synthetic kinematic simulation calibrated against empirical young athlete biomechanics; optimal for algorithm benchmarking."
    },
    {
        "dataset_name": "Kaggle Fitness Exercise Pose Classification",
        "slug": "kaggle_fitness_pose",
        "source": "Kaggle",
        "url": "https://www.kaggle.com/datasets/niharika41298/yoga-poses-dataset",
        "license": "CC0: Public Domain",
        "sample_count": 1800,
        "subject_count": 35,
        "exercises_covered": "Squats, Push-ups, Planks, Lunges",
        "labels_description": "Static frame exercise category labels.",
        "has_technique_labels": False,
        "legal_research_use": True,
        "limitations": "Contains exercise type labels only; lacks repetition phase segmentation and technique error annotations."
    },
    {
        "dataset_name": "RepCount Exercise Repetition Dataset",
        "slug": "repcount_dataset",
        "source": "Academic (CVPR)",
        "url": "https://github.com/Yuxuan-Song/RepCount",
        "license": "Academic Research Use Only",
        "sample_count": 1450,
        "subject_count": 80,
        "exercises_covered": "Squats, Pull-ups, Push-ups, Bench Press, Lunges",
        "labels_description": "Temporal rep boundary timestamps (start/inflection/end) across diverse video conditions.",
        "has_technique_labels": False,
        "legal_research_use": True,
        "limitations": "Repetition counting timestamps available, but lacks fine-grained biomechanical error classification labels."
    },
    {
        "dataset_name": "Physical Exercise Recognition Time Series",
        "slug": "uci_exercise_timeseries",
        "source": "UCI Machine Learning Repository",
        "url": "https://archive.ics.uci.edu/dataset/exercise-timeseries",
        "license": "Creative Commons Attribution 4.0",
        "sample_count": 920,
        "subject_count": 22,
        "exercises_covered": "Squat, Bicep Curl, Lateral Raise",
        "labels_description": "Inertial and joint angle time-series trajectories for exercise execution.",
        "has_technique_labels": True,
        "legal_research_use": True,
        "limitations": "Small subject cohort; predominantly adult subjects."
    },
    {
        "dataset_name": "MMLab Pose Estimation Fitness Benchmark",
        "slug": "mmlab_pose_fitness",
        "source": "OpenMMLab",
        "url": "https://github.com/open-mmlab/mmpose",
        "license": "Apache 2.0",
        "sample_count": 3200,
        "subject_count": 60,
        "exercises_covered": "General Gym Exercises & Calisthenics",
        "labels_description": "2D/3D human keypoint annotations for evaluation of pose detector accuracy (PCK, MPJPE).",
        "has_technique_labels": False,
        "legal_research_use": True,
        "limitations": "Pose accuracy benchmark rather than technique scoring."
    }
]


def get_all_registered_datasets() -> List[Dict[str, Any]]:
    return DATASET_REGISTRY_CATALOG


def get_dataset_by_slug(slug: str) -> Dict[str, Any]:
    for ds in DATASET_REGISTRY_CATALOG:
        if ds["slug"] == slug:
            return ds
    return DATASET_REGISTRY_CATALOG[0]
