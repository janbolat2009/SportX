import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  User, Award, X, Activity, MessageSquare, CheckCircle2, ShieldAlert,
  Moon, Utensils, HeartPulse
} from 'lucide-react';

interface Props {
  athleteId: number | string;
  onClose: () => void;
}

export const AthleteDetailModal: React.FC<Props> = ({ athleteId, onClose }) => {
  const [athleteData, setAthleteData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const data = await api.getAthleteDetailForCoach(Number(athleteId) || 1);
        setAthleteData(data);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [athleteId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !selectedSessionId) return;
    try {
      await api.addCoachComment({
        session_id: selectedSessionId,
        content: commentText
      });
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const holistic = athleteData?.holistic;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 text-lg">
              {athleteData?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">{athleteData?.full_name}</h3>
                <span className="text-xs font-mono bg-slate-800 text-cyan-300 px-2 py-0.5 rounded">
                  {athleteData?.anonymized_subject_id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {athleteData?.sport} • {athleteData?.training_level} • Height: {athleteData?.height_cm || 176} cm • Weight: {athleteData?.weight_kg || 68} kg
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Holistic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Avg Sleep</p>
              <p className="text-sm font-bold text-white">{holistic?.sleep?.average_hours || 8.5} hrs / night</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Recovery Readiness</p>
              <p className="text-sm font-bold text-emerald-400">{holistic?.recovery?.latest_readiness || 86.5} / 100</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Sessions Logged</p>
              <p className="text-sm font-bold text-white">{athleteData?.total_sessions || 0} Workouts</p>
            </div>
          </div>
        </div>

        {/* Issue Frequency Distribution */}
        {athleteData?.issue_distribution && Object.keys(athleteData.issue_distribution).length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono mb-2">
              Detected Technique Deviation Frequencies
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(athleteData.issue_distribution).map(([issue, count]: any) => (
                <span
                  key={issue}
                  className="text-xs font-medium px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5"
                >
                  <span>{issue}:</span>
                  <span className="font-bold font-mono text-white">{count}x</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sessions History List */}
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Workout Session History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {athleteData?.sessions?.map((s: any) => (
              <div
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                  selectedSessionId === s.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div>
                  <p className="font-bold text-white">{s.exercise_name}</p>
                  <p className="text-slate-400">{s.created_at} • {s.total_reps} Reps</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-400">{s.overall_score}/100</span>
                  <p className="text-[10px] text-slate-400">{s.issues_count} Deviations</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Coach Comment */}
        <form onSubmit={handlePostComment} className="pt-2 border-t border-slate-800 space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase font-mono block">
            Leave Coach Feedback for Session #{selectedSessionId || ''}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Great depth on rep 4, keep your torso more upright on the ascent."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!commentText}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              Post Feedback
            </button>
          </div>
          {commentSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Feedback delivered to athlete.
            </p>
          )}
        </form>

      </div>
    </div>
  );
};
