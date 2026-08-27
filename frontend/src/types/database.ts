export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'athlete' | 'coach' | 'researcher' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      athlete_profiles: {
        Row: {
          id: string;
          user_id: string;
          training_level: string;
          fitness_goal: string;
          fitness_goals: string;
          sport: string;
          height_cm: number | null;
          weight_kg: number | null;
          date_of_birth: string | null;
          gender: string | null;
          anonymized_subject_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          training_level?: string;
          fitness_goal?: string;
          fitness_goals?: string;
          sport?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          date_of_birth?: string | null;
          gender?: string | null;
          anonymized_subject_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          training_level?: string;
          fitness_goal?: string;
          fitness_goals?: string;
          sport?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          date_of_birth?: string | null;
          gender?: string | null;
          anonymized_subject_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      coach_profiles: {
        Row: {
          id: string;
          user_id: string;
          specialization: string;
          experience_years: number;
          bio: string | null;
          organization: string | null;
          certifications: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          specialization?: string;
          experience_years?: number;
          bio?: string | null;
          organization?: string | null;
          certifications?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          specialization?: string;
          experience_years?: number;
          bio?: string | null;
          organization?: string | null;
          certifications?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      coach_athlete_relationships: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          status: 'pending' | 'active' | 'rejected' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_id: string;
          status?: 'pending' | 'active' | 'rejected' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          athlete_id?: string;
          status?: 'pending' | 'active' | 'rejected' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: number;
          name: string;
          slug: string;
          target_muscles: string;
          description: string;
          default_camera_angle: string;
          camera_setup_instructions: string;
          ideal_rom_degrees: number;
          normative_cadence_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          target_muscles: string;
          description: string;
          default_camera_angle?: string;
          camera_setup_instructions: string;
          ideal_rom_degrees?: number;
          normative_cadence_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          target_muscles?: string;
          description?: string;
          default_camera_angle?: string;
          camera_setup_instructions?: string;
          ideal_rom_degrees?: number;
          normative_cadence_seconds?: number;
          created_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          coach_id: string | null;
          athlete_id: string;
          exercise_id: number | null;
          title: string;
          description: string | null;
          target_sets: number;
          target_reps: number;
          target_tempo: string;
          target_rom: number;
          notes: string | null;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          athlete_id: string;
          exercise_id?: number | null;
          title: string;
          description?: string | null;
          target_sets?: number;
          target_reps?: number;
          target_tempo?: string;
          target_rom?: number;
          notes?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          athlete_id?: string;
          exercise_id?: number | null;
          title?: string;
          description?: string | null;
          target_sets?: number;
          target_reps?: number;
          target_tempo?: string;
          target_rom?: number;
          notes?: string | null;
          is_completed?: boolean;
          created_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          athlete_id: string;
          exercise_id: number;
          session_type: 'LIVE_CAMERA' | 'VIDEO_UPLOAD';
          video_url: string | null;
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
          feedback_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          exercise_id: number;
          session_type?: 'LIVE_CAMERA' | 'VIDEO_UPLOAD';
          video_url?: string | null;
          duration_seconds?: number;
          total_reps?: number;
          valid_reps?: number;
          overall_score?: number;
          alignment_score?: number;
          rom_score?: number;
          symmetry_score?: number;
          tempo_score?: number;
          stability_score?: number;
          model_version?: string;
          feedback_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          exercise_id?: number;
          session_type?: 'LIVE_CAMERA' | 'VIDEO_UPLOAD';
          video_url?: string | null;
          duration_seconds?: number;
          total_reps?: number;
          valid_reps?: number;
          overall_score?: number;
          alignment_score?: number;
          rom_score?: number;
          symmetry_score?: number;
          tempo_score?: number;
          stability_score?: number;
          model_version?: string;
          feedback_summary?: string | null;
          created_at?: string;
        };
      };
      exercise_sessions: {
        Row: {
          id: string;
          workout_session_id: string;
          exercise_id: number;
          set_number: number;
          target_reps: number;
          completed_reps: number;
          average_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_session_id: string;
          exercise_id: number;
          set_number?: number;
          target_reps?: number;
          completed_reps?: number;
          average_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_session_id?: string;
          exercise_id?: number;
          set_number?: number;
          target_reps?: number;
          completed_reps?: number;
          average_score?: number;
          created_at?: string;
        };
      };
      repetitions: {
        Row: {
          id: string;
          session_id: string;
          exercise_session_id: string | null;
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
          phase_durations: Json | null;
          detected_errors: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_session_id?: string | null;
          rep_number: number;
          start_time: number;
          end_time: number;
          duration_seconds: number;
          rep_score: number;
          alignment_score?: number;
          rom_score?: number;
          symmetry_score?: number;
          tempo_score?: number;
          stability_score?: number;
          peak_angle?: number;
          min_angle?: number;
          is_valid?: boolean;
          phase_durations?: Json | null;
          detected_errors?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_session_id?: string | null;
          rep_number?: number;
          start_time?: number;
          end_time?: number;
          duration_seconds?: number;
          rep_score?: number;
          alignment_score?: number;
          rom_score?: number;
          symmetry_score?: number;
          tempo_score?: number;
          stability_score?: number;
          peak_angle?: number;
          min_angle?: number;
          is_valid?: boolean;
          phase_durations?: Json | null;
          detected_errors?: Json | null;
          created_at?: string;
        };
      };
      technique_analysis: {
        Row: {
          id: string;
          session_id: string;
          exercise_session_id: string | null;
          repetition_id: string | null;
          model_name: string;
          model_version: string;
          overall_score: number;
          confidence: number;
          range_of_motion: number | null;
          symmetry: number | null;
          tempo: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_session_id?: string | null;
          repetition_id?: string | null;
          model_name?: string;
          model_version?: string;
          overall_score: number;
          confidence?: number;
          range_of_motion?: number | null;
          symmetry?: number | null;
          tempo?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_session_id?: string | null;
          repetition_id?: string | null;
          model_name?: string;
          model_version?: string;
          overall_score?: number;
          confidence?: number;
          range_of_motion?: number | null;
          symmetry?: number | null;
          tempo?: number | null;
          created_at?: string;
        };
      };
      technique_issues: {
        Row: {
          id: string;
          analysis_id: string | null;
          session_id: string;
          repetition_id: string | null;
          error_code: string;
          error_name: string;
          issue_type: string;
          severity: 'low' | 'mild' | 'moderate' | 'high' | 'severe' | 'critical';
          confidence: number;
          description: string;
          corrective_instruction: string;
          timestamp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id?: string | null;
          session_id: string;
          repetition_id?: string | null;
          error_code: string;
          error_name: string;
          issue_type?: string;
          severity?: 'low' | 'mild' | 'moderate' | 'high' | 'severe' | 'critical';
          confidence?: number;
          description: string;
          corrective_instruction: string;
          timestamp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string | null;
          session_id?: string;
          repetition_id?: string | null;
          error_code?: string;
          error_name?: string;
          issue_type?: string;
          severity?: 'low' | 'mild' | 'moderate' | 'high' | 'severe' | 'critical';
          confidence?: number;
          description?: string;
          corrective_instruction?: string;
          timestamp?: number;
          created_at?: string;
        };
      };
      technique_scores: {
        Row: {
          id: string;
          session_id: string;
          metric_name: string;
          score_value: number;
          benchmark_target: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          metric_name: string;
          score_value: number;
          benchmark_target?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          metric_name?: string;
          score_value?: number;
          benchmark_target?: number | null;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          athlete_id: string;
          title: string;
          description: string | null;
          target_value: number;
          current_value: number;
          unit: string;
          status: 'in_progress' | 'achieved' | 'abandoned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          title: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          unit?: string;
          status?: 'in_progress' | 'achieved' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          title?: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          unit?: string;
          status?: 'in_progress' | 'achieved' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_records: {
        Row: {
          id: string;
          athlete_id: string;
          sleep_date: string;
          bedtime: string | null;
          wake_time: string | null;
          duration_minutes: number;
          total_sleep_minutes: number;
          quality: number;
          sleep_quality_score: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          sleep_date: string;
          bedtime?: string | null;
          wake_time?: string | null;
          duration_minutes?: number;
          total_sleep_minutes?: number;
          quality?: number;
          sleep_quality_score?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          sleep_date?: string;
          bedtime?: string | null;
          wake_time?: string | null;
          duration_minutes?: number;
          total_sleep_minutes?: number;
          quality?: number;
          sleep_quality_score?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      nutrition_records: {
        Row: {
          id: string;
          athlete_id: string;
          date: string;
          meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
          description: string;
          meal_description: string;
          protein: number;
          protein_g: number;
          carbohydrates: number;
          carbs_g: number;
          fat: number;
          fats_g: number;
          calories: number;
          water_ml: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          date?: string;
          meal_type?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
          description?: string;
          meal_description?: string;
          protein?: number;
          protein_g?: number;
          carbohydrates?: number;
          carbs_g?: number;
          fat?: number;
          fats_g?: number;
          calories?: number;
          water_ml?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          date?: string;
          meal_type?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
          description?: string;
          meal_description?: string;
          protein?: number;
          protein_g?: number;
          carbohydrates?: number;
          carbs_g?: number;
          fat?: number;
          fats_g?: number;
          calories?: number;
          water_ml?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      recovery_records: {
        Row: {
          id: string;
          athlete_id: string;
          date: string;
          soreness: number;
          soreness_level: number;
          fatigue: number;
          fatigue_level: number;
          sleep_quality: number;
          training_load: number;
          training_load_estimate: number;
          readiness_score: number;
          calculated_readiness_score: number;
          stress_level: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          date?: string;
          soreness?: number;
          soreness_level?: number;
          fatigue?: number;
          fatigue_level?: number;
          sleep_quality?: number;
          training_load?: number;
          training_load_estimate?: number;
          readiness_score?: number;
          calculated_readiness_score?: number;
          stress_level?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          date?: string;
          soreness?: number;
          soreness_level?: number;
          fatigue?: number;
          fatigue_level?: number;
          sleep_quality?: number;
          training_load?: number;
          training_load_estimate?: number;
          readiness_score?: number;
          calculated_readiness_score?: number;
          stress_level?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          severity: 'INFO' | 'WARNING' | 'ALERT';
          read: boolean;
          is_read: boolean;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          message: string;
          severity?: 'INFO' | 'WARNING' | 'ALERT';
          read?: boolean;
          is_read?: boolean;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          severity?: 'INFO' | 'WARNING' | 'ALERT';
          read?: boolean;
          is_read?: boolean;
          category?: string;
          created_at?: string;
        };
      };
      coach_comments: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          session_id: string | null;
          repetition_id: string | null;
          comment: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_id: string;
          session_id?: string | null;
          repetition_id?: string | null;
          comment?: string;
          content?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          athlete_id?: string;
          session_id?: string | null;
          repetition_id?: string | null;
          comment?: string;
          content?: string;
          created_at?: string;
        };
      };
      model_versions: {
        Row: {
          id: number;
          model_name: string;
          model_type: string;
          version: string;
          version_tag: string;
          description: string | null;
          dataset: string;
          feature_version: string;
          accuracy: number | null;
          precision: number | null;
          recall: number | null;
          f1_score: number | null;
          test_accuracy: number | null;
          test_f1: number | null;
          latency_fps: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          model_name: string;
          model_type: string;
          version?: string;
          version_tag: string;
          description?: string | null;
          dataset?: string;
          feature_version?: string;
          accuracy?: number | null;
          precision?: number | null;
          recall?: number | null;
          f1_score?: number | null;
          test_accuracy?: number | null;
          test_f1?: number | null;
          latency_fps?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          model_name?: string;
          model_type?: string;
          version?: string;
          version_tag?: string;
          description?: string | null;
          dataset?: string;
          feature_version?: string;
          accuracy?: number | null;
          precision?: number | null;
          recall?: number | null;
          f1_score?: number | null;
          test_accuracy?: number | null;
          test_f1?: number | null;
          latency_fps?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      analysis_results: {
        Row: {
          id: string;
          model_version_id: number | null;
          dataset_name: string;
          sample_count: number;
          accuracy: number | null;
          f1_score: number | null;
          precision: number | null;
          recall: number | null;
          confusion_matrix: Json | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_version_id?: number | null;
          dataset_name: string;
          sample_count?: number;
          accuracy?: number | null;
          f1_score?: number | null;
          precision?: number | null;
          recall?: number | null;
          confusion_matrix?: Json | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          model_version_id?: number | null;
          dataset_name?: string;
          sample_count?: number;
          accuracy?: number | null;
          f1_score?: number | null;
          precision?: number | null;
          recall?: number | null;
          confusion_matrix?: Json | null;
          latency_ms?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
