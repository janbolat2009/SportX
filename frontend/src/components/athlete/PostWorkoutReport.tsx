import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Award, Clock } from 'lucide-react';
import { WorkoutSession } from '../../types';
import { useTranslation } from '../../i18n';

interface Props {
  session: Partial<WorkoutSession>;
  onClose: () => void;
}

export const PostWorkoutReport: React.FC<Props> = ({ session, onClose }) => {
  const { t, language } = useTranslation();
  const score = Math.round(session.overall_score || 85);
  const totalReps = session.total_reps || 0;
  const validReps = session.valid_reps ?? totalReps;

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-status-good border-status-good/30 bg-status-good/10';
    if (val >= 70) return 'text-status-attention border-status-attention/30 bg-status-attention/10';
    return 'text-status-deviation border-status-deviation/30 bg-status-deviation/10';
  };

  const getScoreLabel = (val: number) => {
    if (val >= 90) return t('report.excellent');
    if (val >= 80) return t('report.solid');
    if (val >= 70) return t('report.minorAdjustments');
    return t('report.deviationsDetected');
  };

  return (
    <div className="max-w-xl mx-auto bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="text-center pb-6 border-b border-surface-border">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5" />
          <span>{t('report.workoutCompleted')}</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight capitalize">
          {session.exercise_name || session.exercise_slug?.replace('_', ' ') || 'Exercise Session'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-2 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('report.duration')}: {Math.round(session.duration_seconds || 0)}s</span>
          <span>•</span>
          <span>{t('report.model')}: {session.model_version || 'sportx-ml-v1.0'}</span>
        </p>
      </div>

      {/* Main Score & Reps Banner */}
      <div className="grid grid-cols-2 gap-3 my-6">
        
        {/* Technique Score Card */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border text-center flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{t('report.techniqueScore')}</span>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight my-1">
            {score}<span className="text-sm text-zinc-500 font-normal">/100</span>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </span>
        </div>

        {/* Volume Card */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border text-center flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{t('report.repetitions')}</span>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight my-1">
            {validReps}<span className="text-sm text-zinc-500 font-normal">/{totalReps}</span>
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            {validReps === totalReps ? t('report.allValid') : `${totalReps - validReps} ${t('report.incompleteRom')}`}
          </span>
        </div>

      </div>

      {/* Biomechanical Dimensions Breakdown */}
      <div className="space-y-2 mb-6">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider px-1">{t('report.kinematicBreakdown')}</h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
            <p className="text-[10px] text-zinc-400">{t('report.alignment')}</p>
            <p className="text-lg font-bold text-white mt-0.5">{Math.round(session.alignment_score || score)}%</p>
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
            <p className="text-[10px] text-zinc-400">{t('report.rom')}</p>
            <p className="text-lg font-bold text-white mt-0.5">{Math.round(session.rom_score || score)}%</p>
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
            <p className="text-[10px] text-zinc-400">{t('report.symmetry')}</p>
            <p className="text-lg font-bold text-white mt-0.5">{Math.round(session.symmetry_score || 94)}%</p>
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
            <p className="text-[10px] text-zinc-400">{t('report.tempo')}</p>
            <p className="text-lg font-bold text-white mt-0.5">{Math.round(session.tempo_score || 88)}%</p>
          </div>

        </div>
      </div>

      {/* Key Feedback & Deviations */}
      {session.issues && session.issues.length > 0 ? (
        <div className="mb-6 space-y-2">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider px-1">
            {language === 'ru' ? 'Замечания по технике' : language === 'kk' ? 'Техникалық ескертулер' : 'Primary Technique Cues'}
          </h4>
          {session.issues.map((issue: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-start gap-3">
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                issue.severity === 'high' ? 'text-status-deviation' : 'text-status-attention'
              }`} />
              <div className="text-left">
                <p className="text-xs font-semibold text-zinc-200">{issue.error_name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{issue.corrective_instruction}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-brand-200">
              {language === 'ru' ? 'Отличная техника выполнения' : language === 'kk' ? 'Мінсіз техника сақталды' : 'Optimal Form Maintained'}
            </p>
            <p className="text-xs text-brand-400/80">
              {language === 'ru' ? 'Углы в суставах, симметрия и темп соответствовали целевым нормам.' : language === 'kk' ? 'Буын бұрыштары, симметрия және қарқын нормаға толық сәйкес келді.' : 'Joint angles, symmetry, and descent cadence met target benchmarks throughout the set.'}
            </p>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-sm font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-98"
      >
        <span>{t('report.saveAndClose')}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

    </div>
  );
};
