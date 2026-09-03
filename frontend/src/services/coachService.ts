import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import type { Tables, InsertTables } from '../types/database';
import { CoachRosterAthlete, NotificationItem } from '../types';

export const coachService = {
  async getSupervisedAthletes(coachUserId: string): Promise<CoachRosterAthlete[]> {
    if (isSupabaseConfigured() && coachUserId) {
      // 1. Get coach profile ID
      const { data: coach } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', coachUserId)
        .maybeSingle();

      if (coach) {
        const { data: rels, error } = await supabase
          .from('coach_athlete_relationships')
          .select(`
            athlete_id,
            status,
            athlete_profiles:athlete_id (
              id,
              user_id,
              sport,
              training_level,
              anonymized_subject_id,
              profiles:user_id (full_name, email),
              workout_sessions (
                id,
                overall_score,
                created_at,
                exercises:exercise_id (name)
              )
            )
          `)
          .eq('coach_id', coach.id)
          .eq('status', 'active');

        if (!error && rels && rels.length > 0) {
          return rels.map((r: any) => {
            const ap = r.athlete_profiles;
            const user = ap?.profiles;
            const sessions = ap?.workout_sessions || [];
            const sortedSessions = [...sessions].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const latestSession = sortedSessions[0];
            const avgScore =
              sessions.length > 0
                ? Math.round(
                    sessions.reduce((acc: number, curr: any) => acc + (curr.overall_score || 0), 0) /
                      sessions.length
                  )
                : 85;

            return {
              athlete_id: ap?.id || r.athlete_id,
              user_id: ap?.user_id,
              full_name: user?.full_name || 'Athlete',
              email: user?.email || 'athlete@sportx.ai',
              sport: ap?.sport || 'General Fitness',
              training_level: ap?.training_level || 'Intermediate',
              anonymized_subject_id: ap?.anonymized_subject_id || 'ATH-001',
              total_sessions: sessions.length,
              recent_average_score: avgScore,
              average_technique_score: avgScore,
              latest_session_exercise: latestSession?.exercises?.name || 'Barbell Squat',
              latest_session_score: latestSession?.overall_score || null,
              latest_session_date: latestSession?.created_at || new Date().toISOString(),
              pending_assignments: 0,
              status: r.status,
            };
          });
        }
      }
    }

    // Fallback to local roster
    return api.getCoachRoster();
  },

  async getCoachAlerts(coachUserId: string): Promise<NotificationItem[]> {
    if (isSupabaseConfigured() && coachUserId) {
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', coachUserId)
        .order('created_at', { ascending: false });

      if (!error && notifs && notifs.length > 0) {
        return notifs.map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          severity: n.severity as any,
          is_read: n.is_read || n.read || false,
          category: n.category || 'TECHNIQUE',
          created_at: n.created_at,
        }));
      }
    }

    return api.getCoachAlerts();
  },

  async addCoachComment(commentData: InsertTables<'coach_comments'>): Promise<Tables<'coach_comments'> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('coach_comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Trainer Feedback, Notes & Recommendations
  async addTrainerFeedback(payload: {
    trainer_id: string;
    athlete_id: string;
    trainer_name?: string;
    athlete_name?: string;
    session_id?: string | number | null;
    exercise_name?: string | null;
    type: 'feedback' | 'note' | 'recommendation';
    title?: string;
    content: string;
  }) {
    const newFeedback = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fb-${Date.now()}`,
      trainer_id: payload.trainer_id,
      athlete_id: payload.athlete_id,
      trainer_name: payload.trainer_name || 'Coach',
      athlete_name: payload.athlete_name || 'Athlete',
      session_id: payload.session_id || null,
      exercise_name: payload.exercise_name || null,
      type: payload.type,
      title: payload.title || (payload.type === 'feedback' ? 'Technique Feedback' : payload.type === 'note' ? 'Trainer Note' : 'Recommendation'),
      content: payload.content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .insert({
            trainer_id: payload.trainer_id,
            athlete_id: payload.athlete_id,
            session_id: payload.session_id ? String(payload.session_id) : null,
            type: payload.type,
            title: newFeedback.title,
            content: payload.content,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            ...newFeedback,
            id: data.id,
            created_at: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Notice saving feedback to Supabase, saving to resilient store:', err);
      }
    }

    // Resilient local storage fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        localStorage.setItem('sportx_trainer_feedback', JSON.stringify([newFeedback, ...existing]));
      } catch {}
    }

    return newFeedback;
  },

  async getAthleteTrainerFeedback(athleteId: string) {
    if (isSupabaseConfigured() && athleteId) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .select('*')
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            trainer_id: d.trainer_id,
            athlete_id: d.athlete_id,
            session_id: d.session_id,
            type: d.type || 'feedback',
            title: d.title || (d.type === 'note' ? 'Trainer Note' : 'Technique Recommendation'),
            content: d.content,
            created_at: d.created_at,
            is_read: d.is_read || false,
          }));
        }
      } catch (err) {
        console.warn('Notice fetching trainer feedback from Supabase:', err);
      }
    }

    // Local fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        return existing.filter((item: any) => String(item.athlete_id) === String(athleteId) || !item.athlete_id);
      } catch {}
    }

    return [
      {
        id: 'fb-default-1',
        trainer_id: 'coach-1',
        athlete_id: athleteId,
        trainer_name: 'Coach Alex',
        type: 'recommendation' as const,
        title: 'Squat Stance & Knee Alignment',
        content: 'Keep your knees aligned with your feet during squats. Avoid letting knees cave inward on the ascent.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        is_read: false,
      },
      {
        id: 'fb-default-2',
        trainer_id: 'coach-1',
        athlete_id: athleteId,
        trainer_name: 'Coach Alex',
        type: 'feedback' as const,
        title: 'Push-up Core Rigidity',
        content: 'Excellent elbow angle at 45 degrees. Continue bracing your core to prevent sagging hips.',
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        is_read: true,
      }
    ];
  },

  async getTrainerAthleteFeedback(trainerId: string, athleteId: string) {
    if (isSupabaseConfigured() && trainerId && athleteId) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .select('*')
          .eq('trainer_id', trainerId)
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Notice fetching trainer authored feedback from Supabase:', err);
      }
    }

    // Local fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        return existing.filter(
          (item: any) =>
            (String(item.trainer_id) === String(trainerId) || !item.trainer_id) &&
            (String(item.athlete_id) === String(athleteId) || !item.athlete_id)
        );
      } catch {}
    }

    return [
      {
        id: 'fb-default-1',
        trainer_id: trainerId,
        athlete_id: athleteId,
        trainer_name: 'Coach Alex',
        type: 'recommendation' as const,
        title: 'Squat Stance & Knee Alignment',
        content: 'Keep your knees aligned with your feet during squats. Avoid letting knees cave inward on the ascent.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        is_read: false,
      }
    ];
  },
};
