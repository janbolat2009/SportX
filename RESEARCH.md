# SportX: Scientific Research Framework & Methodology

## 1. Core Research Questions

SportX is engineered to serve as an empirical platform for answering key sports science and computer vision research questions:

1. **Kinematic Accuracy**: How accurately can 3D pose landmarks derived from single-camera RGB video classify discrete exercise technique errors in youth athletes compared with multi-camera 3D motion capture systems?
2. **Algorithm Architecture**: How do temporal sequence models (1D-CNN, Bi-LSTM) compare with classical ensemble classifiers (Random Forest, Gradient Boosting) and deterministic biomechanical rule state machines in error detection F1-score and inference latency?
3. **Inter-Rater Reliability**: What is the degree of statistical agreement (Pearson $r$, Cohen's $\kappa$) between AI automated technique scores and expert strength & conditioning coach evaluations?
4. **Generalizability**: How robust are normalized body-relative kinematic features against cross-subject anatomical variations, lighting conditions, clothing, and camera angles?

---

## 2. Hypothesis & Methodology

### 2.1 Hypothesis 1 (Scale Invariance)
*Normalizing landmark coordinates relative to instantaneous torso length ($L_{\text{torso}} = \|\mathbf{p}_{\text{mid\_shoulder}} - \mathbf{p}_{\text{mid\_hip}}\|_2$) significantly improves cross-subject classification F1-score compared to raw image coordinates.*

### 2.2 Hypothesis 2 (Temporal Modeling)
*Temporal sequence models incorporating 1st and 2nd derivative kinematic features achieve higher precision on dynamic errors (e.g. rapid descent tempo, momentum rocking) than single-frame static pose classifiers.*

---

## 3. Reproducibility & Model Versioning

To ensure full scientific reproducibility:
- Every analysis session permanently records:
  - `model_version`: (e.g., `sportx-temporal-cnn-v1.0`)
  - `feature_version`: (e.g., `pose-kinematics-v1.0`)
  - `scoring_version`: (e.g., `biomech-scoring-v1.0`)
  - Full kinematic tensor and frame trajectory records.
