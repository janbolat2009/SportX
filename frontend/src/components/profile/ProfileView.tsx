import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import { UserRole } from '../../types';
import {
  User as UserIcon, Shield, LogOut, CheckCircle2,
  Camera, Loader2, Dumbbell, Award, Flame, AlertCircle, RefreshCw, Globe
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    athleteProfile,
    coachProfile,
    logout,
    signIn,
    signUp,
    resetPassword,
    refreshProfile
  } = useAuth();
  const { t } = useTranslation();

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
        setAuthSuccess(t('auth.submitReset'));
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
        setAuthSuccess('Account registered successfully! Welcome to SportX.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaveStatus('saving');
    setSaveError(null);

    const userIdStr = String(user.id);

    try {
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

      await refreshProfile();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err.message || 'Failed to save changes.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const userIdStr = String(user.id);

    setAvatarUploading(true);
    try {
      const publicUrl = await storageService.uploadAvatar(userIdStr, file);
      if (publicUrl) {
        await profileService.updateProfile(userIdStr, { avatar_url: publicUrl });
        await refreshProfile();
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Unauthenticated Visitor Flow */}
      {!user ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-brand-400">
              <UserIcon className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isResetMode
                ? t('auth.resetPassword')
                : isLoginMode
                ? t('auth.welcomeBack')
                : t('auth.createAccount')}
            </h2>
            <p className="text-xs text-zinc-400">
              {isResetMode
                ? t('auth.resetSubtitle')
                : isLoginMode
                ? t('auth.loginSubtitle')
                : t('auth.signupSubtitle')}
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
                {t('nav.login')}
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
                {t('nav.signup')}
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
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('auth.role')}
                  </label>
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
                      {t('auth.athlete')}
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
                      {t('auth.trainer', 'Trainer')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('auth.fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    {t('auth.password')}
                  </label>
                  {isLoginMode && (
                    <button
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-[11px] text-brand-400 hover:underline font-medium"
                    >
                      {t('auth.forgotPassword')}
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
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-wider"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isResetMode ? (
                t('auth.submitReset')
              ) : isLoginMode ? (
                t('auth.submitLogin')
              ) : (
                t('auth.submitSignup')
              )}
            </button>
          </form>

          {isResetMode && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 2. Authenticated Profile View */
        <div className="space-y-6">
          
          {/* Profile Header Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden font-bold text-2xl text-brand-400 shadow-md">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-white">{user.full_name}</h1>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-rose-500/10 hover:text-rose-400 text-xs font-semibold text-zinc-300 transition-all border border-zinc-700 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>

            </div>
          </div>

          {/* Language & Preferences Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-brand-400" />
              <span>{t('profile.language')}</span>
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-300">English / Русский / Қазақша</p>
              <LanguageSelector />
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" />
              <span>{t('profile.title')}</span>
            </h2>

            {saveStatus === 'saved' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t('profile.saved')}</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {user.role === 'athlete' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('auth.sport')}
                    </label>
                    <input
                      type="text"
                      value={editSport}
                      onChange={(e) => setEditSport(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.trainingLevel')}
                    </label>
                    <select
                      value={editTrainingLevel}
                      onChange={(e) => setEditTrainingLevel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Elite">Elite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.height')}
                    </label>
                    <input
                      type="number"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="180"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.weight')}
                    </label>
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="75"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('auth.specialization')}
                    </label>
                    <input
                      type="text"
                      value={editSpecialization}
                      onChange={(e) => setEditSpecialization(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Biography / Coaching Philosophy
                    </label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-wider"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>{t('profile.saving')}</span>
                  </>
                ) : (
                  <span>{t('profile.saveChanges')}</span>
                )}
              </button>
            </div>
          </div>

          {/* Appearance & Language Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-400" />
              <span>{t('theme.title', 'Appearance & Preferences')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Theme Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t('theme.title', 'Theme')}
                </span>
                <ThemeToggle compact={false} />
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t('profile.language', 'Language')}
                </span>
                <div className="p-1 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center h-12">
                  <LanguageSelector compact={false} />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
