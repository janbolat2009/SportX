# SportX: Research-Oriented AI Fitness & Biomechanics Platform

**SportX** is an AI-powered fitness and biomechanics platform engineered specifically for teenagers, young athletes, remote coaches, and sports science researchers. It analyzes exercise technique using computer vision and machine learning from camera feeds or uploaded video, detects biomechanical movement deviations, provides real-time corrective feedback, and tracks holistic athlete wellness (workouts, sleep, nutrition, recovery).

---

## ⚠️ Important Product & Ethical Principle

> **SportX is a fitness biomechanics and movement analysis platform, NOT a medical diagnostic system.**
> The system describes measurable kinematic movement deviations (e.g. *"Your knee angle is moving inward during the descent"*, *"Range of motion is below target"*) and explicitly avoids medical claims, clinical diagnoses, or injury guarantees.

---

## 🎯 Target User Personas

1. **Athlete (Young / Teen Athletes)**
   - Live Camera Studio with real-time pose estimation and canvas skeleton overlays.
   - Video Upload Studio with automated rep segmentation, angle metrics, and best/worst rep critique.
   - Holistic tracking: sleep records, nutrition meals, subjective soreness/fatigue, and calculated recovery readiness score.
   - View assigned workouts and coaching comments from remote coaches.

2. **Coach (Strength & Conditioning Coaches)**
   - Athlete roster management with real-time technique scores and alert flags.
   - Detailed drill-down into athlete sessions, rep trajectories, and error distributions.
   - Structured workout assignment tool (target sets, reps, tempo, target ROM, custom cues).
   - Prioritized Technique Alert feed with configurable severity thresholds (`ALERT`, `WARNING`, `INFO`).

3. **Researcher / Sports Scientist**
   - Public & empirical Dataset Registry explorer with licensing and limitations documentation.
   - Live Model Comparison Benchmark runner (Random Forest, Gradient Boosting, Temporal 1D-CNN, Biomechanical Rules) on strict subject-wise train/test splits.
   - Human Coach Expert vs. AI Inter-Rater Reliability analysis (Pearson $r$, Spearman $\rho$, Cohen's $\kappa$, MAE, Bland-Altman limits).
   - Anonymized research dataset export (JSON/CSV) complying with GDPR and HIPAA Safe Harbor standards.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------------+
                                  |              React Frontend                 |
                                  |   (TypeScript + Vite + Tailwind CSS + HUD)  |
                                  +----------------------+----------------------+
                                                         |  REST API / Frames
                                                         v
                                  +---------------------------------------------+
                                  |               FastAPI Backend               |
                                  |       (Auth, Endpoints, SQLAlchemy ORM)     |
                                  +----------------------+----------------------+
                                                         |
                   +-------------------------------------+-------------------------------------+
                   |                                                                           |
                   v                                                                           v
+------------------------------------+                                      +------------------------------------+
|       CV & Biomechanics Engine     |                                      |      Machine Learning Suite        |
| - MediaPipe Pose (33 Landmarks)    |                                      | - Subject-Wise Data Splitter       |
| - Body-Relative Normalization      |                                      | - Synthetic Benchmark Generator    |
| - Kinematics Tracker (dt, d2t)     |                                      | - Random Forest / XGBoost Models   |
| - Bilateral Symmetry (BSI)         |                                      | - Temporal 1D-CNN / LSTM Models    |
| - Exercise State Machines:         |                                      | - Confusion Matrices & Latency     |
|   * Squat (Valgus, Depth, Lean)    |                                      | - Human vs. AI Inter-Rater Tool    |
|   * Push-up (Sag, Pike, Flare)     |                                      +------------------------------------+
|   * Bicep Curl (Drift, Swing)      |
|   * Shoulder Press (Lockout, Arch) |
+------------------------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup & Google Gemini Configuration
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure Google Gemini API Key (Backend Only)
# Create or edit .env in the project root or backend/.env:
# GEMINI_API_KEY=AIzaSy...your-actual-gemini-api-key
# GEMINI_MODEL=gemini-1.5-flash

# Start FastAPI backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/docs`.

> 🔒 **Security Notice**: `GEMINI_API_KEY` is loaded exclusively on the FastAPI backend server. It is never exposed in client JavaScript bundles or client `.env` files. If you update the key, restart the backend server with `uvicorn app.main:app --reload`.

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.


---

## 🔑 Demo Quick-Login Accounts

For seamless evaluation, SportX includes pre-configured demo personas:

| Role | Email | Password | Full Name | Persona Focus |
|---|---|---|---|---|
| **Athlete** | `athlete@sportx.ai` | `athlete123` | Alex Rivera | Live camera workouts, rep tracking, sleep/nutrition |
| **Coach** | `coach@sportx.ai` | `coach123` | Marcus Vance | Supervising roster, assigning programs, technique alerts |
| **Researcher** | `researcher@sportx.ai` | `research123` | Dr. Elena Rostova | Multi-model benchmarking, confusion matrices, data export |

*Note: You can switch personas instantly using the persona dropdown in the top-right navbar.*

---

## 🧪 Testing Strategy

Run the complete test suite covering authentication, biomechanics, exercise analyzers, scoring, holistic tracking, and ML models:

```bash
# Run backend tests
pytest backend/tests/ -v

# Run frontend build verification
cd frontend && npm run build
```

---

## 📚 Project Documentation Catalog
- [ARCHITECTURE.md](file:///c:/Users/lenovo/Documents/SportX/ARCHITECTURE.md) - System architecture and database schema
- [ML_PIPELINE.md](file:///c:/Users/lenovo/Documents/SportX/ML_PIPELINE.md) - Biomechanical equations, feature engineering, and model designs
- [DATASETS.md](file:///c:/Users/lenovo/Documents/SportX/DATASETS.md) - Dataset registry and scientific data collection protocol
- [MODEL_EVALUATION.md](file:///c:/Users/lenovo/Documents/SportX/MODEL_EVALUATION.md) - Benchmark metrics, confusion matrices, and latency
- [PRIVACY.md](file:///c:/Users/lenovo/Documents/SportX/PRIVACY.md) - Youth athlete privacy and local inference architecture
- [API.md](file:///c:/Users/lenovo/Documents/SportX/API.md) - REST API specification
- [RESEARCH.md](file:///c:/Users/lenovo/Documents/SportX/RESEARCH.md) - Research questions and methodology
- [DEVELOPMENT.md](file:///c:/Users/lenovo/Documents/SportX/DEVELOPMENT.md) - Development and deployment guide
