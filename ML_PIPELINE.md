# SportX: Machine Learning & Biomechanical Pipeline Specification

## 1. Pipeline Data Flow

```
Camera / Uploaded Video Stream
            │
            ▼
Video Decoding & Preprocessing (OpenCV)
            │
            ▼
Pose Estimation (MediaPipe Pose 33 3D Keypoints)
            │
            ▼
Body-Relative Normalization & Coordinate Alignment
            │
            ▼
Kinematic & Geometric Feature Extraction (Angles, Velocities, Symmetry)
            │
            ▼
Deterministic Biomechanical State Machine (Phase & Rep Segmentation)
            │
            ▼
Multi-Model Technique Classifier (Rules / Random Forest / Temporal 1D-CNN)
            │
            ▼
Explainable Composite Technique Scoring (0–100 Breakdown)
            │
            ▼
Youth-Tailored Actionable Feedback Generator
```

---

## 2. Mathematical Formulations

### 2.1 Body-Relative Landmark Normalization
To make technique analysis invariant to subject height, limb proportions, and camera distance, raw landmarks $\mathbf{p}_i = (x_i, y_i, z_i)$ are centered on the mid-hip origin and scaled by the Torso Length $L_{\text{torso}}$:

$$\mathbf{p}_{\text{mid\_hip}} = \frac{\mathbf{p}_{\text{left\_hip}} + \mathbf{p}_{\text{right\_hip}}}{2}$$

$$\mathbf{p}_{\text{mid\_shoulder}} = \frac{\mathbf{p}_{\text{left\_shoulder}} + \mathbf{p}_{\text{right\_shoulder}}}{2}$$

$$L_{\text{torso}} = \|\mathbf{p}_{\text{mid\_shoulder}} - \mathbf{p}_{\text{mid\_hip}}\|_2$$

$$\tilde{\mathbf{p}}_i = \frac{\mathbf{p}_i - \mathbf{p}_{\text{mid\_hip}}}{L_{\text{torso}}}$$

### 2.2 3D Joint Angle Calculation
The joint angle $\theta$ formed at vertex joint $\mathbf{p}_2$ by adjacent connected joints $\mathbf{p}_1$ and $\mathbf{p}_3$:

$$\mathbf{u} = \mathbf{p}_1 - \mathbf{p}_2, \quad \mathbf{v} = \mathbf{p}_3 - \mathbf{p}_2$$

$$\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right) \times \frac{180^\circ}{\pi}$$

### 2.3 Kinematic Derivatives
Angular velocity $\omega(t)$ and angular acceleration $\alpha(t)$ are calculated using centered finite differences:

$$\omega(t) = \frac{\theta(t) - \theta(t - \Delta t)}{\Delta t}$$

$$\alpha(t) = \frac{\omega(t) - \omega(t - \Delta t)}{\Delta t}$$

### 2.4 Bilateral Symmetry Index (BSI)
Quantifies left vs. right joint symmetry as a percentage $[0, 100]\%$:

$$\text{BSI} = \max\left(0, 100 - \frac{|\theta_L - \theta_R|}{\max(\theta_L, \theta_R, 1.0)} \times 100\right)$$

### 2.5 Transparent Composite Scoring
The overall technique score $S \in [0, 100]$ is computed as a transparent weighted composite of distinct biomechanical attributes:

$$S = 0.30 \cdot S_{\text{align}} + 0.25 \cdot S_{\text{ROM}} + 0.20 \cdot S_{\text{sym}} + 0.15 \cdot S_{\text{tempo}} + 0.10 \cdot S_{\text{stab}}$$

Where:
- $S_{\text{align}}$: Joint alignment & absence of medial/lateral collapse (valgus, sag, flare).
- $S_{\text{ROM}}$: Excursion relative to normative range of motion target.
- $S_{\text{sym}}$: Mean bilateral symmetry index across the repetition cycle.
- $S_{\text{tempo}}$: Adherence to prescribed cadence (eccentric descent $\ge 2.0$s).
- $S_{\text{stab}}$: Movement smoothness and trunk stability.

---

## 3. Exercise Biomechanical State Machines

### 3.1 Squat State Machine
- **Phases**: `STANDING` ($\ge 155^\circ$) $\to$ `DESCENT` $\to$ `BOTTOM` ($\le 100^\circ$) $\to$ `ASCENT` $\to$ `STANDING`.
- **Valgus Detection**: Ratio of horizontal knee distance to ankle distance in normalized coordinates:
  $$\text{Valgus Ratio} = \frac{|x_{\text{rknee}} - x_{\text{lknee}}|}{|x_{\text{rankle}} - x_{\text{lankle}}|} < 0.72$$
- **Depth Check**: Repetition minimum knee angle $> 95^\circ \to$ `SQUAT_INSUFFICIENT_DEPTH`.
- **Torso Lean Check**: Absolute angle from vertical $> 45^\circ \to$ `SQUAT_EXCESSIVE_FORWARD_LEAN`.

### 3.2 Push-up State Machine
- **Phases**: `PLANK_TOP` ($\ge 150^\circ$) $\to$ `DESCENT` $\to$ `BOTTOM` ($\le 95^\circ$) $\to$ `ASCENT` $\to$ `PLANK_TOP`.
- **Plank Posture Check**: Shoulder-Hip-Ankle collinearity angle $< 155^\circ$:
  - Hip $y > y_{\text{line}} \to$ `PUSHUP_HIP_SAG`.
  - Hip $y < y_{\text{line}} \to$ `PUSHUP_HIP_PIKE`.
- **Elbow Flare**: Shoulder abduction angle $> 75^\circ \to$ `PUSHUP_ELBOW_FLARE`.

### 3.3 Bicep Curl State Machine
- **Phases**: `EXTENSION` ($\ge 145^\circ$) $\to$ `CONCENTRIC_CURL` $\to$ `PEAK_CONTRACTION` ($\le 60^\circ$) $\to$ `ECCENTRIC_LOWER` $\to$ `EXTENSION`.
- **Upper Arm Drift**: Shoulder-elbow angle $> 35^\circ \to$ `BICEP_CURL_ELBOW_DRIFT`.
- **Torso Rocking**: Angular trunk excursion during curl $> 14^\circ \to$ `BICEP_CURL_TORSO_MOMENTUM`.

### 3.4 Shoulder Press State Machine
- **Phases**: `RACK_POSITION` ($\le 95^\circ$) $\to$ `PRESS_ASCENT` $\to$ `LOCKOUT` ($\ge 158^\circ$) $\to$ `ECCENTRIC_DESCENT` $\to$ `RACK_POSITION`.
- **Incomplete Lockout**: Peak elbow extension $< 155^\circ \to$ `SHOULDER_PRESS_INCOMPLETE_LOCKOUT`.
- **Lumbar Hyperextension**: Backward trunk tilt $> 18^\circ \to$ `SHOULDER_PRESS_LUMBAR_HYPEREXTENSION`.

---

## 4. Machine Learning Model Architectures

### 4.1 Classical Feature Classifiers (Random Forest & Gradient Boosting)
- **Input**: 18-dimensional feature vector containing statistical moments (mean, min, max, std) of joint angles, angular velocities, ROM amplitude, and bilateral symmetry.
- **Model**: Random Forest with 100 balanced estimators, max depth 10.

### 4.2 Temporal Sequence Classifier (1D-CNN)
- **Input**: 3D tensor of shape $(B, T=30, C=8)$ across normalized time windows.
- **Channels**: Left Knee, Right Knee, Hip Angle, Torso Angle, Elbow Angle, Knee Velocity, Hip Velocity, Symmetry Trajectory.
- **Feature Layer**: Multi-scale 1D temporal convolution filter banks extracting 1st/2nd derivative kernel responses + statistical moments.
- **Classification Head**: Multi-Layer Perceptron (64 $\to$ 32 $\to$ 5 classes) predicting: `Correct`, `Alignment Error`, `ROM Error`, `Posture Error`, `Tempo Error`.
