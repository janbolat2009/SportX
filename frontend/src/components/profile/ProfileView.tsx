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
  Camera, Loader2, Dumbbell, Award, Flame, AlertCircle, RefreshCw, Globe,
  QrCode, UserCheck, Unlink
} from 'lucide-react';
import { CoachQRCodeCard } from '../coach/CoachQRCodeCard';
import { ConnectTrainerModal } from '../athlete/ConnectTrainerModal';
import { trainerConnectionService, CoachPublicInfo } from '../../services/trainerConnectionService';

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

  // Trainer connection state
  const [connectedCoach, setConnectedCoach] = useState<CoachPublicInfo | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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

  // Load connected coach for athletes
  useEffect(() => {
    if (user?.role === 'athlete' && user?.id) {
      setLoadingCoach(true);
      trainerConnectionService
        .getConnectedCoachForAthlete(String(user.id))
        .then(setConnectedCoach)
        .catch((err) => console.warn('Could not load connected coach:', err))
        .finally(() => setLoadingCoach(false));
    }
  }, [user]);

  const handleDisconnectCoach = async () => {
    if (!connectedCoach || !user?.id) return;
    const confirmMsg = t('qr.confirmDisconnect', 'Are you sure you want to disconnect from this trainer?');
    if (!window.confirm(confirmMsg)) return;

    setDisconnecting(true);
    try {
      await trainerConnectionService.disconnectCoach(String(user.id), connectedCoach.id);
      setConnectedCoach(null);
    } catch (err) {
      console.error('Failed to disconnect coach:', err);
    } finally {
      setDisconnecting(false);
    }
  };

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
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden font-bold text-2xl text-emerald-600 dark:text-brand-400 shadow-sm">
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
                    <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">{user.full_name}</h1>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-brand-500/10 dark:text-brand-400 border border-emerald-500/20 dark:border-brand-500/20 font-bold">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">{user.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 text-xs font-semibold text-stone-700 dark:text-zinc-300 transition-all border border-stone-200 dark:border-zinc-700 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>

            </div>
          </div>

          {/* Coach QR Code or Athlete's Connected Trainer */}
          {user.role === 'coach' ? (
            <CoachQRCodeCard />
          ) : user.role === 'athlete' ? (
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
                  <span>{t('qr.myTrainer', 'My Trainer')}</span>
                </h3>
              </div>

              {loadingCoach ? (
                <div className="py-6 flex items-center justify-center text-stone-400 dark:text-zinc-500 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-brand-400" />
                  <span>Loading trainer connection...</span>
                </div>
              ) : connectedCoach ? (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-brand-300 border border-emerald-500/20 font-bold text-base flex items-center justify-center shrink-0">
                      {connectedCoach.avatar_url ? (
                        <img src={connectedCoach.avatar_url} alt={connectedCoach.full_name} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        connectedCoach.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                          {connectedCoach.full_name}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                        {connectedCoach.specialization}
                      </p>
                      {connectedCoach.organization && (
                        <p className="text-[11px] text-stone-400 dark:text-zinc-500 font-mono truncate">
                          {connectedCoach.organization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(true)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
                      <span>{t('qr.changeTrainer', 'Change')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectCoach}
                      disabled={disconnecting}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title={t('qr.disconnect', 'Disconnect')}
                    >
                      {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                      <span className="hidden xs:inline">{t('qr.disconnect', 'Disconnect')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-stone-50/80 dark:bg-zinc-950/60 border border-dashed border-stone-300 dark:border-zinc-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-brand-400 mx-auto flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                      {t('qr.noTrainer', 'No Trainer Connected')}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-md mx-auto">
                      {t('qr.connectPrompt', 'Connect with your coach to receive direct biomechanical feedback, video reviews, and customized plans.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-black text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{t('qr.connectNow', 'Connect with Trainer')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Edit Profile Form */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
              <span>{t('profile.title')}</span>
            </h2>

            {saveStatus === 'saved' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t('profile.saved')}</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                />
              </div>

              {user.role === 'athlete' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('auth.sport')}
                    </label>
                    <input
                      type="text"
                      value={editSport}
                      onChange={(e) => setEditSport(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.trainingLevel')}
                    </label>
                    <select
                      value={editTrainingLevel}
                      onChange={(e) => setEditTrainingLevel(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Elite">Elite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.height')}
                    </label>
                    <input
                      type="number"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="180"
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('profile.weight')}
                    </label>
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="75"
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      {t('auth.specialization')}
                    </label>
                    <input
                      type="text"
                      value={editSpecialization}
                      onChange={(e) => setEditSpecialization(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Biography / Coaching Philosophy
                    </label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-black text-xs font-black transition-all shadow-md shadow-emerald-600/20 dark:shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-wider"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('profile.saving')}</span>
                  </>
                ) : (
                  <span>{t('profile.saveChanges')}</span>
                )}
              </button>
            </div>
          </div>

          {/* Appearance & Language Settings */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
              <span>{t('theme.title', 'Appearance & Preferences')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Theme Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('theme.title', 'Theme')}
                </span>
                <ThemeToggle compact={false} />
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('profile.language', 'Language')}
                </span>
                <div className="p-1 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 flex items-center h-12">
                  <LanguageSelector compact={false} />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Connect Trainer Modal for Athletes */}
      {showConnectModal && (
        <ConnectTrainerModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onConnected={(coach) => {
            setConnectedCoach(coach);
            setShowConnectModal(false);
          }}
        />
      )}

    </div>
  );
};
