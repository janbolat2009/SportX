import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkoutSession, Repetition } from '../../types';
import {
  TrendingUp, Activity, Calendar, Moon, Utensils, Award,
  ChevronRight, ArrowUpRight, BarChart2, ShieldCheck, Flame
} from 'lucide-react';
import { HolisticTrackingModal } from './HolisticTrackingModal';
import { PostWorkoutReport } from './PostWorkoutReport';

export const ProgressView: React.FC = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [showHolisticModal, setShowHolisticModal] = useState(false);
  const [holisticType, setHolisticType] = useState<'sleep' | 'nutrition' | 'recovery'>('sleep');

  useEffect(() => {
    async function loadData() {
      try {
        const [sessData, readData] = await Promise.all([
          api.getAthleteSessions(1),
          api.getRecoveryReadiness()
        ]);
        setSessions(sessData);
        setReadiness(readData);
      } catch (e) {
        console.error('Failed to load progress data:', e);
      }
    }
    loadData();
  }, []);

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.overall_score, 0) / sessions.length)
    : 86;

  const totalRepsCount = sessions.reduce((acc, s) => acc + (s.total_reps || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-24 space-y-5 animate-in fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Athlete Progress</h1>
          <p className="text-xs text-zinc-400">Biomechanics and holistic readiness metrics</p>
        </div>

        {/* Quick Log Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHolisticType('sleep');
              setShowHolisticModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Log Sleep</span>
          </button>
          <button
            onClick={() => {
              setHolisticType('nutrition');
              setShowHolisticModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border hover:border-surface-borderLight text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400">Average Score</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">
            {avgScore}<span className="text-xs text-zinc-500 font-normal">/100</span>
          </p>
          <span className="text-[10px] text-brand-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +4% vs last week
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400">Analyzed Reps</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">{totalRepsCount}</p>
          <span className="text-[10px] text-zinc-500 font-medium mt-1 block">Across {sessions.length} sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400">Avg Symmetry</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">94%</p>
          <span className="text-[10px] text-brand-400 font-medium flex items-center gap-0.5 mt-1">
            <CheckCircle2Icon className="w-3 h-3" /> Optimal Balance
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border">
          <span className="text-[11px] font-semibold text-zinc-400">Readiness Score</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
            {readiness?.readiness_score || 88}%
          </p>
          <span className="text-[10px] text-brand-400 font-medium flex items-center gap-0.5 mt-1">
            <Flame className="w-3 h-3 text-brand-400" /> Ready for High Load
          </span>
        </div>

      </div>

      {/* Technique Score Trend Chart */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Technique Score Trend</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Target: 85%+</span>
        </div>

        {/* CSS Bar Chart */}
        <div className="h-40 flex items-end gap-2 sm:gap-3 pt-6 border-b border-surface-border pb-2">
          {sessions.slice(0, 10).reverse().map((sess, idx) => {
            const h = Math.max(15, (sess.overall_score / 100) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {Math.round(sess.overall_score)}
                </div>
                <div
                  style={{ height: `${h}%` }}
                  className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                    sess.overall_score >= 85
                      ? 'bg-brand-500/80 group-hover:bg-brand-400'
                      : sess.overall_score >= 70
                      ? 'bg-amber-500/80 group-hover:bg-amber-400'
                      : 'bg-red-500/80 group-hover:bg-red-400'
                  }`}
                />
                <span className="text-[9px] text-zinc-500 font-mono truncate max-w-[32px]">
                  {sess.exercise_name?.slice(0, 3) || 'Rep'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Sessions Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white px-1">Session History</h3>

        {sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center text-zinc-400 text-xs">
            No completed workouts yet. Start an exercise session to track technique progress!
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => setSelectedSession(sess)}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-surface-borderLight cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center font-bold text-xs text-brand-400 font-mono">
                  {Math.round(sess.overall_score)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white capitalize">
                    {sess.exercise_name || sess.exercise_slug}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {sess.total_reps} Reps • {Math.round(sess.duration_seconds || 0)}s • {new Date(sess.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  sess.overall_score >= 85
                    ? 'text-status-good border-status-good/30 bg-status-good/10'
                    : 'text-status-attention border-status-attention/30 bg-status-attention/10'
                }`}>
                  {sess.overall_score >= 85 ? 'Solid Form' : 'Needs Work'}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Session Drilldown Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <PostWorkoutReport
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        </div>
      )}

      {/* Holistic Logging Modal */}
      {showHolisticModal && (
        <HolisticTrackingModal
          initialTab={holisticType}
          onClose={() => setShowHolisticModal(false)}
          onSuccess={() => {
            setShowHolisticModal(false);
          }}
        />
      )}

    </div>
  );
};

function CheckCircle2Icon(props: any) {
  return <Award {...props} />;
}
