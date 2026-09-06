import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import type { Tables, InsertTables } from '../types/database';
import { SleepRecord } from '../types';

export const sleepService = {
  async getSleepRecords(athleteUserId?: string, limit = 14): Promise<SleepRecord[]> {
    // Fast local cache for immediate hydration
    let cachedRecords: SleepRecord[] = [];
    if (athleteUserId) {
      try {
        const raw = localStorage.getItem(`sportx_sleep_records_${athleteUserId}`);
        if (raw) cachedRecords = JSON.parse(raw);
      } catch {}
    }

    if (isSupabaseConfigured() && athleteUserId) {
      try {
        let { data: athlete } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', athleteUserId)
          .maybeSingle();

        if (!athlete) {
          try {
            const subjectId = "ATH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: newAp } = await supabase
              .from('athlete_profiles')
              .upsert(
                {
                  user_id: athleteUserId,
                  sport: 'General Fitness',
                  training_level: 'Intermediate',
                  anonymized_subject_id: subjectId,
                },
                { onConflict: 'user_id' }
              )
              .select('id')
              .maybeSingle();
            athlete = newAp;
          } catch {}
        }

        if (athlete) {
          const { data, error } = await supabase
            .from('sleep_records')
            .select('*')
            .eq('athlete_id', athlete.id)
            .order('sleep_date', { ascending: false })
            .limit(limit);

          if (!error && data && data.length > 0) {
            const mapped: SleepRecord[] = data.map((d: any) => ({
              id: d.id,
              athlete_id: d.athlete_id,
              log_date: d.sleep_date,
              bedtime: d.bedtime || '23:00',
              wake_time: d.wake_time || '07:30',
              total_sleep_minutes: d.duration_minutes || d.total_sleep_minutes || 480,
              sleep_quality_score: d.quality_rating ? Math.min(100, d.quality_rating <= 5 ? d.quality_rating * 20 : d.quality_rating) : (d.sleep_quality_score || 85),
              consistency_score: 85,
              notes: d.insights_summary || d.morning_feeling || d.notes || '',
              created_at: d.created_at,
            }));

            try {
              localStorage.setItem(`sportx_sleep_records_${athleteUserId}`, JSON.stringify(mapped));
            } catch {}

            return mapped;
          }
        }
      } catch (e) {
        console.warn('Notice fetching sleep records from Supabase:', e);
      }
    }

    return cachedRecords;
  },

  async logSleep(
    record: {
      log_date: string;
      bedtime?: string;
      wake_time?: string;
      total_sleep_minutes: number;
      sleep_quality_score: number;
      morning_feeling?: string;
      notes?: string;
    },
    athleteUserId?: string
  ): Promise<any> {
    const quality100 = Math.min(100, Math.max(1, record.sleep_quality_score));
    const starRating = Math.round(quality100 / 20);

    const clientRecord: SleepRecord = {
      id: 'sleep_' + Date.now(),
      athlete_id: athleteUserId || 'athlete',
      log_date: record.log_date,
      bedtime: record.bedtime || '23:00',
      wake_time: record.wake_time || '07:30',
      total_sleep_minutes: record.total_sleep_minutes,
      sleep_quality_score: quality100,
      consistency_score: 88,
      notes: record.morning_feeling || record.notes || 'Refreshed',
      created_at: new Date().toISOString(),
    };

    if (athleteUserId) {
      try {
        const raw = localStorage.getItem(`sportx_sleep_records_${athleteUserId}`);
        const currentList: SleepRecord[] = raw ? JSON.parse(raw) : [];
        const nextList = [clientRecord, ...currentList.filter(r => r.log_date !== record.log_date)];
        localStorage.setItem(`sportx_sleep_records_${athleteUserId}`, JSON.stringify(nextList));
      } catch {}
    }

    if (isSupabaseConfigured() && athleteUserId) {
      try {
        let { data: athlete } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', athleteUserId)
          .maybeSingle();

        if (!athlete) {
          const subjectId = "ATH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: newAp } = await supabase
            .from('athlete_profiles')
            .upsert(
              {
                user_id: athleteUserId,
                sport: 'General Fitness',
                training_level: 'Intermediate',
                anonymized_subject_id: subjectId,
              },
              { onConflict: 'user_id' }
            )
            .select('id')
            .maybeSingle();
          athlete = newAp;
        }

        if (athlete) {
          const { data, error } = await supabase
            .from('sleep_records')
            .insert({
              athlete_id: athlete.id,
              sleep_date: record.log_date,
              bedtime: record.bedtime || '23:00',
              wake_time: record.wake_time || '07:30',
              duration_minutes: record.total_sleep_minutes,
              quality_rating: starRating,
              morning_feeling: record.morning_feeling || 'refreshed',
              insights_summary: record.notes || '',
            })
            .select()
            .maybeSingle();

          if (!error && data) {
            return {
              ...clientRecord,
              id: data.id,
            };
          }
        }
      } catch (err) {
        console.warn('Notice saving sleep record to Supabase:', err);
      }
    }

    return clientRecord;
  },

  async deleteSleepRecord(recordId: string | number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('sleep_records').delete().eq('id', recordId);
        return true;
      } catch (err) {
        console.warn('Notice deleting sleep record:', err);
      }
    }
    return true;
  },
};
