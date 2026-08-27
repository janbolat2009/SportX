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
    quickLogin,
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
        // 1. Update Base Profile
        await profileService.updateProfile(userIdStr, {
          full_name: editName,
        });

        // 2. Update Role-specific profile
        if (user.role === 'athlete') {
          await profileService.updateAthleteProfile(userIdStr, {
            sport: editSport,
            training_level: editTrainingLevel,
            fitness_goal: editFitnessGoal,
            fitness_goals: editFitnessGoal,
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

        await refreshProfile();
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err.message || 'Failed to save profile changes.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Account & Profile</h1>
        <p className="text-xs text-zinc-400">
          Supabase authenticated user identity, role permissions, and personal biomechanical preferences
        </p>
      </div>

      {/* 1. Profile Overview Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-16 h-16 rounded-2xl object-cover border border-surface-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-2xl text-black select-none">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-zinc-800 border border-surface-border text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all shadow"
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
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              {user?.full_name || 'Athlete'}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{user?.email || 'demo@sportx.ai'}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-brand-400 border border-surface-border">
                {user?.role || 'athlete'}
              </span>
              {isSupabaseEnabled ? (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                  <Shield className="w-3 h-3 text-brand-400" /> Supabase Synced
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">Local Demo Session</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Edit Profile Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Edit {user?.role === 'coach' ? 'Coach' : 'Athlete'} Profile
            </h3>
          </div>

          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Supabase
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {user?.role === 'athlete' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Primary Sport / Discipline</label>
                  <input
                    type="text"
                    value={editSport}
                    onChange={(e) => setEditSport(e.target.value)}
                    placeholder="e.g. Basketball, Track & Field"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Training Level</label>
                  <select
                    value={editTrainingLevel}
                    onChange={(e) => setEditTrainingLevel(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Elite">Elite / High School Varsity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Fitness & Biomechanical Goal</label>
                <input
                  type="text"
                  value={editFitnessGoal}
                  onChange={(e) => setEditFitnessGoal(e.target.value)}
                  placeholder="e.g. Squat depth symmetry and core stability"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="68"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                    placeholder="e.g. Youth Biomechanics, Strength Coach"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editExperienceYears}
                    onChange={(e) => setEditExperienceYears(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Coach Biography</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe your coaching philosophy and supervision focus..."
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Fast Demo Persona Switcher (Testing & Evaluation) */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Fast Persona Switcher</h3>
          <span className="text-[10px] text-zinc-500 font-mono">1-Tap Demo Testing</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => quickLogin('athlete')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              user?.role === 'athlete'
                ? 'bg-zinc-800 border-brand-500 text-white font-bold'
                : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Athlete Role</span>
              {user?.role === 'athlete' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Alex Chen • Camera Reps & Readiness</span>
          </button>

          <button
            onClick={() => quickLogin('coach')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              user?.role === 'coach'
                ? 'bg-zinc-800 border-brand-500 text-white font-bold'
                : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Coach Role</span>
              {user?.role === 'coach' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Marcus Vance • Athlete Surveillance</span>
          </button>
        </div>
      </div>

      {/* 4. Supabase Sign In / Register Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {isResetMode
                ? 'Reset Supabase Password'
                : isLoginMode
                ? 'Sign In with Supabase'
                : 'Register Supabase Account'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {!isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                {isLoginMode ? 'Create Account' : 'Already have account?'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsResetMode(!isResetMode);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="text-[11px] text-zinc-400 hover:text-white"
            >
              {isResetMode ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          </div>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {authError}
          </div>
        )}

        {authSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {!isLoginMode && !isResetMode && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('athlete')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      regRole === 'athlete'
                        ? 'bg-zinc-800 border-brand-500 text-brand-400'
                        : 'bg-surface-subtle border-surface-border text-zinc-400'
                    }`}
                  >
                    Athlete
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('coach')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      regRole === 'coach'
                        ? 'bg-zinc-800 border-brand-500 text-brand-400'
                        : 'bg-surface-subtle border-surface-border text-zinc-400'
                    }`}
                  >
                    Coach
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@sportx.ai"
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {!isResetMode && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isResetMode ? (
              <span>Send Reset Instructions</span>
            ) : isLoginMode ? (
              <span>Sign In with Supabase</span>
            ) : (
              <span>Register Account</span>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};
