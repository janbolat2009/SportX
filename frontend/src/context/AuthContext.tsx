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
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<{ needsEmailConfirmation?: boolean }>;
  register: (userData: any) => Promise<{ needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
          cp = await profileService.createCoachProfile({
            user_id: userId,
            specialization: authUser?.user_metadata?.specialization || 'Youth Biomechanics',
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

  // Initialize Auth State on Mount strictly from Supabase Auth
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

      // If no valid session from Supabase, visitor state is unauthenticated
      if (mounted) {
        setUser(null);
        setProfile(null);
        setAthleteProfile(null);
        setCoachProfile(null);
        setSession(null);
        setLoading(false);
      }
    }

    initAuth();

    // Supabase auth state change listener
    if (isSupabaseEnabled) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, newSession: any) => {
        if (!mounted) return;
        setSession(newSession as Session);

        if (newSession?.user) {
          await loadUserProfiles(newSession.user.id, newSession.user);
        } else {
          setUser(null);
          setProfile(null);
          setAthleteProfile(null);
          setCoachProfile(null);
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
      const { session: newSession, user: authUser } = await authService.signIn({ email, password });
      if (newSession && authUser) {
        setSession(newSession as Session);
        await loadUserProfiles(authUser.id, authUser as any);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: SignUpParams) => {
    setLoading(true);
    try {
      const { session: newSession, user: authUser } = await authService.signUp(params);
      if (newSession && authUser) {
        setSession(newSession as Session);
        await loadUserProfiles(authUser.id, authUser as any);
        return { needsEmailConfirmation: false };
      }
      return { needsEmailConfirmation: true };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseEnabled) {
        await authService.signOut();
      }
    } finally {
      setUser(null);
      setProfile(null);
      setAthleteProfile(null);
      setCoachProfile(null);
      setSession(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseEnabled) {
      await authService.resetPassword(email);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfiles(String(user.id));
    }
  };

  const isAuthenticated = Boolean(user && session);

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
        isAuthenticated,
        isSupabaseEnabled,
        signIn,
        login: signIn,
        signUp,
        register: signUp,
        signOut,
        logout: signOut,
        refreshProfile,
        resetPassword,
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
