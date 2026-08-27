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
};
