import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import { RecoveryRecord } from '../types';

export const recoveryService = {
  async getRecoveryRecords(athleteUserId?: string, limit = 7): Promise<RecoveryRecord[]> {
    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('recovery_records')
          .select('*')
          .eq('athlete_id', athlete.id)
          .order('date', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            athlete_id: d.athlete_id,
            log_date: d.date,
            soreness_level: d.soreness_level || d.soreness || 3,
            fatigue_level: d.fatigue_level || d.fatigue || 3,
            stress_level: d.stress_level || 2,
            calculated_readiness_score: d.calculated_readiness_score || d.readiness_score || 85,
            training_load_estimate: d.training_load_estimate || d.training_load || 50,
            notes: d.notes,
            created_at: d.created_at,
          }));
        }
      }
    }

    return [];
  },

  async logRecovery(
    record: {
      log_date: string;
      soreness_level: number;
      fatigue_level: number;
      stress_level: number;
      training_load_estimate: number;
      notes?: string;
    },
    athleteUserId?: string
  ): Promise<any> {
    const calculatedReadiness = Math.max(
      30,
      Math.min(
        100,
        Math.round(100 - (record.soreness_level * 3.5 + record.fatigue_level * 4.0 + record.stress_level * 2.5))
      )
    );

    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('recovery_records')
          .upsert(
            {
              athlete_id: athlete.id,
              date: record.log_date,
              soreness: record.soreness_level,
              soreness_level: record.soreness_level,
              fatigue: record.fatigue_level,
              fatigue_level: record.fatigue_level,
              stress_level: record.stress_level,
              training_load: record.training_load_estimate,
              training_load_estimate: record.training_load_estimate,
              readiness_score: calculatedReadiness,
              calculated_readiness_score: calculatedReadiness,
              notes: record.notes,
            },
            { onConflict: 'athlete_id,date' }
          )
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    return api.logRecovery(record);
  },

  async getReadinessScore(athleteUserId?: string): Promise<{
    readiness_score: number;
    training_recommendation: string;
    recovery_status: string;
  }> {
    if (isSupabaseConfigured() && athleteUserId) {
      const records = await recoveryService.getRecoveryRecords(athleteUserId, 1);
      if (records.length > 0) {
        const score = records[0].calculated_readiness_score;
        let status = 'Prime';
        let rec = 'Optimal condition for technique training.';
        if (score < 60) {
          status = 'Rest Needed';
          rec = 'Focus on mobility, sleep, and recovery.';
        } else if (score < 75) {
          status = 'Moderate';
          rec = 'Light technique drills recommended.';
        }
        return { readiness_score: score, training_recommendation: rec, recovery_status: status };
      }
    }

    return {
      readiness_score: 88,
      training_recommendation: 'Optimal condition for technique training.',
      recovery_status: 'Prime',
    };
  },
};
