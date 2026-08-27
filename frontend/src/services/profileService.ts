import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Tables, InsertTables, UpdateTables } from '../types/database';

export type Profile = Tables<'profiles'>;
export type AthleteProfileRow = Tables<'athlete_profiles'>;
export type CoachProfileRow = Tables<'coach_profiles'>;

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: UpdateTables<'profiles'>): Promise<Profile | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAthleteProfile(userId: string): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching athlete profile:', error.message);
      return null;
    }
    return data;
  },

  async updateAthleteProfile(
    userId: string,
    updates: UpdateTables<'athlete_profiles'>
  ): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('athlete_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAthleteProfile(
    profileData: InsertTables<'athlete_profiles'>
  ): Promise<AthleteProfileRow | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('athlete_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCoachProfile(userId: string): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching coach profile:', error.message);
      return null;
    }
    return data;
  },

  async updateCoachProfile(
    userId: string,
    updates: UpdateTables<'coach_profiles'>
  ): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('coach_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createCoachProfile(
    profileData: InsertTables<'coach_profiles'>
  ): Promise<CoachProfileRow | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('coach_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
