import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import type { Tables, InsertTables } from '../types/database';
import { SleepRecord } from '../types';

export const sleepService = {
  async getSleepRecords(athleteUserId?: string, limit = 7): Promise<SleepRecord[]> {
    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('sleep_records')
          .select('*')
          .eq('athlete_id', athlete.id)
          .order('sleep_date', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            athlete_id: d.athlete_id,
            log_date: d.sleep_date,
            bedtime: d.bedtime,
            wake_time: d.wake_time,
            total_sleep_minutes: d.total_sleep_minutes || d.duration_minutes || 480,
            sleep_quality_score: d.sleep_quality_score || d.quality || 80,
            consistency_score: 85,
            notes: d.notes,
            created_at: d.created_at,
          }));
        }
      }
    }

    return [];
  },

  async logSleep(
    record: {
      log_date: string;
      bedtime?: string;
      wake_time?: string;
      total_sleep_minutes: number;
      sleep_quality_score: number;
      notes?: string;
    },
    athleteUserId?: string
  ): Promise<any> {
    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('sleep_records')
          .upsert(
            {
              athlete_id: athlete.id,
              sleep_date: record.log_date,
              bedtime: record.bedtime,
              wake_time: record.wake_time,
              duration_minutes: record.total_sleep_minutes,
              total_sleep_minutes: record.total_sleep_minutes,
              quality: record.sleep_quality_score,
              sleep_quality_score: record.sleep_quality_score,
              notes: record.notes,
            },
            { onConflict: 'athlete_id,sleep_date' }
          )
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    return api.logSleep(record);
  },
};
