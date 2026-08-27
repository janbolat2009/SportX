import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService, SignUpParams } from '../services/authService';
import { profileService, Profile, AthleteProfileRow, CoachProfileRow } from '../services/profileService';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  athleteProfile: AthleteProfileRow | null;
  coachProfile: CoachProfileRow | null;
  loading: boolean;
  isLoading: boolean; // Alias for backward compatibility
  isAuthenticated: boolean;
  isSupabaseEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // Alias
  signUp: (params: SignUpParams) => Promise<void>;
  register: (userData: any) => Promise<void>; // Alias
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfileRow | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfileRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isSupabaseEnabled = isSupabaseConfigured();

  // Helper to load profiles for a given user ID and role
  const loadUserProfiles = useCallback(async (userId: string, authUser?: SupabaseAuthUser | null) => {
    try {
      let baseProfile = await profileService.getProfile(userId);

      // If base profile does not exist yet (e.g. freshly created user before trigger), create it
      if (!baseProfile && authUser) {
        const role = (authUser.user_metadata?.role as UserRole) || 'athlete';
        const fullName = authUser.user_metadata?.full_name || 'Athlete';
        baseProfile = await profileService.updateProfile(userId, {
          id: userId,
          email: authUser.email,
          full_name: fullName,
          role: role,
        });
      }

      setProfile(baseProfile);

      const effectiveRole: UserRole =
        (baseProfile?.role as UserRole) ||
        (authUser?.user_metadata?.role as UserRole) ||
        'athlete';

      let ap: AthleteProfileRow | null = null;
      let cp: CoachProfileRow | null = null;

      if (effectiveRole === 'athlete') {
        ap = await profileService.getAthleteProfile(userId);
        if (!ap) {
          // Auto-initialize athlete profile row if missing
          ap = await profileService.createAthleteProfile({
            user_id: userId,
            sport: authUser?.user_metadata?.sport || 'General Fitness',
            training_level: authUser?.user_metadata?.training_level || 'Intermediate',
          });
        }
        setAthleteProfile(ap);
        setCoachProfile(null);
      } else if (effectiveRole === 'coach') {
        cp = await profileService.getCoachProfile(userId);
        if (!cp) {
          // Auto-initialize coach profile row if missing
          cp = await profileService.createCoachProfile({
            user_id: userId,
            specialization: authUser?.user_metadata?.specialization || 'Youth Athletic Development',
            experience_years: 1,
          });
        }
        setCoachProfile(cp);
        setAthleteProfile(null);
      }

      setUser({
        id: userId,
        email: baseProfile?.email || authUser?.email || '',
        full_name: baseProfile?.full_name || authUser?.user_metadata?.full_name || 'User',
        role: effectiveRole,
        avatar_url: baseProfile?.avatar_url || null,
        is_active: true,
      });
    } catch (err) {
      console.error('Error loading user profile details:', err);
    }
  }, []);

  // Initialize Auth State on Mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseEnabled) {
        try {
          const { session: currentSession } = await authService.getSession();
          if (mounted && currentSession?.user) {
            setSession(currentSession);
            await loadUserProfiles(currentSession.user.id, currentSession.user);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase session retrieval warning:', err);
        }
      }

      // Local fallback session
      if (mounted) {
        const localToken = localStorage.getItem('sportx_token');
        const localRole = (localStorage.getItem('sportx_role') as UserRole) || 'athlete';
        const localName = localStorage.getItem('sportx_name') || 'Alex Chen';
        const localEmail = localStorage.getItem('sportx_email') || 'athlete@sportx.ai';

        if (localToken) {
          setUser({
            id: 'local-user-1',
            email: localEmail,
            full_name: localName,
            role: localRole,
            is_active: true,
          });
        } else {
          // Default demo athlete state for seamless out-of-the-box exploration
          setUser({
            id: 'local-user-1',
            email: 'athlete@sportx.ai',
            full_name: 'Alex Chen',
            role: 'athlete',
            is_active: true,
          });
          localStorage.setItem('sportx_token', 'demo_token_athlete');
        }
        setLoading(false);
      }
    }

    initAuth();

    // Supabase auth state change subscriber
    if (isSupabaseEnabled) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, newSession: any) => {
        if (!mounted) return;
        setSession(newSession as Session);

        if (newSession?.user) {
          await loadUserProfiles(newSession.user.id, newSession.user);
          localStorage.setItem('sportx_token', newSession.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setAthleteProfile(null);
          setCoachProfile(null);
          localStorage.removeItem('sportx_token');
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isSupabaseEnabled, loadUserProfiles]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseEnabled) {
        const { session: newSession, user: authUser } = await authService.signIn({ email, password });
        if (newSession && authUser) {
          setSession(newSession as Session);
          await loadUserProfiles(authUser.id, authUser as any);
          localStorage.setItem('sportx_token', newSession.access_token);
          return;
        }
      }

      // Local mock login fallback
      localStorage.setItem('sportx_token', 'local_token_' + Date.now());
      setUser({
        id: 'local-user-1',
        email,
        full_name: email.split('@')[0],
        role: 'athlete',
        is_active: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: SignUpParams) => {
    setLoading(true);
    try {
      if (isSupabaseEnabled) {
        const { session: newSession, user: authUser } = await authService.signUp(params);
        if (authUser) {
          if (newSession) {
            setSession(newSession as Session);
            localStorage.setItem('sportx_token', newSession.access_token);
          }
          await loadUserProfiles(authUser.id, authUser as any);
          return;
        }
      }

      // Local fallback registration
      localStorage.setItem('sportx_token', 'local_token_' + Date.now());
      setUser({
        id: 'local-user-' + Date.now(),
        email: params.email,
        full_name: params.full_name,
        role: params.role,
        is_active: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setAthleteProfile(null);
      setCoachProfile(null);
      localStorage.removeItem('sportx_token');
      localStorage.removeItem('sportx_role');
      localStorage.removeItem('sportx_name');
      localStorage.removeItem('sportx_email');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id && typeof user.id === 'string') {
      await loadUserProfiles(user.id, session?.user || null);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const quickLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      let email = 'athlete@sportx.ai';
      let name = 'Alex Chen';

      if (role === 'coach') {
        email = 'coach@sportx.ai';
        name = 'Marcus Vance';
      }

      localStorage.setItem('sportx_token', 'demo_token_' + role);
      localStorage.setItem('sportx_role', role);
      localStorage.setItem('sportx_name', name);
      localStorage.setItem('sportx_email', email);

      setUser({
        id: 'demo-' + role + '-id',
        email,
        full_name: name,
        role,
        is_active: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        athleteProfile,
        coachProfile,
        loading,
        isLoading: loading,
        isAuthenticated: !!user,
        isSupabaseEnabled,
        signIn,
        login: signIn,
        signUp,
        register: signUp,
        signOut,
        logout: signOut,
        refreshProfile,
        resetPassword,
        quickLogin,
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
