import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n/LanguageContext";
import { sleepService } from "../../services/sleepService";
import { SleepRecord } from "../../types";
import {
  Moon, Sun, Clock, Sparkles, Plus, Trash2, Check,
  TrendingUp, AlertCircle, Info, X, Loader2
} from "lucide-react";

export const SleepView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:30");
  const [qualityRating, setQualityRating] = useState<number>(4);
  const [morningFeeling, setMorningFeeling] = useState<"Refreshed" | "Normal" | "Fatigued">("Refreshed");
  const [awakenings, setAwakenings] = useState<number>(0);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const loadSleepData = async () => {
    if (!user?.id) return;
    try {
      const data = await sleepService.getSleepRecords(String(user.id));
      setRecords(data);
    } catch (e) {
      console.error("Failed to load sleep records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSleepData();
  }, [user]);

  // Compute duration in hours and minutes
  const calculatedDuration = useMemo(() => {
    const [bH, bM] = bedtime.split(":").map(Number);
    const [wH, wM] = wakeTime.split(":").map(Number);

    let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // crossing midnight
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return { hours, minutes, totalMinutes: diffMinutes };
  }, [bedtime, wakeTime]);

  // Compute sleep insight
  const sleepInsight = useMemo(() => {
    const { hours } = calculatedDuration;
    if (hours >= 7.5 && qualityRating >= 4 && awakenings <= 1) {
      return {
        score: 92,
        status: t("sleep.optimalRecovery", "Optimal Recovery"),
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        message: language === "ru"
          ? "Отличная продолжительность сна и минимальное количество пробуждений. Нервно-мышечная система готова к интенсивной тренировке."
          : language === "kk"
          ? "Өте жақсы ұйқы ұзақтығы және аз ояну. Жүйке-бұлшықет жүйесі жоғары қарқынды жаттығуларға дайын."
          : "Excellent sleep duration and low disturbance. Your neuromuscular readiness for high-intensity training is peaked.",
        tips: language === "ru"
          ? [
              "Поддерживайте стабильное время отхода ко сну и подъема (разброс до 30 мин).",
              "Оптимальная температура в комнате: 18–20°C для глубокого сна.",
              "Избегайте кофеина за 8 часов до сна.",
            ]
          : language === "kk"
          ? [
              "Ұйықтау және ояну уақытын тұрақты ұстаңыз (30 минутқа дейін).",
              "Терең ұйқы үшін бөлме температурасы: 18–20°C.",
              "Ұйықтар алдында 8 сағат бұрын кофеиннен аулақ болыңыз.",
            ]
          : [
              "Maintain regular sleep and wake times within 30 minutes.",
              "Optimal room temperature: 18–20°C for deep slow-wave sleep.",
              "Avoid heavy caffeine within 8 hours before bedtime.",
            ],
      };
    } else if (hours < 6.5) {
      return {
        score: 68,
        status: t("sleep.needsRest", "Needs Rest"),
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        message: language === "ru"
          ? "Зафиксирован короткий сон (<6.5ч). Рекомендуется уделить внимание умеренной технике и водному балансу."
          : language === "kk"
          ? "Қысқа ұйқы тіркелді (<6.5сағ). Бүгін қалыпты техника мен су ішуге назар аударған жөн."
          : "Short sleep window detected (<6.5h). Consider focusing on moderate technique and hydration today.",
        tips: language === "ru"
          ? [
              "При необходимости сделайте 20-минутный дневной отдых до 15:00.",
              "Сделайте упор на разминку и подвижность суставов, а не на максимальные веса.",
              "Ограничьте экраны гаджетов за 45 минут до сна.",
            ]
          : language === "kk"
          ? [
              "Қажет болса, сағат 15:00-ге дейін 20 минуттық күндізгі демалыс жасаңыз.",
              "Максималды салмақтардың орнына буындардың қозғалғыштығына баса назар аударыңыз.",
              "Ұйықтар алдында 45 минут бұрын гаджет экрандарын шектеңіз.",
            ]
          : [
              "Incorporate a 20-minute power nap before 3:00 PM if needed.",
              "Focus on hydration and joint mobility today rather than maximum loads.",
              "Limit screen exposure 45 minutes prior to sleep tonight.",
            ],
      };
    } else {
      return {
        score: 82,
        status: t("sleep.goodRecovery", "Good Recovery"),
        badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        message: language === "ru"
          ? "Достаточный уровень отдыха. Хорошая база для стандартного тренировочного плана."
          : language === "kk"
          ? "Жеткілікті демалыс деңгейі. Стандартты жаттығу жоспары үшін жақсы негіз."
          : "Adequate rest achieved. Good foundation for standard training sets.",
        tips: language === "ru"
          ? [
              "Сохраняйте спокойный вечерний ритуал подготовки ко сну.",
              "Утренний солнечный свет помогает настроить циркадные ритмы.",
            ]
          : language === "kk"
          ? [
              "Кешкі тыныш ұйқыға дайындық режимін сақтаңыз.",
              "Таңертеңгі күн сәулесі циркадтық ырғақты реттеуге көмектеседі.",
            ]
          : [
              "Keep your evening wind-down routine calm and structured.",
              "Morning sunlight exposure helps set your circadian rhythm.",
            ],
      };
    }
  }, [calculatedDuration, qualityRating, awakenings, language, t]);

  const handleSaveSleep = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const newRec = await sleepService.logSleep(
        {
          log_date: today,
          bedtime,
          wake_time: wakeTime,
          total_sleep_minutes: calculatedDuration.totalMinutes,
          sleep_quality_score: qualityRating * 20,
          notes: morningFeeling,
        },
        String(user.id)
      );

      if (newRec) {
        setRecords((prev) => [newRec, ...prev]);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error("Failed to save sleep record:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string | number) => {
    try {
      await sleepService.deleteSleepRecord(id);
      setRecords((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (e) {
      console.error("Failed to delete sleep record:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Minimalist Recovery Overview Card */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-surface-border shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
            {t("sleep.title", "Sleep & Readiness")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              {calculatedDuration.hours}{t("sleep.hoursShort", "h")} {calculatedDuration.minutes}{t("sleep.minsShort", "m")}
            </span>
            <span className="text-xs text-stone-500 dark:text-zinc-400">{t("sleep.duration", "Duration")}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInsightsModal(true)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${sleepInsight.badgeColor}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{sleepInsight.status}</span>
          <span className="text-[11px] opacity-75 font-mono">({sleepInsight.score})</span>
        </button>
      </div>

      {/* 2. Sleek Sleep Logger Box */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-surface-border shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>{t("sleep.logTitle", "Log Sleep Session")}</span>
        </h2>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
            <span className="text-[10px] font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span>{t("sleep.bedtime", "Bedtime")}</span>
            </span>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-stone-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
            <span className="text-[10px] font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              <span>{t("sleep.wakeUp", "Wake Up")}</span>
            </span>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-stone-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Quality Rating (1-5) */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400 block">
            {t("sleep.quality", "Quality Rating")}
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQualityRating(star)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
                  qualityRating >= star
                    ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300"
                    : "bg-surface-subtle border-surface-border text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ★ {star}
              </button>
            ))}
          </div>
        </div>

        {/* Morning Feeling */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400 block">
            {t("sleep.feeling", "Morning Feeling")}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(["Refreshed", "Normal", "Fatigued"] as const).map((feel) => (
              <button
                key={feel}
                type="button"
                onClick={() => setMorningFeeling(feel)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
                  morningFeeling === feel
                    ? "bg-stone-200 dark:bg-zinc-800 border-stone-300 dark:border-zinc-600 text-stone-900 dark:text-white shadow-xs font-bold"
                    : "bg-surface-subtle border-surface-border text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200"
                }`}
              >
                {feel === "Refreshed"
                  ? `⚡ ${t("sleep.refreshed", "Refreshed")}`
                  : feel === "Normal"
                  ? `👌 ${t("sleep.normal", "Normal")}`
                  : `😴 ${t("sleep.tired", "Tired")}`}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t("sleep.saveSleep", "Log Sleep Record")}</span>
              </>
            )}
          </button>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-150">
              <Check className="w-4 h-4" /> {t("sleep.savedSuccess", "Saved successfully!")}
            </span>
          )}
        </div>
      </div>

      {/* 3. Sleep History Timeline */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider px-1">
          {t("sleep.pastHistory", "Past Sleep History")} ({records.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-stone-500 dark:text-zinc-500 text-xs flex flex-col items-center justify-center space-y-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500 dark:text-indigo-400" />
            <span>{t("trainer.loading", "Loading...")}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border text-center text-xs text-stone-500 dark:text-zinc-500 shadow-xs">
            {t("sleep.noHistory", "No sleep logs recorded yet.")}
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((rec) => {
              const hrs = Math.floor((rec.total_sleep_minutes || 480) / 60);
              const mins = (rec.total_sleep_minutes || 480) % 60;
              const quality = Math.round((rec.sleep_quality_score || 80) / 20);
              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 hover:border-surface-borderLight transition-colors shadow-xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-900 dark:text-white font-mono">
                        {rec.bedtime || "23:00"} → {rec.wake_time || "07:00"}
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                        {hrs}{t("sleep.hoursShort", "h")} {mins}{t("sleep.minsShort", "m")}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-3">
                      <span>★ {quality}/5</span>
                      <span>{rec.notes || "Good"}</span>
                      <span className="text-stone-400 dark:text-zinc-500">{rec.log_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Sleek Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">{t("sleep.insightsNotice", "Insights & Tips")}</h3>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800/80">
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">{t("progress.readinessScore", "Readiness Score")}</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {sleepInsight.score} / 100
                </span>
              </div>

              <p className="text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                {sleepInsight.message}
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t("sleep.insightsNotice", "Insights & Tips")}
                </span>
                {sleepInsight.tips.map((tip, idx) => (
                  <div key={idx} className="text-xs text-stone-600 dark:text-zinc-400 flex items-start gap-2">
                    <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowInsightsModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white text-xs font-semibold transition-colors shadow-xs"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
