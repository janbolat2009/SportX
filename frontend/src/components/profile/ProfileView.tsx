import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Key, LogOut, CheckCircle2, UserCheck, Flame, Award, Dumbbell } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, logout, isSupabaseEnabled, login, register, quickLogin } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, role: 'athlete' });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-5 animate-in fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Account & Profile</h1>
        <p className="text-xs text-zinc-400">Manage user identity, Supabase session, and role</p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-xl text-black">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{user?.full_name || 'Athlete'}</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{user?.email || 'demo@sportx.ai'}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-brand-400 border border-surface-border">
                {user?.role || 'athlete'}
              </span>
              {isSupabaseEnabled && (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                  <Shield className="w-3 h-3 text-brand-400" /> Supabase Synced
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Switch Demo Persona */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Fast Persona Switcher</h3>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickLogin('athlete')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              user?.role === 'athlete'
                ? 'bg-zinc-800 border-brand-500 text-white font-bold'
                : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-xs block">Athlete</span>
            <span className="text-[10px] text-zinc-500 block">Alex</span>
          </button>

          <button
            onClick={() => quickLogin('coach')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              user?.role === 'coach'
                ? 'bg-zinc-800 border-brand-500 text-white font-bold'
                : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-xs block">Coach</span>
            <span className="text-[10px] text-zinc-500 block">Marcus</span>
          </button>

          <button
            onClick={() => quickLogin('researcher')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              user?.role === 'researcher'
                ? 'bg-zinc-800 border-brand-500 text-white font-bold'
                : 'bg-surface-subtle border-surface-border text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-xs block">Researcher</span>
            <span className="text-[10px] text-zinc-500 block">Elena</span>
          </button>
        </div>
      </div>

      {/* Supabase Custom Credentials / Sign in */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {isLoginMode ? 'Sign In with Supabase' : 'Register New Account'}
            </h3>
          </div>
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs text-brand-400 hover:underline font-semibold"
          >
            {isLoginMode ? 'Create Account' : 'Already have account?'}
          </button>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {!isLoginMode && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
              />
            </div>
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

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {authLoading ? 'Authenticating...' : isLoginMode ? 'Sign In' : 'Register Account'}
          </button>
        </form>
      </div>

    </div>
  );
};
