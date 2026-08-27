import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">Authenticating Supabase session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Authentication Required</h2>
        <p className="text-xs text-zinc-400">
          Please sign in to your SportX account to access this training session or athlete data.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
