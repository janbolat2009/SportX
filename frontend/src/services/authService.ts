import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';

export interface SignUpParams {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  sport?: string;
  training_level?: string;
  specialization?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  async signUp(params: SignUpParams) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured. Please verify your Supabase URL and Anon Key.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.full_name,
          role: params.role,
          sport: params.sport || 'General Fitness',
          training_level: params.training_level || 'Intermediate',
          specialization: params.specialization || 'Youth Athletic Development',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn({ email, password }: SignInParams) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured. Please verify your Supabase URL and Anon Key.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign out warning:', error.message);
        throw error;
      }
    }
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured.');
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) throw error;
    return data;
  },

  async getSession() {
    if (!isSupabaseConfigured()) return { session: null };
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured()) return { user: null };
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
  },
};
