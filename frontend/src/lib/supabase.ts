import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const env = (import.meta as any).env || {};

const supabaseUrl: string = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.info(
    '%c[SportX Supabase]%c Running with local session fallback. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable live Supabase cloud sync.',
    'background: #10b981; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: #94a3b8; margin-left: 6px;'
  );
}

// Single centralized Supabase client instance
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sportx_supabase_auth_token',
    }
  }
);
