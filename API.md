# SportX: REST API Specification

Base URL: `http://127.0.0.1:8000/api/v1`

---

## 1. Authentication
- `POST /auth/register`: Register new user (`athlete`, `coach`, `researcher`).
- `POST /auth/login`: Authenticate and receive JWT access token.
- `GET /auth/me`: Get current authenticated user profile.

---

## 2. Exercises & Taxonomy
- `GET /exercises/`: List supported exercise definitions (Squat, Push-up, Bicep Curl, Shoulder Press).
- `GET /exercises/{slug}`: Get exercise metadata and camera calibration guides.
- `GET /exercises/{slug}/taxonomy`: Get supported technique errors and corrective cues.

---

## 3. Biomechanics & Computer Vision Analysis
- `POST /analysis/live-frame`: Process real-time landmark stream from live camera.
- `POST /analysis/video`: Upload MP4/MOV video for complete frame extraction, rep segmentation, and technique scoring.
- `POST /analysis/finalize-session`: Save completed live camera workout session.
- `GET /analysis/sessions/{id}`: Drill-down into completed session, rep breakdown, and technique issues.

---

## 4. Athlete Hub & Holistic Tracking
- `GET /athletes/me`: Get athlete profile with anonymized subject ID.
- `GET /athletes/me/dashboard`: Holistic dashboard statistics, assigned workouts, and score trends.
- `POST /sleep/`: Log daily sleep record (bedtime, wake time, duration, quality).
- `POST /nutrition/`: Log meal details, calories, and macronutrient grams.
- `POST /recovery/`: Log muscle soreness, subjective fatigue, and calculate readiness index.

---

## 5. Coach Command Center
- `GET /coaches/roster`: List supervised athletes with recent technique scores and alert status.
- `GET /coaches/athletes/{id}`: Detailed athlete profile with session history and issue frequency.
- `POST /coaches/assign-exercise`: Prescribe custom workout (sets, reps, cadence tempo, target ROM).
- `POST /coaches/comment`: Leave coach technique feedback on a session.
- `GET /coaches/alerts`: Fetch prioritized technique alerts (`ALERT`, `WARNING`, `INFO`).

---

## 6. Scientific Research Laboratory
- `GET /research/datasets`: List registered research datasets.
- `POST /research/run-benchmark`: Execute live model comparison benchmark (Random Forest vs Temporal 1D-CNN vs Rules) with subject-wise splitting.
- `POST /research/human-evaluation`: Submit human coach rating for a session.
- `GET /research/human-agreement`: Calculate Pearson $r$, Spearman $\rho$, Cohen's $\kappa$, MAE, and limits of agreement.
- `GET /research/export-data`: Download anonymized kinematic research dataset in JSON format.
