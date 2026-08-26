import {
  User, Exercise, WorkoutSession, LiveAnalysisFrameResult, AthleteProfile,
  SleepRecord, NutritionRecord, RecoveryRecord, HolisticSummary, CoachRosterAthlete,
  NotificationItem, DatasetItem, ModelBenchmarkResult, HumanAiAgreementStats
} from '../types';

const API_BASE = '/api/v1';

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('sportx_token');
  const headers: HeadersInit = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Exercises
  async getExercises(): Promise<Exercise[]> {
    const res = await fetch(`${API_BASE}/exercises/`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch exercises');
    return res.json();
  },

  async getExerciseTaxonomy(slug: string) {
    const res = await fetch(`${API_BASE}/exercises/${slug}/taxonomy`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Real-time Analysis
  async analyzeLiveFrame(payload: {
    exercise_slug: string;
    frame_index: number;
    timestamp: number;
    landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
    session_state_id?: string;
  }): Promise<LiveAnalysisFrameResult> {
    const res = await fetch(`${API_BASE}/analysis/live-frame`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Live frame analysis error');
    return res.json();
  },

  async finalizeSession(sessionData: any): Promise<WorkoutSession> {
    const res = await fetch(`${API_BASE}/analysis/finalize-session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData)
    });
    if (!res.ok) throw new Error('Failed to save session');
    return res.json();
  },

  async uploadVideo(file: File, exerciseSlug: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('exercise_slug', exerciseSlug);

    const res = await fetch(`${API_BASE}/analysis/video`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Video processing failed');
    }
    return res.json();
  },

  async getSessionDetail(sessionId: number): Promise<WorkoutSession> {
    const res = await fetch(`${API_BASE}/analysis/sessions/${sessionId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch session detail');
    return res.json();
  },

  // Athlete Hub
  async getAthleteDashboard(): Promise<{
    athlete_name: string;
    sport: string;
    anonymized_subject_id: string;
    stats: {
      total_workouts: number;
      total_reps_analyzed: number;
      average_technique_score: number;
      pending_assigned_workouts: number;
    };
    score_trend: Array<{ date: string; score: number; exercise: string; reps: number }>;
    assigned_workouts: any[];
    holistic: HolisticSummary;
    recent_sessions: any[];
  }> {
    const res = await fetch(`${API_BASE}/athletes/me/dashboard`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load athlete dashboard');
    return res.json();
  },

  async getAthleteProfile(): Promise<AthleteProfile> {
    const res = await fetch(`${API_BASE}/athletes/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Holistic Tracking
  async logSleep(record: { log_date: string; bedtime?: string; wake_time?: string; total_sleep_minutes: number; sleep_quality_score: number; notes?: string }): Promise<SleepRecord> {
    const res = await fetch(`${API_BASE}/sleep/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    return res.json();
  },

  async logNutrition(record: { log_date: string; meal_type: string; meal_description: string; calories: number; protein_g: number; carbs_g: number; fats_g: number; water_ml: number; notes?: string }): Promise<NutritionRecord> {
    const res = await fetch(`${API_BASE}/nutrition/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    return res.json();
  },

  async logRecovery(record: { log_date: string; soreness_level: number; fatigue_level: number; stress_level: number; training_load_estimate: number; notes?: string }): Promise<RecoveryRecord> {
    const res = await fetch(`${API_BASE}/recovery/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    return res.json();
  },

  // Coach Command Center
  async getCoachRoster(): Promise<CoachRosterAthlete[]> {
    const res = await fetch(`${API_BASE}/coaches/roster`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch coach roster');
    return res.json();
  },

  async getAthleteDetailForCoach(athleteId: number) {
    const res = await fetch(`${API_BASE}/coaches/athletes/${athleteId}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async assignExercise(payload: {
    athlete_id: number;
    exercise_id: number;
    target_sets: number;
    target_reps: number;
    target_tempo: string;
    target_rom: number;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/coaches/assign-exercise`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async addCoachComment(payload: { session_id: number; repetition_id?: number; content: string }) {
    const res = await fetch(`${API_BASE}/coaches/comment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getCoachAlerts(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/coaches/alerts`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Research Laboratory
  async getDatasets(): Promise<DatasetItem[]> {
    const res = await fetch(`${API_BASE}/research/datasets`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async runBenchmark(payload: { model_type?: string; n_samples?: number }): Promise<ModelBenchmarkResult> {
    const res = await fetch(`${API_BASE}/research/run-benchmark`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model_type: payload.model_type || 'ALL',
        n_samples: payload.n_samples || 400
      })
    });
    return res.json();
  },

  async submitHumanEvaluation(payload: {
    session_id: number;
    repetition_id?: number;
    technique_score: number;
    detected_error?: string;
    severity?: string;
    comments?: string;
  }) {
    const res = await fetch(`${API_BASE}/research/human-evaluation`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getHumanAgreementStats(): Promise<HumanAiAgreementStats> {
    const res = await fetch(`${API_BASE}/research/human-agreement`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getExportData() {
    const res = await fetch(`${API_BASE}/research/export-data`, {
      headers: getHeaders()
    });
    return res.json();
  }
};
