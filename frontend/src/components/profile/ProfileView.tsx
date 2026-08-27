import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import { UserRole } from '../../types';
import {
  User as UserIcon, Shield, Key, LogOut, CheckCircle2,
  Camera, Loader2, Dumbbell, Award, Flame, AlertCircle, RefreshCw
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    profile,
    athleteProfile,
    coachProfile,
    logout,
    isSupabaseEnabled,
    signIn,
    signUp,
    resetPassword,
    refreshProfile
  } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('athlete');
  const [regSport, setRegSport] = useState('General Fitness');
  const [regTrainingLevel, setRegTrainingLevel] = useState('Intermediate');
  const [regSpecialization, setRegSpecialization] = useState('Youth Biomechanics');

  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editTrainingLevel, setEditTrainingLevel] = useState('');
  const [editFitnessGoal, setEditFitnessGoal] = useState('');
  const [editHeight, setEditHeight] = useState<number | string>('');
  const [editWeight, setEditWeight] = useState<number | string>('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editExperienceYears, setEditExperienceYears] = useState<number | string>('');
  const [editBio, setEditBio] = useState('');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile fields with state
  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
    }
    if (athleteProfile) {
      setEditSport(athleteProfile.sport || 'General Fitness');
      setEditTrainingLevel(athleteProfile.training_level || 'Intermediate');
      setEditFitnessGoal(athleteProfile.fitness_goal || athleteProfile.fitness_goals || 'Strength & Form');
      setEditHeight(athleteProfile.height_cm || '');
      setEditWeight(athleteProfile.weight_kg || '');
    }
    if (coachProfile) {
      setEditSpecialization(coachProfile.specialization || 'Youth Biomechanics');
      setEditExperienceYears(coachProfile.experience_years || 1);
      setEditBio(coachProfile.bio || '');
    }
  }, [user, athleteProfile, coachProfile]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (isResetMode) {
        await resetPassword(email);
        setAuthSuccess('Password reset link sent to your email address.');
      } else if (isLoginMode) {
        await signIn(email, password);
        setAuthSuccess('Signed in successfully.');
      } else {
        await signUp({
          email,
          password,
          full_name: fullName,
          role: regRole,
          sport: regSport,
          training_level: regTrainingLevel,
          specialization: regSpecialization,
        });
        setAuthSuccess('Account registered successfully with Supabase.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setAvatarUploading(true);
    setSaveError(null);

    try {
      const publicUrl = await storageService.uploadAvatar(String(user.id), file);
      if (isSupabaseEnabled && typeof user.id === 'string') {
        await profileService.updateProfile(user.id, { avatar_url: publicUrl });
        await refreshProfile();
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Avatar upload failed.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const userIdStr = String(user.id);

      if (isSupabaseEnabled && typeof user.id === 'string') {
        await profileService.updateProfile(userIdStr, {
          full_name: editName,
        });

        if (user.role === 'athlete') {
          await profileService.updateAthleteProfile(userIdStr, {
            sport: editSport,
            training_level: editTrainingLevel,
            fitness_goal: editFitnessGoal,
            height_cm: editHeight ? Number(editHeight) : null,
            weight_kg: editWeight ? Number(editWeight) : null,
          });
        } else if (user.role === 'coach') {
          await profileService.updateCoachProfile(userIdStr, {
            specialization: editSpecialization,
            experience_years: editExperienceYears ? Number(editExperienceYears) : 1,
            bio: editBio,
          });
        }
      }

      await refreshProfile();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
      setSaveStatus('error');
    }
  };

  // If user is not authenticated, show Supabase Auth Form
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-in fade-in">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5 shadow-xl">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isResetMode
                ? 'Reset Password'
                : isLoginMode
                ? 'Sign In to SportX'
                : 'Create Account'}
            </h2>
            <p className="text-xs text-zinc-400">
              {isResetMode
                ? 'Enter your email to receive recovery instructions'
                : isLoginMode
                ? 'Sign in to access your workouts and AI analysis reports'
                : 'Join the platform to track your technique'}
            </p>
          </div>

          {/* Mode Switcher */}
          {!isResetMode && (
            <div className="flex p-1 rounded-2xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(true);
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isLoginMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(false);
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isLoginMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {!isLoginMode && !isResetMode && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('athlete')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        regRole === 'athlete'
                          ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Athlete
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('coach')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        regRole === 'coach'
                          ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Coach
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Password</label>
                  {isLoginMode && (
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-[11px] text-brand-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isResetMode ? (
                <span>Send Reset Link</span>
              ) : isLoginMode ? (
                <span>Sign In</span>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          {isResetMode && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-xs text-brand-400 font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is authenticated, render Profile Page
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Profile Header Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-16 h-16 rounded-2xl object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-extrabold text-xl text-brand-400">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all shadow"
              title="Upload Avatar"
            >
              {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div>
            <h3 className="text-lg font-black text-white leading-tight">
              {user.full_name}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-brand-400 border border-zinc-700">
                {user.role}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                <Shield className="w-3 h-3 text-brand-400" /> Supabase Synced
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Edit Profile Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Edit {user.role === 'coach' ? 'Coach' : 'Athlete'} Profile
            </h3>
          </div>

          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Supabase
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 font-bold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {user.role === 'athlete' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Primary Sport</label>
                  <input
                    type="text"
                    value={editSport}
                    onChange={(e) => setEditSport(e.target.value)}
                    placeholder="e.g. Track & Field, Swimming, Football"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Training Level</label>
                  <select
                    value={editTrainingLevel}
                    onChange={(e) => setEditTrainingLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Beginner">Beginner (0-1 yrs)</option>
                    <option value="Intermediate">Intermediate (1-3 yrs)</option>
                    <option value="Advanced">Advanced (3-5 yrs)</option>
                    <option value="Elite">Elite Junior / Pro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="68"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </>
          )}

          {user.role === 'coach' && (
            <>
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Specialization</label>
                <input
                  type="text"
                  value={editSpecialization}
                  onChange={(e) => setEditSpecialization(e.target.value)}
                  placeholder="e.g. Sprint Mechanics, Strength & Conditioning"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Coaching Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share your coaching philosophy and background..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
