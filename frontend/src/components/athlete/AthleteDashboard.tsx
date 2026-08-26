import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Exercise, WorkoutSession, AssignedExercise } from '../../types';
import {
  Play, Upload, Flame, Moon, Utensils, Award, TrendingUp,
  ChevronRight, ArrowRight, ShieldCheck, Dumbbell, Clock, Activity
} from 'lucide-react';
import { HolisticTrackingModal } from './HolisticTrackingModal';

interface Props {
  onStartLiveCamera: (exerciseSlug?: string) => void;
  onStartVideoUpload: () => void;
}

export const AthleteDashboard: React.FC<Props> = ({ onStartLiveCamera, onStartVideoUpload }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedExercise[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [showHolisticModal, setShowHolisticModal] = useState(false);
  const [holisticType, setHolisticType] = useState<'sleep' | 'nutrition' | 'recovery'>('sleep');

  useEffect(() => {
    async function loadData() {
      try {
        const [exData, assignData, sessData, readData] = await Promise.all([
          api.getExercises(),
          api.getAssignedExercises(1),
          api.getAthleteSessions(1),
          api.getRecoveryReadiness()
        ]);
        setExercises(exData);
        setAssignedWorkouts(assignData);
        setRecentSessions(sessData);
        setReadiness(readData);
      } catch (e) {
        console.error('Failed to load athlete dashboard data:', e);
      }
    }
    loadData();
  }, []);

  const defaultExercises = [
    { slug: 'squat', name: 'Barbell / Bodyweight Squat', target: 'Quadriceps, Glutes, Core', ideal_rom: 90 },
    { slug: 'pushup', name: 'Standard Push-up', target: 'Pectorals, Triceps, Anterior Deltoid', ideal_rom: 90 },
    { slug: 'bicep_curl', name: 'Dumbbell Bicep Curl', target: 'Biceps Brachii, Brachialis', ideal_rom: 120 },
    { slug: 'shoulder_press', name: 'Overhead Shoulder Press', target: 'Deltoids, Trapezius, Triceps', ideal_rom: 165 },
  ];

  const displayExercises = exercises.length > 0 ? exercises : defaultExercises;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Daily Readiness & Start Training Hero Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-surface-card border border-surface-border relative overflow-hidden shadow-xl">
        <div className="max-w-md space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Readiness: {readiness?.readiness_score || 88}% • Prime Condition</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ready to train with real-time AI technique feedback?
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400">
            Position your phone, start the camera, and receive instant biomechanical form coaching.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartLiveCamera('squat')}
              className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-black text-xs sm:text-sm font-black transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Camera Workout</span>
            </button>

            <button
              onClick={onStartVideoUpload}
              className="px-4 py-3 rounded-2xl bg-surface-subtle hover:bg-surface-cardHover border border-surface-border text-zinc-300 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Holistic Quick Summary (Sleep, Nutrition, Recovery) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        
        <button
          onClick={() => {
            setHolisticType('sleep');
            setShowHolisticModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] text-zinc-500 font-mono">Log</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-medium">Sleep</p>
          <p className="text-base sm:text-lg font-bold text-white mt-0.5">8h 15m</p>
          <span className="text-[10px] text-status-good font-semibold">92% Quality</span>
        </button>

        <button
          onClick={() => {
            setHolisticType('nutrition');
            setShowHolisticModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <Utensils className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-zinc-500 font-mono">Log</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-medium">Protein</p>
          <p className="text-base sm:text-lg font-bold text-white mt-0.5">140g</p>
          <span className="text-[10px] text-zinc-400 font-medium">Target: 150g</span>
        </button>

        <button
          onClick={() => {
            setHolisticType('recovery');
            setShowHolisticModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <Activity className="w-4 h-4 text-brand-400" />
            <span className="text-[10px] text-zinc-500 font-mono">Log</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-medium">Soreness</p>
          <p className="text-base sm:text-lg font-bold text-white mt-0.5">Low (2/10)</p>
          <span className="text-[10px] text-brand-400 font-medium">Optimal</span>
        </button>

      </div>

      {/* 3. Assigned Workouts from Coach */}
      {assignedWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white">Prescribed by Coach</h3>
            <span className="text-xs text-zinc-500">{assignedWorkouts.length} Assigned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedWorkouts.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white capitalize">{w.exercise_name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {w.target_sets} sets × {w.target_reps} reps • Tempo {w.target_tempo}
                  </p>
                </div>
                <button
                  onClick={() => onStartLiveCamera(w.exercise_slug || 'squat')}
                  className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all active:scale-95"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Supported Exercises Studio Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white">Exercise Studio Library</h3>
          <span className="text-xs text-zinc-500">4 Movements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayExercises.map((ex: any) => (
            <div
              key={ex.slug}
              onClick={() => onStartLiveCamera(ex.slug)}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-4 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-brand-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-white capitalize">{ex.name}</h4>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1">{ex.target_muscles || ex.target}</p>
                <span className="text-[10px] text-zinc-500 font-mono block">Target ROM: {ex.ideal_rom_degrees || ex.ideal_rom}°</span>
              </div>

              <div className="w-8 h-8 rounded-xl bg-surface-subtle group-hover:bg-brand-500 group-hover:text-black flex items-center justify-center text-zinc-400 transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holistic Modal */}
      {showHolisticModal && (
        <HolisticTrackingModal
          initialTab={holisticType}
          onClose={() => setShowHolisticModal(false)}
          onSuccess={() => setShowHolisticModal(false)}
        />
      )}

    </div>
  );
};
