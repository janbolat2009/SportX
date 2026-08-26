import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HolisticSummary, AssignedWorkout } from '../../types';
import {
  Camera, UploadCloud, Dumbbell, Award, Moon, Utensils, HeartPulse,
  TrendingUp, CheckCircle2, ChevronRight, AlertCircle, Plus, Calendar
} from 'lucide-react';
import { HolisticTrackingModal } from './HolisticTrackingModal';

interface Props {
  onStartLiveCamera: (exerciseSlug: string) => void;
  onStartVideoUpload: () => void;
}

export const AthleteDashboard: React.FC<Props> = ({ onStartLiveCamera, onStartVideoUpload }) => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHolisticModal, setShowHolisticModal] = useState<'sleep' | 'nutrition' | 'recovery' | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getAthleteDashboard();
        setDashboardData(data);
      } catch (e) {
        console.error('Failed to load athlete dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const data = await api.getAthleteDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const holistic = dashboardData?.holistic;
  const stats = dashboardData?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
              Subject ID: {dashboardData?.anonymized_subject_id || 'SUBJ_001'}
            </span>
            <span className="text-xs text-slate-400 font-medium">{dashboardData?.sport}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Welcome back, <span className="text-emerald-400">{dashboardData?.athlete_name || 'Athlete'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time biomechanical exercise feedback, repetition analysis, and holistic wellness tracking.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onStartLiveCamera('squat')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl text-sm shadow-xl shadow-emerald-500/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            Live Camera Studio
          </button>
          <button
            onClick={onStartVideoUpload}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold px-4 py-3 rounded-2xl text-sm transition-all"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            Upload Video
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Avg Technique</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats?.average_technique_score || 82.5}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Tier: Good Form Consistency</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Workouts</span>
            <Dumbbell className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats?.total_workouts || 1}</span>
            <span className="text-xs text-slate-400 font-mono">completed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sessions analyzed</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Reps Segmented</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{stats?.total_reps_analyzed || 10}</span>
            <span className="text-xs text-slate-400 font-mono">reps</span>
          </div>
          <p className="text-[11px] text-purple-400 mt-1">Full 3D Kinematics</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Recovery Readiness</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{holistic?.recovery?.latest_readiness || 86.5}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">High Training Readiness</p>
        </div>
      </div>

      {/* Main Content Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Assigned Exercises & Recent Sessions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Assigned Exercises from Coach */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Assigned Coach Workouts</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {dashboardData?.assigned_workouts?.length || 0} active
              </span>
            </div>

            {dashboardData?.assigned_workouts && dashboardData.assigned_workouts.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.assigned_workouts.map((aw: any) => (
                  <div
                    key={aw.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 hover:border-emerald-500/40 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{aw.exercise_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: <span className="text-slate-200 font-mono">{aw.target_sets} sets × {aw.target_reps} reps</span> • Tempo: <span className="text-slate-200 font-mono">{aw.target_tempo}</span>
                      </p>
                      {aw.notes && (
                        <p className="text-[11px] text-emerald-400/90 mt-1 italic">"{aw.notes}"</p>
                      )}
                    </div>

                    <button
                      onClick={() => onStartLiveCamera(aw.exercise_name.toLowerCase().replace(' ', '_'))}
                      className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>Start Session</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No assigned workouts from coach currently.</p>
            )}
          </div>

          {/* Recent Workout Sessions */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Recent Technique Sessions</h3>
            
            {dashboardData?.recent_sessions && dashboardData.recent_sessions.length > 0 ? (
              <div className="space-y-2.5">
                {dashboardData.recent_sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400">
                        {s.exercise_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{s.exercise_name}</p>
                        <p className="text-slate-400">{s.created_at} • {s.total_reps} Reps</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-extrabold text-sm text-white">{s.overall_score} / 100</p>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">{s.session_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No sessions recorded yet. Start your first workout!</p>
            )}
          </div>

        </div>

        {/* Right Column: Holistic Wellness (Sleep, Nutrition, Recovery) */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Holistic Wellness</h3>
              <span className="text-[11px] text-slate-400">7-Day Trends</span>
            </div>

            {/* Sleep Summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Sleep ({holistic?.sleep?.average_hours || 8.5} hrs avg)</span>
                </div>
                <button
                  onClick={() => setShowHolisticModal('sleep')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Quality Score:</span>
                  <span className="text-indigo-300 font-mono font-bold">{holistic?.sleep?.average_quality_score || 85}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Schedule Consistency:</span>
                  <span className="text-indigo-300 font-mono font-bold">{holistic?.sleep?.consistency_score || 88}%</span>
                </div>
              </div>
            </div>

            {/* Nutrition Summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <span>Nutrition Today</span>
                </div>
                <button
                  onClick={() => setShowHolisticModal('nutrition')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Calories:</span>
                  <span className="text-white font-mono font-bold">{holistic?.nutrition?.total_calories || 720} kcal</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Macros (P / C / F):</span>
                  <span className="text-amber-300 font-mono font-semibold">
                    {holistic?.nutrition?.protein_g || 48}g / {holistic?.nutrition?.carbs_g || 85}g / {holistic?.nutrition?.fats_g || 18}g
                  </span>
                </div>
              </div>
            </div>

            {/* Recovery Readiness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Readiness & Fatigue</span>
                </div>
                <button
                  onClick={() => setShowHolisticModal('recovery')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Readiness Index:</span>
                  <span className="text-emerald-400 font-mono font-bold">{holistic?.recovery?.latest_readiness || 86.5} / 100</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Soreness / Fatigue:</span>
                  <span className="text-slate-200 font-mono">{holistic?.recovery?.latest_soreness || 3}/10 • {holistic?.recovery?.latest_fatigue || 2}/10</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Holistic Log Modals */}
      {showHolisticModal && (
        <HolisticTrackingModal
          type={showHolisticModal}
          onClose={() => setShowHolisticModal(null)}
          onSuccess={() => {
            setShowHolisticModal(null);
            refreshData();
          }}
        />
      )}

    </div>
  );
};
