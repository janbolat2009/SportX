import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Tables, InsertTables, UpdateTables } from '../types/database';

export type Profile = Tables<'profiles'>;
export type AthleteProfileRow = Tables<'athlete_profiles'>;
export type CoachProfileRow = Tables<'coach_profiles'>;

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notice fetching profile (check if SQL migration was run):', error.message);
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: any): Promise<Profile | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Notice updating profile:', error.message);
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  },

  async getAthleteProfile(userId: string): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notice fetching athlete profile:', error.message);
        return null;
      }
      return data as AthleteProfileRow;
    } catch {
      return null;
    }
  },

  async updateAthleteProfile(
    userId: string,
    updates: any
  ): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Notice updating athlete profile:', error.message);
        return null;
      }
      return data as AthleteProfileRow;
    } catch {
      return null;
    }
  },

  async createAthleteProfile(profile: any): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Notice creating athlete profile:', error.message);
        return null;
      }
      return data as AthleteProfileRow;
    } catch {
      return null;
    }
  },

  async getCoachProfile(userId: string): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notice fetching coach profile:', error.message);
        return null;
      }
      return data as CoachProfileRow;
    } catch {
      return null;
    }
  },

  async updateCoachProfile(
    userId: string,
    updates: any
  ): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .upsert(
          {
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Notice updating coach profile:', error.message);
        return null;
      }
      return data as CoachProfileRow;
    } catch {
      return null;
    }
  },

  async createCoachProfile(profile: any): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('Notice creating coach profile:', error.message);
        return null;
      }
      return data as CoachProfileRow;
    } catch {
      return null;
    }
  },
};
