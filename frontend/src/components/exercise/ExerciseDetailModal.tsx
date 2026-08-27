import React from 'react';
import { Exercise } from '../../types';
import { getMuscleIcon } from '../common/MuscleIcons';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  X, Play, CheckCircle2, AlertTriangle, Video, Sparkles, Activity, ShieldCheck, Dumbbell
} from 'lucide-react';

interface Props {
  exercise: Exercise;
  onClose: () => void;
  onStartAnalysis: (exerciseSlug: string) => void;
}

export const ExerciseDetailModal: React.FC<Props> = ({ exercise, onClose, onStartAnalysis }) => {
  const { t } = useTranslation();

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'advanced':
      case 'elite':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const parsedInstructions = exercise.instructions
    ? exercise.instructions.split('\n').filter((l) => l.trim().length > 0)
    : [
        '1. Set up with stable joint alignment and grounded footing.',
        '2. Inhale, brace your core, and initiate the movement with control.',
        '3. Execute the repetition through the complete range of motion.',
        '4. Return to the starting position with steady cadence.'
      ];

  const parsedMistakes = exercise.common_mistakes
    ? exercise.common_mistakes.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
    : ['Incomplete range of motion', 'Swinging for momentum', 'Loss of core neutrality'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* 1. Header: Exercise Name, Category & Equipment */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-start justify-between gap-4 bg-zinc-900/80">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyBadge(exercise.difficulty)}`}>
                {exercise.difficulty || 'Intermediate'}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-zinc-500" />
                {exercise.equipment || 'Bodyweight'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {exercise.name}
            </h2>
            <p className="text-xs text-zinc-400">
              {t('detail.target')}: <span className="text-brand-400 font-semibold">{exercise.target_muscles}</span>
              {exercise.secondary_muscles && (
                <span className="text-zinc-500 ml-1.5">• {t('detail.secondary')}: {exercise.secondary_muscles}</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-zinc-300">
          
          {/* 2. Demonstration Video */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-brand-400" />
              <span>{t('detail.demonstration')}</span>
            </h3>

            {exercise.video_url ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center shadow-md">
                <video
                  src={exercise.video_url}
                  poster={exercise.thumbnail_url || undefined}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  {getMuscleIcon(exercise.slug || 'squat', 28)}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-zinc-300">{t('detail.videoComingSoon')}</p>
                  <p className="text-[11px] text-zinc-500">
                    {t('detail.videoComingSoonDesc')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Description */}
          {exercise.description && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
              {exercise.description}
            </p>
          )}

          {/* 4. How to Perform */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>{t('detail.howToPerform')}</span>
            </h3>
            <div className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              {parsedInstructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {step.replace(/^\d+\.\s*/, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Common Mistakes to Avoid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('detail.commonMistakes')}</span>
            </h3>
            <div className="space-y-1.5">
              {parsedMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-zinc-300 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. AI Technique Analysis Overview */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{t('detail.aiMetrics')}</span>
              </span>
              <span className="text-[10px] font-mono text-brand-400 uppercase bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {exercise.default_camera_angle || 'Side View'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-brand-400" />
                <span>{t('detail.targetRom')}: <b className="text-zinc-200">{exercise.ideal_rom_degrees || 90}°</b></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-brand-400" />
                <span>{t('detail.symmetry')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 7. Large Prominent Action Footer: CHECK MY TECHNIQUE */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onStartAnalysis(exercise.slug);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-sm font-black transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t('detail.checkMyTechnique')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
