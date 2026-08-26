# SportX: Dataset Registry & Data Collection Protocol

## 1. Registered Dataset Catalog

| Dataset Name | Source | License | Samples | Subjects | Technique Labels | Role in SportX Pipeline |
|---|---|---|---|---|---|---|
| **SportX Biomechanical Kinematic Benchmark** | SportX Research Initiative | CC-BY-4.0 | 2,400 | 48 | Yes (5 Classes) | Primary algorithm benchmarking & cross-subject validation |
| **Kaggle Fitness Exercise Pose Classification** | Kaggle | CC0: Public Domain | 1,800 | 35 | No (Exercise types only) | Exercise recognition baseline |
| **RepCount Exercise Repetition Dataset** | Academic (CVPR) | Academic Research | 1,450 | 80 | Rep Timestamps | Temporal rep boundary calibration |
| **Physical Exercise Recognition Time Series** | UCI Repository | CC-BY-4.0 | 920 | 22 | Yes | Inertial & kinematic cross-reference |
| **MMLab Pose Exercise Benchmark** | OpenMMLab | Apache 2.0 | 3,200 | 60 | No (Pose accuracy) | Pose landmarker PCK / MPJPE validation |

---

## 2. Scientific Data Collection Protocol

To expand empirical datasets for future scientific studies involving young athletes, SportX establishes a standardized, reproducible collection protocol.

### 2.1 Participant Cohort Specifications
- **Demographics**: Adolescent and young athletes aged 12–21 across varied sports (track & field, soccer, basketball, swimming, gymnastics).
- **Inclusion Criteria**: Medically cleared for physical activity; signed informed consent / parental assent for minors.
- **Anonymization**: Every participant is assigned a cryptographic pseudo-anonymous subject ID (e.g. `SUBJ_YOUTH_001`). No personally identifying information is attached to video or kinematic tensors.

### 2.2 Recording Protocol
For each exercise (Squat, Push-up, Bicep Curl, Shoulder Press), recordings capture:
1. **Optimal Form Sets**: 3 sets of 10 repetitions performed according to normative biomechanical standards.
2. **Controlled Technique Deviations**: Guided sets with intentional, controlled movement deviations (e.g., knee valgus collapse, reduced squat depth, hip sag, excessive forward lean, rapid eccentric descent).
3. **Multi-Angle Synchronized Capture**: Frontal (0°), Diagonal (45°), and Sagittal (90°) camera angles.

### 2.3 Subject-Wise Splitting Protocol (Data Leakage Prevention)
To ensure valid generalization without memorizing subject morphology or individual cadence patterns:
- **70% of subjects** $\to$ Training Set
- **15% of subjects** $\to$ Validation Set
- **15% of subjects** $\to$ Test Set

**Rule**: All frames and repetitions from a given `subject_id` reside exclusively in one partition.
