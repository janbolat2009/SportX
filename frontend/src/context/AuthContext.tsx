import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sportx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSupabaseEnabled = isSupabaseConfigured();

  useEffect(() => {
    async function initAuth() {
      // 1. If Supabase is configured, listen to Supabase auth state
      if (isSupabaseEnabled) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            setUser({
              id: session.user.id as any,
              email: session.user.email || '',
              full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Athlete',
              role: (profile?.role || session.user.user_metadata?.role || 'athlete') as UserRole,
              is_active: true
            });
            setToken(session.access_token);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase auth initialization error, falling back to local:', err);
        }
      }

      // 2. Local session fallback
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (e) {
          console.error('Session expired or invalid, auto-logging into demo account');
          await quickLogin('athlete');
        }
      } else {
        // Auto-login default athlete for seamless exploration
        await quickLogin('athlete');
      }
      setIsLoading(false);
    }

    initAuth();

    // Supabase Auth listener
    if (isSupabaseEnabled) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id as any,
            email: session.user.email || '',
            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Athlete',
            role: (profile?.role || session.user.user_metadata?.role || 'athlete') as UserRole,
            is_active: true
          });
          setToken(session.access_token);
          localStorage.setItem('sportx_token', session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          localStorage.removeItem('sportx_token');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('sportx_token', data.session.access_token);
          setToken(data.session.access_token);
          return;
        }
      }

      // Local API login fallback
      const res = await api.login(email, password);
      localStorage.setItem('sportx_token', res.access_token);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as UserRole,
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'athlete@sportx.ai';
      let password = 'athlete123';
      let name = 'Alex Chen';

      if (role === 'coach') {
        email = 'coach@sportx.ai';
        password = 'coach123';
        name = 'Marcus Vance';
      } else if (role === 'researcher') {
        email = 'researcher@sportx.ai';
        password = 'research123';
        name = 'Dr. Elena Rostova';
      }

      try {
        const res = await api.login(email, password);
        localStorage.setItem('sportx_token', res.access_token);
        setToken(res.access_token);
        setUser({
          id: res.user_id,
          email: res.email,
          full_name: res.full_name,
          role: res.role as UserRole,
          is_active: true
        });
      } catch {
        // Mock offline fallback
        const mockToken = 'mock_jwt_token_' + role;
        localStorage.setItem('sportx_token', mockToken);
        setToken(mockToken);
        setUser({
          id: 1,
          email,
          full_name: name,
          role,
          is_active: true
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      if (isSupabaseEnabled) {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.full_name,
              role: userData.role || 'athlete'
            }
          }
        });
        if (error) throw error;
        if (data.session) {
          localStorage.setItem('sportx_token', data.session.access_token);
          setToken(data.session.access_token);
          return;
        }
      }

      const res = await api.register(userData);
      localStorage.setItem('sportx_token', res.access_token);
      setToken(res.access_token);
      setUser({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as UserRole,
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseEnabled) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out err:', err);
      }
    }
    localStorage.removeItem('sportx_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isSupabaseEnabled,
        login,
        quickLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
