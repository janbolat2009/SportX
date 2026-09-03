import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Logo } from '../common/Logo';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserRole } from '../../types';
import {
  X, Mail, Lock, User as UserIcon, Activity,
  Dumbbell, AlertCircle, CheckCircle2, Loader2, ArrowRight, Users
} from 'lucide-react';

interface Props {
  initialMode?: 'login' | 'signup' | 'forgot';
  onClose?: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<Props> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>('athlete');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sport, setSport] = useState('General Fitness');
  const [specialization, setSpecialization] = useState('Youth Biomechanics');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg(t('auth.submitReset'));
      } else if (mode === 'login') {
        await signIn(email, password);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        await signUp({
          email,
          password,
          full_name: fullName,
          role,
          sport: role === 'athlete' ? sport : undefined,
          specialization: role === 'coach' ? specialization : undefined,
        });
        setSuccessMsg('Account created successfully! Welcome to SportX.');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
        
        {/* Top bar with Theme Toggle, Language Selector and Close */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle compact={true} />
          <LanguageSelector compact={true} />
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6 mt-2">
          <div className="flex justify-center mb-1">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'login' && t('auth.welcomeBack')}
            {mode === 'signup' && t('auth.createAccount')}
            {mode === 'forgot' && t('auth.resetPassword')}
          </h2>
          <p className="text-xs text-zinc-400">
            {mode === 'login' && t('auth.loginSubtitle')}
            {mode === 'signup' && t('auth.signupSubtitle')}
            {mode === 'forgot' && t('auth.resetSubtitle')}
          </p>
        </div>

        {/* Mode Tabs */}
        {mode !== 'forgot' && (
          <div className="flex p-1 rounded-2xl bg-zinc-950 border border-zinc-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('nav.login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('nav.signup')}
            </button>
          </div>
        )}

        {/* Alert Banners */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={t('auth.fullNamePlaceholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {t('auth.role')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('athlete')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      role === 'athlete'
                        ? 'bg-zinc-800 border-brand-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-brand-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{t('auth.athlete')}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('coach')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      role === 'coach'
                        ? 'bg-zinc-800 border-brand-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-brand-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{t('auth.trainer', 'Trainer')}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Role Specific Extra */}
              {role === 'athlete' ? (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('auth.sport')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('auth.sportPlaceholder')}
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    {t('auth.specialization')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('auth.specializationPlaceholder')}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              )}
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Password (if not forgot) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  {t('auth.password')}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-brand-400 hover:underline font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-wider mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>
                  {mode === 'login' && t('auth.submitLogin')}
                  {mode === 'signup' && t('auth.submitSignup')}
                  {mode === 'forgot' && t('auth.submitReset')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="mt-5 text-center text-xs text-zinc-400 border-t border-zinc-800 pt-4">
          {mode === 'login' && (
            <p>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-brand-400 font-bold hover:underline"
              >
                {t('auth.signUpLink')}
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-brand-400 font-bold hover:underline"
              >
                {t('auth.signInLink')}
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-brand-400 font-bold hover:underline"
            >
              {t('auth.backToLogin')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
