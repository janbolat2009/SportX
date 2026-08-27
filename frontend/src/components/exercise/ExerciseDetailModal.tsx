import React from 'react';
import { Exercise } from '../../types';
import { getMuscleIcon } from '../common/MuscleIcons';
import {
  X, Play, CheckCircle2, AlertTriangle, Video, Sparkles, ChevronRight
} from 'lucide-react';

interface Props {
  exercise: Exercise;
  onClose: () => void;
  onStartAnalysis: (exerciseSlug: string) => void;
}

export const ExerciseDetailModal: React.FC<Props> = ({ exercise, onClose, onStartAnalysis }) => {
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
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-start justify-between gap-4 bg-zinc-900/60">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyBadge(exercise.difficulty)}`}>
                {exercise.difficulty || 'Intermediate'}
              </span>
              <span className="text-[10px] font-medium text-zinc-400">
                {exercise.equipment || 'Bodyweight'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {exercise.name}
            </h2>
            <p className="text-xs text-zinc-400">
              Target: <span className="text-zinc-200 font-semibold">{exercise.target_muscles}</span>
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-zinc-300">
          
          {/* Demonstration Video / Visual */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-brand-400" />
              <span>Demonstration</span>
            </h3>
            {exercise.video_url ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
                <video
                  src={exercise.video_url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  {getMuscleIcon(exercise.slug || 'squat', 28)}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Technique Form Breakdown</p>
                  <p className="text-[11px] text-zinc-400">
                    Follow the instructions below or check live technique via your phone's camera.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* How to perform */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>How to Perform</span>
            </h3>
            <div className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              {parsedInstructions.map((step, idx) => (
                <p key={idx} className="text-xs text-zinc-300 leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Common Mistakes to Avoid</span>
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

        </div>

        {/* Large Prominent Action Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onStartAnalysis(exercise.slug);
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-sm font-black transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>CHECK MY TECHNIQUE</span>
          </button>
        </div>

      </div>
    </div>
  );
};
