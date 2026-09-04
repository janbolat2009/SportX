import React from 'react';
import { Award, Clock, ArrowRight } from 'lucide-react';
import { WorkoutSession } from '../../types';
import { useTranslation } from '../../i18n';
import { TechniqueAnalysisReport } from '../analysis/TechniqueAnalysisReport';

interface Props {
  session: Partial<WorkoutSession>;
  onClose: () => void;
  onOpenAssistantWithContext?: (query: string) => void;
}

export const PostWorkoutReport: React.FC<Props> = ({
  session,
  onClose,
  onOpenAssistantWithContext
}) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl w-full mx-auto bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-stone-900 dark:text-white my-auto max-h-[90vh] overflow-y-auto">
      
      {/* Header */}
      <div className="text-center pb-5 border-b border-stone-200 dark:border-zinc-800 mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-brand-400 text-xs font-semibold mb-2.5">
          <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
          <span>{t('report.workoutCompleted', 'Workout Completed')}</span>
        </div>
        <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight capitalize">
          {session.exercise_name || session.exercise_slug?.replace('_', ' ') || 'Exercise Session'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 flex items-center justify-center gap-2 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('report.duration', 'Duration')}: {Math.round(session.duration_seconds || 0)}s</span>
          <span>•</span>
          <span>{session.model_version || 'sportx-biomech-v2.0'}</span>
        </p>
      </div>

      {/* Functional Technique Analysis Report Component */}
      <div className="mb-6">
        <TechniqueAnalysisReport
          session={session}
          onOpenAssistantWithContext={onOpenAssistantWithContext}
        />
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98"
      >
        <span>{t('report.saveAndClose', 'Save and Finish Session')}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

    </div>
  );
};
