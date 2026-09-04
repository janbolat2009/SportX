import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { workoutService } from '../../services/workoutService';
import { recoveryService } from '../../services/recoveryService';
import { getLocalizedExercise } from '../../services/exerciseService';
import { useTranslation } from '../../i18n';
import { Exercise, WorkoutSession, AssignedWorkout, TrainerFeedback } from '../../types';
import { coachService } from '../../services/coachService';
import {
  Play, Upload, Flame, Moon, Utensils, Award, TrendingUp,
  ChevronRight, ArrowRight, ShieldCheck, Dumbbell, Clock, Activity, Loader2, MessageSquare
} from 'lucide-react';
import { HolisticTrackingModal } from './HolisticTrackingModal';

interface Props {
  onStartLiveCamera: (exerciseSlug?: string) => void;
  onStartVideoUpload: () => void;
}

export const AthleteDashboard: React.FC<Props> = ({ onStartLiveCamera, onStartVideoUpload }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkout[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [trainerFeedbacks, setTrainerFeedbacks] = useState<TrainerFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const [showHolisticModal, setShowHolisticModal] = useState(false);
  const [holisticType, setHolisticType] = useState<'sleep' | 'nutrition' | 'recovery'>('sleep');

  const loadDashboardData = async () => {
    try {
      const userIdStr = user?.id ? String(user.id) : undefined;
      const [exData, assignData, sessData, readData, feedbackData] = await Promise.all([
        workoutService.getExercises(),
        workoutService.getAssignedWorkouts(userIdStr),
        workoutService.getWorkoutSessions(userIdStr),
        recoveryService.getReadinessScore(userIdStr),
        coachService.getAthleteTrainerFeedback(userIdStr || 'athlete-1')
      ]);
      setExercises(exData);
      setAssignedWorkouts(assignData);
      setRecentSessions(sessData);
      setReadiness(readData);
      setTrainerFeedbacks(feedbackData);
    } catch (e) {
      console.error('Failed to load athlete dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const defaultExercises = [
    { slug: 'squat', name: 'Barbell / Bodyweight Squat', target_muscles: 'Quadriceps, Glutes, Core', ideal_rom_degrees: 90 },
    { slug: 'pushup', name: 'Standard Push-up', target_muscles: 'Pectorals, Triceps, Anterior Deltoid', ideal_rom_degrees: 90 },
    { slug: 'bicep_curl', name: 'Dumbbell Bicep Curl', target_muscles: 'Biceps Brachii, Brachialis', ideal_rom_degrees: 120 },
    { slug: 'shoulder_press', name: 'Overhead Shoulder Press', target_muscles: 'Deltoids, Trapezius, Triceps', ideal_rom_degrees: 165 },
  ];

  const rawDisplayExercises = exercises.length > 0 ? exercises : (defaultExercises as any);
  const displayExercises = rawDisplayExercises.slice(0, 6).map((ex: Exercise) => getLocalizedExercise(ex, language));

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-zinc-400 font-mono">
          {language === 'ru' ? 'Загрузка готовности и биомеханики...' : language === 'kk' ? 'Спортшы дайындығы мен биомеханикасын жүктеу...' : 'Loading athlete readiness & telemetry...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* 1. Daily Readiness & Start Training Hero Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-surface-card border border-surface-border relative overflow-hidden shadow-xl">
        <div className="max-w-md space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{t('dashboard.readiness')}: {readiness?.readiness_score || 88}% • {t('dashboard.primeCondition')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            {t('dashboard.readyTitle')}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-400">
            {t('dashboard.readySubtitle')}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartLiveCamera('squat')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 dark:bg-brand-500 dark:hover:bg-brand-400 text-white dark:text-black text-xs sm:text-sm font-black transition-all shadow-lg shadow-emerald-600/20 dark:shadow-brand-500/20 flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('dashboard.startCameraWorkout')}</span>
            </button>

            <button
              onClick={onStartVideoUpload}
              className="px-4 py-3 rounded-2xl bg-surface-subtle hover:bg-surface-cardHover border border-surface-border text-stone-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{t('dashboard.uploadVideo')}</span>
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
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-white mb-2">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] uppercase font-mono text-stone-400 dark:text-zinc-500">+ Log</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 font-medium">{t('nav.sleep')}</p>
          <p className="text-sm sm:text-lg font-bold text-stone-900 dark:text-white font-mono">8.2 {language === 'ru' ? 'ч' : language === 'kk' ? 'сағ' : 'hrs'}</p>
        </button>

        <button
          onClick={() => {
            setHolisticType('nutrition');
            setShowHolisticModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-white mb-2">
            <Utensils className="w-4 h-4 text-amber-600 dark:text-status-warning" />
            <span className="text-[10px] uppercase font-mono text-stone-400 dark:text-zinc-500">+ Log</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 font-medium">{t('nav.nutrition')}</p>
          <p className="text-sm sm:text-lg font-bold text-stone-900 dark:text-white font-mono">140g</p>
        </button>

        <button
          onClick={() => {
            setHolisticType('recovery');
            setShowHolisticModal(true);
          }}
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-left transition-all active:scale-[0.99] group shadow-xs"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 group-hover:text-stone-900 dark:group-hover:text-white mb-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
            <span className="text-[10px] uppercase font-mono text-stone-400 dark:text-zinc-500">+ Check</span>
          </div>
          <p className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 font-medium">{t('dashboard.readiness')}</p>
          <p className="text-sm sm:text-lg font-bold text-stone-900 dark:text-white font-mono">88%</p>
        </button>

      </div>

      {/* 3. Assigned Workouts from Coach (if any) */}
      {assignedWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
              <span>{t('dashboard.assignedWorkouts')} ({assignedWorkouts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight flex flex-col justify-between gap-3 transition-all shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">{workout.exercise_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20 font-semibold">
                      {workout.target_sets} {language === 'ru' ? 'Сетов' : language === 'kk' ? 'Сет' : 'Sets'} × {workout.target_reps} {language === 'ru' ? 'Повт' : language === 'kk' ? 'Қайт' : 'Reps'}
                    </span>
                  </div>
                  {workout.notes && (
                    <p className="text-xs text-stone-600 dark:text-zinc-400 line-clamp-2">"{workout.notes}"</p>
                  )}
                </div>

                <button
                  onClick={() => onStartLiveCamera(workout.exercise_slug || 'squat')}
                  className="w-full py-2.5 rounded-xl bg-surface-subtle hover:bg-emerald-600 hover:text-white dark:hover:bg-brand-500 dark:hover:text-black text-stone-900 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('camera.startWorkout')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Exercise Studio Selection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
            <span>{t('dashboard.quickStart')}</span>
          </h3>
          <span className="text-xs text-stone-500 dark:text-zinc-500">Live 3D Pose AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayExercises.map((ex: any) => (
            <div
              key={ex.slug}
              onClick={() => onStartLiveCamera(ex.slug)}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight cursor-pointer transition-all hover:translate-y-[-1px] group flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-brand-400 transition-colors">
                    {ex.name}
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-surface-border">
                    {ex.ideal_rom_degrees || 90}° ROM
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-zinc-400 line-clamp-2">
                  {ex.target_muscles || ex.target}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs text-stone-500 dark:text-zinc-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400" /> ~{ex.normative_cadence_seconds || '3.0'}s
                </span>
                <span className="text-emerald-600 dark:text-brand-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {t('camera.startTraining')} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Trainer Feedback & Recommendations Feed */}
      {trainerFeedbacks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
              <span>{t('athleteFeedback.title', 'Trainer Feedback & Notes')} ({trainerFeedbacks.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {trainerFeedbacks.slice(0, 3).map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1.5 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-semibold ${
                      fb.type === 'recommendation'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : fb.type === 'note'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {fb.type === 'recommendation'
                        ? t('athleteFeedback.recBadge', 'Recommendation')
                        : fb.type === 'note'
                        ? t('athleteFeedback.noteBadge', 'Note')
                        : t('athleteFeedback.feedbackBadge', 'Feedback')}
                    </span>
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      {fb.trainer_name || 'Trainer'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-stone-700 dark:text-zinc-300 leading-relaxed font-medium pl-0.5">
                  "{fb.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Workout Sessions Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
            <span>{t('dashboard.recentActivity')}</span>
          </h3>
          <span className="text-xs text-stone-500 dark:text-zinc-500">{recentSessions.length}</span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface-card border border-surface-border text-center space-y-2 shadow-xs">
            <p className="text-xs text-stone-600 dark:text-zinc-400">{t('dashboard.noRecentActivity')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">{session.exercise_name}</h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                    {session.valid_reps} {language === 'ru' ? 'повторов' : language === 'kk' ? 'қайталау' : 'reps'} • {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-brand-400 font-mono">
                    {Math.round(session.overall_score)}%
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-zinc-500 uppercase font-mono block">{t('report.techniqueScore')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Holistic Modal */}
      {showHolisticModal && (
        <HolisticTrackingModal
          initialTab={holisticType}
          onClose={() => setShowHolisticModal(false)}
          onSuccess={() => {
            setShowHolisticModal(false);
            loadDashboardData();
          }}
        />
      )}

    </div>
  );
};

