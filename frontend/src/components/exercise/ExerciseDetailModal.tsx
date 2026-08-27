import React from 'react';
import { Exercise } from '../../types';
import {
  X, Play, ShieldAlert, CheckCircle2, AlertTriangle, Dumbbell,
  Clock, Award, Layers, Video, Sparkles, ArrowRight
} from 'lucide-react';

interface Props {
  exercise: Exercise;
  onClose: () => void;
  onStartAnalysis: (exerciseSlug: string) => void;
}

export const ExerciseDetailModal: React.FC<Props> = ({ exercise, onClose, onStartAnalysis }) => {
  const getDifficultyColor = (difficulty?: string) => {
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
        '3. Execute the repetition through the complete normative range of motion.',
        '4. Return to the starting lockout position with steady cadence.'
      ];

  const parsedMistakes = exercise.common_mistakes
    ? exercise.common_mistakes.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
    : ['Incomplete range of motion', 'Jerking or swinging for momentum', 'Loss of core and spinal neutrality'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-start justify-between gap-4 bg-surface-subtle/50">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-brand-400 border border-surface-border">
                {exercise.category_name || 'Strength'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyColor(exercise.difficulty)}`}>
                {exercise.difficulty || 'Intermediate'}
              </span>
              {exercise.analysis_supported && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live 3D AI Analysis
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {exercise.name}
            </h2>
            <p className="text-xs text-zinc-400">
              Primary: <span className="text-zinc-200 font-medium">{exercise.target_muscles}</span>
              {exercise.secondary_muscles && (
                <span className="text-zinc-500"> • Secondary: {exercise.secondary_muscles}</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-card border border-surface-border text-zinc-400 hover:text-white hover:bg-surface-cardHover transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border">
              <p className="text-[10px] text-zinc-500 uppercase font-mono">Equipment</p>
              <p className="text-xs font-bold text-white mt-0.5">{exercise.equipment || 'Bodyweight'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border">
              <p className="text-[10px] text-zinc-500 uppercase font-mono">Ideal ROM</p>
              <p className="text-xs font-bold text-brand-400 mt-0.5">{exercise.ideal_rom_degrees || 90}° Target</p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border col-span-2 sm:col-span-1">
              <p className="text-[10px] text-zinc-500 uppercase font-mono">Camera Angle</p>
              <p className="text-xs font-bold text-white mt-0.5">{exercise.default_camera_angle || 'Side View'}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-brand-400" />
              <span>Biomechanical Overview</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed bg-surface-subtle p-3.5 rounded-2xl border border-surface-border">
              {exercise.description}
            </p>
          </div>

          {/* Demonstration Video Section */}
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-brand-400" />
              <span>Demonstration Video</span>
            </h3>
            {exercise.video_url ? (
              <div className="rounded-2xl overflow-hidden border border-surface-border bg-black aspect-video flex items-center justify-center">
                <video
                  src={exercise.video_url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surface-subtle border border-surface-border text-center space-y-1">
                <p className="text-xs text-zinc-400 font-medium">Demonstration video coming soon.</p>
                <p className="text-[11px] text-zinc-500">
                  You can still launch live camera analysis right now to check real-time kinematics.
                </p>
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Execution Instructions</span>
            </h3>
            <div className="space-y-2 bg-surface-subtle p-4 rounded-2xl border border-surface-border">
              {parsedInstructions.map((step, idx) => (
                <div key={idx} className="text-xs text-zinc-300 leading-relaxed">
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Common Biomechanical Mistakes */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Common Mistakes to Avoid</span>
            </h3>
            <div className="space-y-1.5">
              {parsedMistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-zinc-300 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-subtle/70 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400">
            {exercise.analysis_supported ? (
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> MediaPipe Real-Time Analysis Ready
              </span>
            ) : (
              <span className="text-zinc-500">Manual repetition tracker</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-zinc-300 hover:text-white text-xs font-semibold"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onStartAnalysis(exercise.slug);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-black transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Check My Technique</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
