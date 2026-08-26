# SportX Machine Learning Model Benchmark Report
**Date**: 2026-08-26 20:39:03
**Dataset**: Kaggle Pose & Exercise Kinematics (Held-out 15% Video Split)
**Test Set Samples**: 12,102 frames
---
## 1. Comparative Model Leaderboard

| Model Architecture | Accuracy | Precision (Weighted) | Recall (Weighted) | F1-Score (Weighted) | Latency (ms) | Throughput (FPS) | Model Size |
|---|---|---|---|---|---|---|---|
| **Logistic Regression** | 60.40% | 61.22% | 60.40% | 60.07% | 0.43 ms | 2,329 FPS | 3.1 KB |
| **Random Forest** | 72.74% | 75.23% | 72.74% | 73.41% | 32.52 ms | 31 FPS | 34990.9 KB |
| **Gradient Boosting** | 72.88% | 74.93% | 72.88% | 73.52% | 1.23 ms | 813 FPS | 729.9 KB |
| **Support Vector Machine (Linear)** | 56.89% | 58.76% | 56.89% | 56.72% | 4.60 ms | 217 FPS | 12.0 KB |

## 2. Confusion Matrices & Per-Class Performance

### Logistic Regression
- **Overall F1-Score**: 60.07%
- **Inference Speed**: 2,329 FPS (0.429 ms/sample)

**Class Performance Breakdown:**
| Exercise Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| `jumping_jack` | 69.4% | 67.7% | 68.5% | 3,721 |
| `pull_up` | 43.0% | 65.2% | 51.8% | 2,015 |
| `push_up` | 82.3% | 70.7% | 76.1% | 2,897 |
| `situp` | 55.5% | 58.5% | 57.0% | 1,995 |
| `squat` | 31.8% | 17.8% | 22.8% | 1,474 |


### Random Forest
- **Overall F1-Score**: 73.41%
- **Inference Speed**: 31 FPS (32.52 ms/sample)

**Class Performance Breakdown:**
| Exercise Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| `jumping_jack` | 89.7% | 77.7% | 83.3% | 3,721 |
| `pull_up` | 52.6% | 76.3% | 62.3% | 2,015 |
| `push_up` | 83.6% | 75.3% | 79.2% | 2,897 |
| `situp` | 70.1% | 63.6% | 66.7% | 1,995 |
| `squat` | 60.1% | 62.8% | 61.4% | 1,474 |


### Gradient Boosting
- **Overall F1-Score**: 73.52%
- **Inference Speed**: 813 FPS (1.23 ms/sample)

**Class Performance Breakdown:**
| Exercise Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| `jumping_jack` | 90.9% | 80.6% | 85.4% | 3,721 |
| `pull_up` | 54.8% | 70.6% | 61.7% | 2,015 |
| `push_up` | 83.2% | 71.4% | 76.8% | 2,897 |
| `situp` | 63.5% | 68.4% | 65.9% | 1,995 |
| `squat` | 61.5% | 65.6% | 63.5% | 1,474 |


### Support Vector Machine (Linear)
- **Overall F1-Score**: 56.72%
- **Inference Speed**: 217 FPS (4.6 ms/sample)

**Class Performance Breakdown:**
| Exercise Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| `jumping_jack` | 66.3% | 56.3% | 60.9% | 3,721 |
| `pull_up` | 34.7% | 60.0% | 44.0% | 2,015 |
| `push_up` | 81.7% | 74.0% | 77.7% | 2,897 |
| `situp` | 57.5% | 62.0% | 59.6% | 1,995 |
| `squat` | 29.3% | 13.5% | 18.5% | 1,474 |

