import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Tables, InsertTables, UpdateTables } from '../types/database';

export type Profile = Tables<'profiles'>;
export type AthleteProfileRow = Tables<'athlete_profiles'>;
export type CoachProfileRow = Tables<'coach_profiles'>;

// Local fallback cache for profiles when remote tables are not yet migrated
const localProfilesCache: Record<string, any> = {};
const tableStatusCache: Record<string, boolean> = {};

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured() || !userId) return null;
    if (tableStatusCache['profiles'] === false) {
      return localProfilesCache[`profile_${userId}`] || null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          tableStatusCache['profiles'] = false;
        }
        return localProfilesCache[`profile_${userId}`] || null;
      }
      return data as Profile;
    } catch {
      return localProfilesCache[`profile_${userId}`] || null;
    }
  },

  async updateProfile(userId: string, updates: any): Promise<Profile | null> {
    if (!userId) return null;
    localProfilesCache[`profile_${userId}`] = { id: userId, ...updates };

    if (!isSupabaseConfigured()) return localProfilesCache[`profile_${userId}`];
    if (tableStatusCache['profiles'] === false) return localProfilesCache[`profile_${userId}`];

    try {
      const payload: any = {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        // If email column is not in profiles table, retry without email
        if (error.message.includes("Could not find the 'email' column") || error.message.includes('column "email" of relation "profiles" does not exist')) {
          const { email, ...payloadWithoutEmail } = payload;
          const { data: retryData, error: retryErr } = await supabase
            .from('profiles')
            .upsert(payloadWithoutEmail, { onConflict: 'id' })
            .select()
            .maybeSingle();
          if (!retryErr && retryData) return retryData as Profile;
        }
        if (error.message.includes('does not exist') || error.code === '42P01') {
          tableStatusCache['profiles'] = false;
        }
        return localProfilesCache[`profile_${userId}`] || null;
      }
      return data as Profile;
    } catch {
      return localProfilesCache[`profile_${userId}`] || null;
    }
  },

  async getAthleteProfile(userId: string): Promise<AthleteProfileRow | null> {
    if (!userId) return null;
    const fallbackProfile: AthleteProfileRow = {
      id: 1,
      user_id: userId,
      sport: 'General Fitness',
      training_level: 'Intermediate',
      fitness_goal: 'Strength & Biomechanics',
      weekly_training_hours: 5,
      injuries_history: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...localProfilesCache[`athlete_${userId}`],
    } as AthleteProfileRow;

    if (!isSupabaseConfigured()) return fallbackProfile;
    if (tableStatusCache['athlete_profiles'] === false) return fallbackProfile;

    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['athlete_profiles'] = false;
        }
        return fallbackProfile;
      }
      return (data as AthleteProfileRow) || fallbackProfile;
    } catch {
      return fallbackProfile;
    }
  },

  async updateAthleteProfile(
    userId: string,
    updates: any
  ): Promise<AthleteProfileRow | null> {
    if (!userId) return null;
    localProfilesCache[`athlete_${userId}`] = {
      ...localProfilesCache[`athlete_${userId}`],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || tableStatusCache['athlete_profiles'] === false) {
      return localProfilesCache[`athlete_${userId}`] as AthleteProfileRow;
    }

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
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['athlete_profiles'] = false;
        }
        return localProfilesCache[`athlete_${userId}`] as AthleteProfileRow;
      }
      return data as AthleteProfileRow;
    } catch {
      return localProfilesCache[`athlete_${userId}`] as AthleteProfileRow;
    }
  },

  async createAthleteProfile(profile: any): Promise<AthleteProfileRow | null> {
    const userId = profile?.user_id;
    if (userId) {
      localProfilesCache[`athlete_${userId}`] = { ...profile, updated_at: new Date().toISOString() };
    }

    if (!isSupabaseConfigured() || tableStatusCache['athlete_profiles'] === false) {
      return localProfilesCache[`athlete_${userId}`] as AthleteProfileRow;
    }

    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['athlete_profiles'] = false;
        }
        return (localProfilesCache[`athlete_${userId}`] as AthleteProfileRow) || (profile as AthleteProfileRow);
      }
      return data as AthleteProfileRow;
    } catch {
      return (localProfilesCache[`athlete_${userId}`] as AthleteProfileRow) || (profile as AthleteProfileRow);
    }
  },

  async getCoachProfile(userId: string): Promise<CoachProfileRow | null> {
    if (!userId) return null;
    const fallbackCoach: CoachProfileRow = {
      id: 1,
      user_id: userId,
      specialization: 'Youth Biomechanics',
      experience_years: 3,
      certifications: ['CSCS'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...localProfilesCache[`coach_${userId}`],
    } as CoachProfileRow;

    if (!isSupabaseConfigured() || tableStatusCache['coach_profiles'] === false) return fallbackCoach;

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['coach_profiles'] = false;
        }
        return fallbackCoach;
      }
      return (data as CoachProfileRow) || fallbackCoach;
    } catch {
      return fallbackCoach;
    }
  },

  async updateCoachProfile(
    userId: string,
    updates: any
  ): Promise<CoachProfileRow | null> {
    if (!userId) return null;
    localProfilesCache[`coach_${userId}`] = {
      ...localProfilesCache[`coach_${userId}`],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || tableStatusCache['coach_profiles'] === false) {
      return localProfilesCache[`coach_${userId}`] as CoachProfileRow;
    }

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
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['coach_profiles'] = false;
        }
        return localProfilesCache[`coach_${userId}`] as CoachProfileRow;
      }
      return data as CoachProfileRow;
    } catch {
      return localProfilesCache[`coach_${userId}`] as CoachProfileRow;
    }
  },

  async createCoachProfile(profile: any): Promise<CoachProfileRow | null> {
    const userId = profile?.user_id;
    if (userId) {
      localProfilesCache[`coach_${userId}`] = { ...profile, updated_at: new Date().toISOString() };
    }

    if (!isSupabaseConfigured() || tableStatusCache['coach_profiles'] === false) {
      return localProfilesCache[`coach_${userId}`] as CoachProfileRow;
    }

    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01' || error.message.includes('schema cache')) {
          tableStatusCache['coach_profiles'] = false;
        }
        return (localProfilesCache[`coach_${userId}`] as CoachProfileRow) || (profile as CoachProfileRow);
      }
      return data as CoachProfileRow;
    } catch {
      return (localProfilesCache[`coach_${userId}`] as CoachProfileRow) || (profile as CoachProfileRow);
    }
  },
};
