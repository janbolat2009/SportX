export type UserRole = 'athlete' | 'coach' | 'researcher' | 'admin';

export interface User {
  id: number | string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ExerciseCategory {
  id: number;
  name: string;
  name_en?: string;
  name_ru?: string;
  name_kk?: string;
  slug: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
  description_kk?: string;
  icon_name?: string;
  display_order?: number;
}

export interface Exercise {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  name_en?: string;
  name_ru?: string;
  name_kk?: string;
  slug: string;
  target_muscles: string;
  target_muscles_en?: string;
  target_muscles_ru?: string;
  target_muscles_kk?: string;
  secondary_muscles?: string;
  secondary_muscles_en?: string;
  secondary_muscles_ru?: string;
  secondary_muscles_kk?: string;
  description: string;
  description_en?: string;
  description_ru?: string;
  description_kk?: string;
  starting_position?: string;
  starting_position_en?: string;
  starting_position_ru?: string;
  starting_position_kk?: string;
  instructions?: string;
  instructions_en?: string;
  instructions_ru?: string;
  instructions_kk?: string;
  breathing?: string;
  breathing_en?: string;
  breathing_ru?: string;
  breathing_kk?: string;
  common_mistakes?: string;
  common_mistakes_en?: string;
  common_mistakes_ru?: string;
  common_mistakes_kk?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite' | string;
  difficulty_en?: string;
  difficulty_ru?: string;
  difficulty_kk?: string;
  equipment?: string;
  equipment_en?: string;
  equipment_ru?: string;
  equipment_kk?: string;
  default_camera_angle?: string;
  camera_angle_en?: string;
  camera_angle_ru?: string;
  camera_angle_kk?: string;
  camera_height_en?: string;
  camera_height_ru?: string;
  camera_height_kk?: string;
  camera_distance_en?: string;
  camera_distance_ru?: string;
  camera_distance_kk?: string;
  body_visibility_en?: string;
  body_visibility_ru?: string;
  body_visibility_kk?: string;
  camera_setup_instructions?: string;
  camera_instructions_en?: string;
  camera_instructions_ru?: string;
  camera_instructions_kk?: string;
  ideal_rom_degrees?: number;
  normative_cadence_seconds?: number;
  analysis_supported?: boolean;
  analysis_available?: boolean;
  video_url?: string | null;
  youtube_id?: string | null;
  thumbnail_url?: string | null;
}

export interface TechniqueIssue {
  id?: number;
  error_code: string;
  error_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  corrective_instruction: string;
  timestamp: number;
}

export interface Repetition {
  id: number;
  rep_number: number;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  rep_score: number;
  alignment_score: number;
  rom_score: number;
  symmetry_score: number;
  tempo_score: number;
  stability_score: number;
  peak_angle: number;
  min_angle: number;
  is_valid: boolean;
  phase_durations?: Record<string, number>;
  detected_errors?: TechniqueIssue[];
}

export interface WorkoutSession {
  id: number;
  athlete_id: number;
  exercise_id: number;
  exercise_name?: string;
  exercise_slug?: string;
  session_type: 'LIVE_CAMERA' | 'VIDEO_UPLOAD';
  video_url?: string;
  duration_seconds: number;
  total_reps: number;
  valid_reps: number;
  overall_score: number;
  alignment_score: number;
  rom_score: number;
  symmetry_score: number;
  tempo_score: number;
  stability_score: number;
  model_version: string;
  feature_version: string;
  scoring_version: string;
  feedback_summary?: string;
  created_at: string;
  repetitions: Repetition[];
  issues: TechniqueIssue[];
}

export interface LiveAnalysisFrameResult {
  exercise: string;
  phase: string;
  current_rep: number;
  instantaneous_score: number;
  primary_joint_angle: number;
  secondary_joint_angle: number;
  symmetry_ratio: number;
  torso_angle: number;
  is_in_frame: boolean;
  confidence: number;
  detected_issue?: string | null;
  corrective_instruction?: string | null;
  severity?: 'mild' | 'moderate' | 'severe' | null;
  rep_completed: boolean;
  completed_rep_data?: Repetition | null;
}

export interface AthleteProfile {
  id: number;
  user_id: number;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  sport: string;
  training_level: string;
  fitness_goals?: string;
  anonymized_subject_id: string;
  full_name?: string;
  email?: string;
}

export interface SleepRecord {
  id: number;
  athlete_id: number;
  log_date: string;
  bedtime?: string;
  wake_time?: string;
  total_sleep_minutes: number;
  sleep_quality_score: number;
  consistency_score: number;
  notes?: string;
  created_at: string;
}

export interface NutritionRecord {
  id: number;
  athlete_id: number;
  log_date: string;
  meal_type: string;
  meal_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  water_ml: number;
  notes?: string;
  created_at: string;
}

export interface RecoveryRecord {
  id: number;
  athlete_id: number;
  log_date: string;
  soreness_level: number;
  fatigue_level: number;
  stress_level: number;
  calculated_readiness_score: number;
  training_load_estimate: number;
  notes?: string;
  created_at: string;
}

export interface HolisticSummary {
  sleep: {
    average_hours: number;
    average_quality_score: number;
    consistency_score: number;
    records_count: number;
    recent_records: Array<{
      date: string;
      hours: number;
      quality: number;
      bedtime?: string;
      wake_time?: string;
    }>;
  };
  nutrition: {
    total_calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    water_ml: number;
    macros_ratio: {
      protein_pct: number;
      carbs_pct: number;
      fats_pct: number;
    };
  };
  recovery: {
    average_readiness: number;
    latest_readiness: number;
    latest_soreness: number;
    latest_fatigue: number;
    latest_stress: number;
    recent_trend: Array<{
      date: string;
      readiness: number;
      soreness: number;
      fatigue: number;
    }>;
  };
}

export interface AssignedWorkout {
  id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_slug?: string;
  target_sets: number;
  target_reps: number;
  target_tempo: string;
  target_rom: number;
  notes?: string;
  status?: string;
}

export type AssignedExercise = AssignedWorkout;

export interface CoachRosterAthlete {
  athlete_id: number;
  user_id: number;
  full_name: string;
  email: string;
  sport: string;
  training_level: string;
  anonymized_subject_id: string;
  total_sessions: number;
  recent_average_score: number;
  average_technique_score?: number;
  latest_session_exercise: string;
  latest_session_score?: number | null;
  latest_session_date: string;
  pending_assignments: number;
  status: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  is_read: boolean;
  category: string;
  created_at: string;
}

export interface DatasetItem {
  id: number;
  dataset_name: string;
  slug: string;
  source: string;
  url?: string;
  license: string;
  sample_count: number;
  subject_count: number;
  exercises_covered: string;
  labels_description: string;
  has_technique_labels: boolean;
  legal_research_use: boolean;
  limitations: string;
}

export interface ModelBenchmarkResult {
  benchmark_metadata: {
    n_samples_total: number;
    n_subjects_total: number;
    train_samples: number;
    test_samples: number;
    classes: string[];
    split_type: string;
  };
  models: {
    random_forest: ModelEvalMetrics;
    gradient_boosting: ModelEvalMetrics;
    temporal_cnn: ModelEvalMetrics;
    biomechanical_rules: ModelEvalMetrics;
  };
}

export interface ModelEvalMetrics {
  model_type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  latency_ms: number;
  latency_fps: number;
  n_samples: number;
}

export interface HumanAiAgreementStats {
  evaluation_count: number;
  agreement_metrics: {
    n_evaluations: number;
    pearson_r: number;
    pearson_p_value: number;
    spearman_rho: number;
    spearman_p_value: number;
    mae: number;
    mean_bias: number;
    limits_of_agreement: [number, number];
    cohens_kappa: number;
    agreement_strength: string;
  };
  sample_comparisons: Array<{
    sample_id: number;
    human_score: number;
    ai_score: number;
    score_delta: number;
    human_error?: string | null;
    ai_error?: string | null;
  }>;
}
