import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import { exerciseService } from './exerciseService';
import type { Tables, InsertTables } from '../types/database';
import { Exercise, WorkoutSession, Repetition, AssignedWorkout } from '../types';

export const workoutService = {
  async getExercises(): Promise<Exercise[]> {
    return exerciseService.getExercises();
  },

  async getWorkoutSessions(athleteUserId?: string): Promise<WorkoutSession[]> {
    if (isSupabaseConfigured() && athleteUserId) {
      // 1. Get athlete profile ID
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data: sessions, error } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            exercises:exercise_id (name, slug),
            repetitions (*)
          `)
          .eq('athlete_id', athlete.id)
          .order('created_at', { ascending: false });

        if (!error && sessions) {
          return sessions.map((s: any) => ({
            id: s.id,
            athlete_id: s.athlete_id,
            exercise_id: s.exercise_id,
            exercise_name: s.exercises?.name || 'Workout',
            exercise_slug: s.exercises?.slug || 'squat',
            session_type: s.session_type,
            video_url: s.video_url,
            duration_seconds: s.duration_seconds,
            total_reps: s.total_reps,
            valid_reps: s.valid_reps,
            overall_score: s.overall_score,
            alignment_score: s.alignment_score,
            rom_score: s.rom_score,
            symmetry_score: s.symmetry_score,
            tempo_score: s.tempo_score,
            stability_score: s.stability_score,
            model_version: s.model_version,
            feature_version: 'v1.0',
            scoring_version: 'v1.0',
            feedback_summary: s.feedback_summary,
            created_at: s.created_at,
            repetitions: (s.repetitions || []).map((r: any) => ({
              id: r.id,
              rep_number: r.rep_number,
              start_time: r.start_time,
              end_time: r.end_time,
              duration_seconds: r.duration_seconds,
              rep_score: r.rep_score,
              alignment_score: r.alignment_score,
              rom_score: r.rom_score,
              symmetry_score: r.symmetry_score,
              tempo_score: r.tempo_score,
              stability_score: r.stability_score,
              peak_angle: r.peak_angle,
              min_angle: r.min_angle,
              is_valid: r.is_valid,
              phase_durations: r.phase_durations,
              detected_errors: r.detected_errors || []
            })),
            issues: []
          }));
        }
      }
    }

    // Fallback to local API
    return api.getAthleteSessions(1);
  },

  async getWorkoutSessionById(sessionId: string): Promise<WorkoutSession | null> {
    if (isSupabaseConfigured()) {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:exercise_id (name, slug),
          repetitions (*),
          technique_issues (*)
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (!error && session) {
        return {
          id: (session as any).id,
          athlete_id: (session as any).athlete_id,
          exercise_id: (session as any).exercise_id,
          exercise_name: (session as any).exercises?.name || 'Workout',
          exercise_slug: (session as any).exercises?.slug || 'squat',
          session_type: (session as any).session_type,
          video_url: (session as any).video_url,
          duration_seconds: (session as any).duration_seconds,
          total_reps: (session as any).total_reps,
          valid_reps: (session as any).valid_reps,
          overall_score: (session as any).overall_score,
          alignment_score: (session as any).alignment_score,
          rom_score: (session as any).rom_score,
          symmetry_score: (session as any).symmetry_score,
          tempo_score: (session as any).tempo_score,
          stability_score: (session as any).stability_score,
          model_version: (session as any).model_version,
          feature_version: 'v1.0',
          scoring_version: 'v1.0',
          feedback_summary: (session as any).feedback_summary,
          created_at: (session as any).created_at,
          repetitions: ((session as any).repetitions || []).map((r: any) => ({
            id: r.id,
            rep_number: r.rep_number,
            start_time: r.start_time,
            end_time: r.end_time,
            duration_seconds: r.duration_seconds,
            rep_score: r.rep_score,
            alignment_score: r.alignment_score,
            rom_score: r.rom_score,
            symmetry_score: r.symmetry_score,
            tempo_score: r.tempo_score,
            stability_score: r.stability_score,
            peak_angle: r.peak_angle,
            min_angle: r.min_angle,
            is_valid: r.is_valid,
            phase_durations: r.phase_durations,
            detected_errors: r.detected_errors || []
          })),
          issues: (session as any).technique_issues || []
        };
      }
    }

    return null;
  },

  async createWorkoutSession(sessionData: InsertTables<'workout_sessions'>): Promise<Tables<'workout_sessions'> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating workout session:', error.message);
      throw error;
    }
    return data;
  },

  async createRepetitions(reps: InsertTables<'repetitions'>[]): Promise<Tables<'repetitions'>[]> {
    if (!isSupabaseConfigured() || reps.length === 0) return [];

    const { data, error } = await supabase
      .from('repetitions')
      .insert(reps)
      .select();

    if (error) {
      console.error('Error creating repetitions:', error.message);
      throw error;
    }
    return data || [];
  },

  async getAssignedWorkouts(athleteUserId?: string): Promise<AssignedWorkout[]> {
    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises:exercise_id (name, slug)
          `)
          .eq('athlete_id', athlete.id)
          .eq('is_completed', false)
          .order('created_at', { ascending: false });

        if (!error && workouts) {
          return workouts.map((w: any) => ({
            id: w.id,
            exercise_id: w.exercise_id || 1,
            exercise_name: w.exercises?.name || w.title,
            exercise_slug: w.exercises?.slug || 'squat',
            target_sets: w.target_sets,
            target_reps: w.target_reps,
            target_tempo: w.target_tempo,
            target_rom: w.target_rom,
            notes: w.notes,
            status: w.is_completed ? 'completed' : 'pending'
          }));
        }
      }
    }

    // Fallback to local API
    return api.getAssignedExercises(1);
  },

  async assignWorkout(workoutData: InsertTables<'workouts'>): Promise<Tables<'workouts'> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('workouts')
      .insert(workoutData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
