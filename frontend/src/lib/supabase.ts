import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

const supabaseUrl: string =
  env.VITE_SUPABASE_URL ||
  'https://uzhdqldeqfnrwggbsrau.supabase.co';

const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGRxbGRlcWZucndnZ2JzcmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTU3ODIsImV4cCI6MjEwMzM5MTc4Mn0.hQ5RSq6xKa-K-qHQ-K86oRZebePt3x0V8EMFSM--y6Y';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.warn(
    '[SportX Supabase] Supabase credentials missing or invalid. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

// Single centralized Supabase client instance
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sportx_supabase_auth_token',
    }
  }
);
