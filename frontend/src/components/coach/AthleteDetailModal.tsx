import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n/LanguageContext";
import { api } from "../../services/api";
import { coachService } from "../../services/coachService";
import { TrainerFeedback, FeedbackType } from "../../types";
import {
  User, Award, X, Activity, MessageSquare, CheckCircle2, ShieldAlert,
  Moon, Utensils, HeartPulse, Clock, TrendingUp, AlertTriangle, Send, Loader2, Sparkles, BookOpen, Flame
} from "lucide-react";

interface Props {
  athleteId: number | string;
  onClose: () => void;
}

export const AthleteDetailModal: React.FC<Props> = ({ athleteId, onClose }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [athleteData, setAthleteData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Trainer Feedback State
  const [feedbackTab, setFeedbackTab] = useState<FeedbackType>("feedback");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState<TrainerFeedback[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const [data, pastFeedback] = await Promise.all([
          api.getAthleteDetailForCoach(Number(athleteId) || 1),
          coachService.getAthleteTrainerFeedback(String(athleteId))
        ]);
        setAthleteData(data);
        setFeedbackList(pastFeedback);
      } catch (e) {
        console.error("Failed to load athlete detail for trainer:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [athleteId]);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || submittingFeedback) return;

    setSubmittingFeedback(true);
    try {
      const trainerUserId = user?.id ? String(user.id) : "trainer-1";
      const athleteUserId = String(athleteId);

      const created = await coachService.addTrainerFeedback({
        trainer_id: trainerUserId,
        athlete_id: athleteUserId,
        trainer_name: user?.full_name || "Trainer",
        athlete_name: athleteData?.full_name || "Athlete",
        type: feedbackTab,
        content: feedbackText.trim(),
      });

      setFeedbackList((prev) => [created, ...prev]);
      setFeedbackText("");
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
        <div className="p-6 rounded-3xl bg-surface-card border border-surface-border flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">{t("trainer.loading", "Loading telemetry...")}</p>
        </div>
      </div>
    );
  }

  const holistic = athleteData?.holistic;
  const sessions = athleteData?.sessions || [];
  const avgScore = athleteData?.recent_average_score || athleteData?.average_technique_score || 87;
  const totalReps = athleteData?.total_reps_analyzed || sessions.reduce((acc: number, s: any) => acc + (s.total_reps || 10), 0) || 48;
  const totalDurationMinutes = Math.round((sessions.reduce((acc: number, s: any) => acc + (s.duration_seconds || 180), 0) || 540) / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* 1. Modal Header: Athlete Profile & Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-brand-400 text-lg shadow-xs">
              {athleteData?.full_name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">{athleteData?.full_name || "Athlete Profile"}</h3>
                <span className="text-[10px] font-mono bg-zinc-800 text-brand-400 border border-zinc-700 px-2 py-0.5 rounded-lg">
                  {athleteData?.anonymized_subject_id || "ATH-001"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {athleteData?.sport || "General Fitness"} • {athleteData?.training_level || "Intermediate"} • {t("profile.height", "Height")}: {athleteData?.height_cm || 176} cm • {t("profile.weight", "Weight")}: {athleteData?.weight_kg || 68} kg
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Key Telemetry Grid (Accuracy, Symmetry, Reps, Duration, Sleep, Calories) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("progress.avgScore", "Accuracy")}</span>
            <p className="text-xl font-black text-brand-400 font-mono mt-0.5">{avgScore}%</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.symmetryScore", "Symmetry")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">94%</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.repsCount", "Reps")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">{totalReps}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.duration", "Duration")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">{totalDurationMinutes}m</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("nav.sleep", "Sleep")}</span>
            <p className="text-xl font-black text-indigo-400 font-mono mt-0.5">{holistic?.sleep?.average_hours || 8.2}h</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("nutrition.calories", "Calories")}</span>
            <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{holistic?.nutrition?.total_calories || 2350}</p>
          </div>
        </div>

        {/* 3. Biomechanical Progress Over Time (Simple Visualization) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              <span>{t("trainer.progressOverTime", "Technique Progress Over Time")}</span>
            </h4>
            <span className="text-[11px] font-mono text-zinc-400">{t("progress.target", "Target: 85%+")}</span>
          </div>

          {sessions.length > 0 ? (
            <div className="h-28 flex items-end gap-2 pt-4 border-b border-surface-border pb-1">
              {sessions.slice(0, 8).reverse().map((sess: any, idx: number) => {
                const score = Math.round(sess.overall_score || 85);
                const heightPct = Math.max(20, Math.min(100, score));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {score}%
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all ${
                        score >= 85 ? "bg-brand-500" : score >= 70 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="text-[8px] font-mono text-zinc-500 truncate max-w-[28px]">
                      {sess.exercise_name?.slice(0, 3) || "Rep"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-zinc-500">
              {t("progress.noSessions", "No completed sessions logged yet.")}
            </div>
          )}
        </div>

        {/* 4. Detected Technique Problems & AI Technique Feedback */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-status-attention" />
              <span>{t("trainer.deviations", "Detected Technique Problems")}</span>
            </h4>
            {athleteData?.issue_distribution && Object.keys(athleteData.issue_distribution).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(athleteData.issue_distribution).map(([issue, count]: any) => (
                  <span
                    key={issue}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5"
                  >
                    <span>{issue}</span>
                    <span className="font-mono font-bold text-white">({count}x)</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-1">
                {t("trainer.noDeviations", "No frequent deviations detected. Form is consistent.")}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>{t("video.aiFeedback", "AI Technique Feedback")}</span>
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {athleteData?.latest_session_feedback || "Knee tracking stayed balanced through 92% of repetitions. Slight forward torso displacement detected under fatigue on reps 8–10."}
            </p>
          </div>
        </div>

        {/* 5. TRAINER FEEDBACK SECTION: Add Feedback, Add Note, Add Recommendation */}
        <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>{t("athleteFeedback.title", "Trainer Feedback & Recommendations")}</span>
            </h4>

            {/* 3 Selector Tabs: Add Feedback, Add Note, Add Recommendation */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setFeedbackTab("feedback")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  feedbackTab === "feedback"
                    ? "bg-brand-500 text-black shadow-xs font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("trainer.addFeedbackTab", "Add Feedback")}
              </button>

              <button
                type="button"
                onClick={() => setFeedbackTab("note")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  feedbackTab === "note"
                    ? "bg-brand-500 text-black shadow-xs font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("trainer.addNoteTab", "Add Note")}
              </button>

              <button
                type="button"
                onClick={() => setFeedbackTab("recommendation")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  feedbackTab === "recommendation"
                    ? "bg-brand-500 text-black shadow-xs font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("trainer.addRecommendationTab", "Add Recommendation")}
              </button>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSendFeedback} className="space-y-3">
            <textarea
              rows={3}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t("trainer.feedbackPlaceholder", "Write personal observation or recommendation (e.g. Keep your knees aligned with your feet during squats)...")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 resize-none transition-colors"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500">
                {feedbackTab === "feedback"
                  ? t("athleteFeedback.feedbackBadge", "Technique Feedback")
                  : feedbackTab === "note"
                  ? t("athleteFeedback.noteBadge", "Personal Note")
                  : t("athleteFeedback.recBadge", "Recommendation")}
              </span>

              <button
                type="submit"
                disabled={!feedbackText.trim() || submittingFeedback}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md shadow-brand-500/20 flex items-center gap-1.5 active:scale-95"
              >
                {submittingFeedback ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{t("trainer.sendFeedback", "Send to Athlete")}</span>
              </button>
            </div>

            {feedbackSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("trainer.feedbackSaved", "Feedback delivered to athlete successfully.")}</span>
              </p>
            )}
          </form>

          {/* Past Feedback & Notes List */}
          <div className="pt-3 border-t border-zinc-850 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              {t("trainer.recentFeedback", "Past Observations & Notes")} ({feedbackList.length})
            </span>

            {feedbackList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                {t("athleteFeedback.empty", "No notes recorded yet.")}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {feedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        fb.type === "recommendation"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : fb.type === "note"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {fb.type}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-200 mt-1">{fb.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6. Training History List */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>{t("trainer.history", "Workout Session History")} ({sessions.length})</span>
          </h4>

          {sessions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              {t("progress.noSessions", "No sessions recorded.")}
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sessions.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{s.exercise_name || "Exercise"}</p>
                    <p className="text-[11px] text-zinc-400">
                      {s.total_reps} {language === "ru" ? "повторов" : language === "kk" ? "қайталау" : "reps"} • {Math.round(s.duration_seconds || 120)}s • {new Date(s.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-brand-400 font-mono">
                      {Math.round(s.overall_score || 85)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-mono">
                      {s.issues_count || 0} {language === "ru" ? "откл." : language === "kk" ? "қате" : "deviations"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
