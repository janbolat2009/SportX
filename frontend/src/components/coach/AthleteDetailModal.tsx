import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n/LanguageContext";
import { coachService } from "../../services/coachService";
import { TrainerFeedback, FeedbackType } from "../../types";
import {
  User, Award, X, Activity, MessageSquare, CheckCircle2, ShieldAlert,
  Moon, Utensils, HeartPulse, Clock, TrendingUp, AlertTriangle, Send, Loader2, Sparkles, Flame
} from "lucide-react";

interface Props {
  athleteId: number | string;
  onClose: () => void;
  onOpenChat?: (userId: string) => void;
}

type DetailTab = "workouts" | "sleep" | "nutrition" | "feedback";

export const AthleteDetailModal: React.FC<Props> = ({ athleteId, onClose, onOpenChat }) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [athleteData, setAthleteData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("workouts");

  // Trainer Feedback State
  const [feedbackTab, setFeedbackTab] = useState<FeedbackType>("feedback");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState<TrainerFeedback[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const queryId = String(athleteId);
        const [dossier, pastFeedback] = await Promise.all([
          coachService.getAthleteFullDossier(queryId),
          coachService.getAthleteTrainerFeedback(queryId).catch(() => [])
        ]);
        if (dossier) {
          setAthleteData(dossier);
        }
        setFeedbackList(pastFeedback || []);
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
      const athleteUserId = String(athleteData?.athlete_id || athleteId);

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

  const sessions = athleteData?.sessions || [];
  const sleepRecords = athleteData?.sleep_records || [];
  const nutritionRecords = athleteData?.nutrition_records || [];
  const avgScore = athleteData?.average_technique_score;
  const avgSymmetry = athleteData?.average_symmetry;
  const totalReps = athleteData?.total_reps || 0;
  const totalDurationMinutes = athleteData?.total_duration_minutes || 0;
  const avgSleepHours = athleteData?.average_sleep_hours;
  const recentCalories = athleteData?.recent_calories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* 1. Modal Header: Athlete Profile & Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-brand-400 text-lg shadow-xs overflow-hidden">
              {athleteData?.avatar_url ? (
                <img src={athleteData.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                athleteData?.full_name?.charAt(0) || "A"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">{athleteData?.full_name || "Athlete Profile"}</h3>
                <span className="text-[10px] font-mono bg-zinc-800 text-brand-400 border border-zinc-700 px-2 py-0.5 rounded-lg">
                  {athleteData?.anonymized_subject_id || `ATH-${String(athleteId).slice(0, 6)}`}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {athleteData?.sport || "General Fitness"} • {athleteData?.training_level || "Intermediate"}
                {athleteData?.height_cm ? ` • ${t("profile.height", "Height")}: ${athleteData.height_cm} cm` : ""}
                {athleteData?.weight_kg ? ` • ${t("profile.weight", "Weight")}: ${athleteData.weight_kg} kg` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(String(athleteData?.user_id || athleteId));
                }}
                className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t("chat.openChat", "Чат с атлетом")}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Key Telemetry Grid (Accuracy, Symmetry, Reps, Duration, Sleep, Calories) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("progress.avgScore", "Accuracy")}</span>
            <p className="text-xl font-black text-brand-400 font-mono mt-0.5">
              {avgScore != null ? `${avgScore}%` : "—"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.symmetryScore", "Symmetry")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">
              {avgSymmetry != null ? `${avgSymmetry}%` : "—"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.repsCount", "Reps")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">{totalReps}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("trainer.duration", "Duration")}</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">
              {totalDurationMinutes > 0 ? `${totalDurationMinutes}m` : "—"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("nav.sleep", "Sleep")}</span>
            <p className="text-xl font-black text-indigo-400 font-mono mt-0.5">
              {avgSleepHours != null ? `${avgSleepHours}h` : "—"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{t("nutrition.calories", "Calories")}</span>
            <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
              {recentCalories != null ? recentCalories : "—"}
            </p>
          </div>
        </div>

        {/* 3. Biomechanical Progress Over Time */}
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
                const score = Math.round(Number(sess.overall_score) || 0);
                const heightPct = Math.max(15, Math.min(100, score));
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
              {athleteData?.latest_session_feedback || t("trainer.noAiFeedback", "No AI technique feedback recorded yet.")}
            </p>
          </div>
        </div>

        {/* 5. Detail Tabs: Workouts | Sleep | Nutrition | Feedback */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("workouts")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "workouts"
                  ? "bg-brand-500 text-black shadow-xs"
                  : "bg-surface-subtle text-zinc-400 hover:text-white border border-surface-border"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t("trainer.history", "Workout Sessions")} ({sessions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sleep")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "sleep"
                  ? "bg-indigo-500 text-white shadow-xs"
                  : "bg-surface-subtle text-zinc-400 hover:text-white border border-surface-border"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{t("nav.sleep", "Sleep")} ({sleepRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("nutrition")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "nutrition"
                  ? "bg-amber-500 text-black shadow-xs"
                  : "bg-surface-subtle text-zinc-400 hover:text-white border border-surface-border"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t("nav.nutrition", "Nutrition")} ({nutritionRecords.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("feedback")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "feedback"
                  ? "bg-brand-500 text-black shadow-xs"
                  : "bg-surface-subtle text-zinc-400 hover:text-white border border-surface-border"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t("athleteFeedback.title", "Feedback & Notes")} ({feedbackList.length})</span>
            </button>
          </div>

          {/* TAB 1: Workouts History */}
          {activeTab === "workouts" && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  {t("progress.noSessions", "No completed sessions logged yet.")}
                </p>
              ) : (
                sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{s.exercise_name || "Exercise"}</p>
                      <p className="text-[11px] text-zinc-400">
                        {s.total_reps} {language === "ru" ? "повторов" : language === "kk" ? "қайталау" : "reps"} • {Math.round(s.duration_seconds || 0)}s • {new Date(s.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-brand-400 font-mono">
                        {Math.round(s.overall_score || 0)}%
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        {s.issues_count || 0} {language === "ru" ? "откл." : language === "kk" ? "қате" : "deviations"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Sleep Telemetry */}
          {activeTab === "sleep" && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sleepRecords.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  {t("sleep.noRecords", "No sleep logs recorded yet.")}
                </p>
              ) : (
                sleepRecords.map((sl: any) => (
                  <div
                    key={sl.id}
                    className="p-3 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{sl.sleep_date || sl.log_date}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {sl.bedtime || "23:00"} → {sl.wake_time || "07:00"} {sl.morning_feeling ? `• ${sl.morning_feeling}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-indigo-400 font-mono">
                        {((sl.duration_minutes || sl.total_sleep_minutes || 0) / 60).toFixed(1)}h
                      </span>
                      {sl.quality_rating && (
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          ★ {sl.quality_rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Nutrition Telemetry */}
          {activeTab === "nutrition" && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {nutritionRecords.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">
                  {t("nutrition.noRecords", "No nutrition records logged yet.")}
                </p>
              ) : (
                nutritionRecords.map((nut: any) => (
                  <div
                    key={nut.id}
                    className="p-3 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>{nut.meal_description || nut.meal_type || "Meal"}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {nut.date || nut.log_date} • {nut.meal_type} • P: {nut.protein_g}g • C: {nut.carbs_g}g • F: {nut.fats_g}g
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {nut.calories} kcal
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Trainer Feedback Form & History */}
          {activeTab === "feedback" && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-brand-400" />
                  <span>{t("trainer.writeFeedback", "Write Feedback or Instruction")}</span>
                </span>

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

              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t("trainer.feedbackPlaceholder", "Write personal observation or recommendation...")}
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
          )}
        </div>

      </div>
    </div>
  );
};
