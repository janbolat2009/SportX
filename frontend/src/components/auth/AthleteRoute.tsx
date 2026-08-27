import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const AthleteRoute: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === 'coach' ? (
        <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Athlete Access Only</h2>
          <p className="text-xs text-zinc-400">
            This training view is formatted for athletes. You are currently logged in as a Coach. Please switch to an Athlete profile to log personal reps.
          </p>
        </div>
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};
