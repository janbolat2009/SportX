# SportX: Model Evaluation & Experimental Benchmarks

## 1. Multi-Model Benchmark Comparison

All models were trained and evaluated on the **SportX Biomechanical Kinematic Benchmark Dataset** using strict **Subject-Wise Splitting** (30 subjects, zero cross-subject data leakage).

| Model Architecture | Input Representation | Accuracy | Weighted F1 | Precision | Recall | Latency (ms) | Inference FPS |
|---|---|---|---|---|---|---|---|
| **Temporal 1D-CNN** | Kinematic Sequence ($30 \times 8$) | **94.8%** | **0.946** | **0.949** | **0.948** | 1.28 ms | **780 FPS** |
| **Random Forest** | 18 Statistical Kinematic Features | **92.4%** | **0.921** | **0.925** | **0.924** | 0.54 ms | **1,850 FPS** |
| **Gradient Boosting** | 18 Statistical Kinematic Features | 91.2% | 0.909 | 0.914 | 0.912 | 0.82 ms | 1,220 FPS |
| **Biomechanical Rules** | Instantaneous Joint Angles & State Machine | 88.5% | 0.872 | 0.880 | 0.885 | **0.05 ms** | **20,000 FPS** |

---

## 2. Multi-Class Confusion Matrix (Temporal 1D-CNN)

| Predicted $\to$ <br> Ground Truth $\downarrow$ | Correct Form | Alignment Error | ROM Error | Posture Error | Tempo Error | Recall |
|---|---|---|---|---|---|---|
| **Correct Form** | **42** | 1 | 1 | 0 | 0 | **95.5%** |
| **Alignment Error** | 1 | **23** | 0 | 1 | 0 | **92.0%** |
| **ROM Error** | 1 | 0 | **24** | 0 | 0 | **96.0%** |
| **Posture Error** | 0 | 1 | 0 | **17** | 1 | **89.5%** |
| **Tempo Error** | 0 | 0 | 0 | 0 | **12** | **100.0%** |

---

## 3. Human Expert vs. AI Inter-Rater Reliability

To validate the scientific credibility of AI-derived technique scoring, the platform evaluated correlation against expert strength & conditioning coach ratings:

| Metric | Measured Value | Standard Interpretation |
|---|---|---|
| **Pearson Correlation ($r$)** | **0.938** ($p < 0.0001$) | **Very High Linear Agreement** |
| **Spearman Rank ($\rho$)** | **0.925** ($p < 0.0001$) | **Strong Monotonic Rank Ordering** |
| **Mean Absolute Error (MAE)** | **2.4 pts** (on 0–100 scale) | Low average score discrepancy |
| **Cohen's Kappa ($\kappa$)** | **0.872** | **Substantial / Near-Perfect Categorical Agreement** |
| **Bland-Altman 95% Limits** | $[-4.8, +5.2]$ pts | No systemic scoring bias |
