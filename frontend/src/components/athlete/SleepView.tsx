import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { sleepService } from '../../services/sleepService';
import { SleepRecord } from '../../types';
import {
  Moon, Sun, Clock, Sparkles, Plus, Trash2, Check,
  TrendingUp, AlertCircle, Info, X, Loader2, Calendar,
  Zap, BarChart3, ChevronRight, BedDouble
} from 'lucide-react';

export const SleepView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [qualityRating, setQualityRating] = useState<number>(4); // 1-5 scale (mapped to 20-100)
  const [morningFeeling, setMorningFeeling] = useState<'Refreshed' | 'Normal' | 'Fatigued'>('Refreshed');
  const [notes, setNotes] = useState('');
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const loadSleepData = async () => {
    if (!user?.id) return;
    try {
      const data = await sleepService.getSleepRecords(String(user.id));
      setRecords(data);
    } catch (e) {
      console.error('Failed to load sleep records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSleepData();
  }, [user]);

  // Compute duration in hours and minutes for input fields
  const calculatedDuration = useMemo(() => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Crossing midnight
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return { hours, minutes, totalMinutes: diffMinutes };
  }, [bedtime, wakeTime]);

  // Check if today already has a logged record
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = useMemo(() => {
    return records.find(
      (r) => r.log_date === todayStr || (r.created_at && r.created_at.startsWith(todayStr))
    );
  }, [records, todayStr]);

  // Active display duration: from today's logged record if available, else calculated
  const displayDuration = useMemo(() => {
    if (todayRecord && todayRecord.total_sleep_minutes) {
      const h = Math.floor(todayRecord.total_sleep_minutes / 60);
      const m = todayRecord.total_sleep_minutes % 60;
      return { hours: h, minutes: m, totalMinutes: todayRecord.total_sleep_minutes };
    }
    return calculatedDuration;
  }, [todayRecord, calculatedDuration]);

  // Last 7 days aggregation for mini bar chart
  const last7Days = useMemo(() => {
    const days: { dateStr: string; dayLabel: string; hours: number; score: number; hasData: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString(
        language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US',
        { weekday: 'short' }
      );

      const record = records.find(
        (r) => r.log_date === dateStr || (r.created_at && r.created_at.startsWith(dateStr))
      );
      if (record && record.total_sleep_minutes) {
        const hours = Number((record.total_sleep_minutes / 60).toFixed(1));
        const score = record.sleep_quality_score || 80;
        days.push({ dateStr, dayLabel, hours, score, hasData: true });
      } else {
        days.push({ dateStr, dayLabel, hours: 0, score: 0, hasData: false });
      }
    }
    return days;
  }, [records, language]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const daysWithData = last7Days.filter((d) => d.hasData);
    if (daysWithData.length === 0) {
      return { avgHours: 0, avgScore: 0, totalDays: 0 };
    }
    const sumHours = daysWithData.reduce((acc, cur) => acc + cur.hours, 0);
    const sumScore = daysWithData.reduce((acc, cur) => acc + cur.score, 0);
    return {
      avgHours: Number((sumHours / daysWithData.length).toFixed(1)),
      avgScore: Math.round(sumScore / daysWithData.length),
      totalDays: daysWithData.length,
    };
  }, [last7Days]);

  // Compute sleep insight based on active record or current calculation
  const sleepInsight = useMemo(() => {
    const hours = displayDuration.hours + displayDuration.minutes / 60;
    const scoreVal = todayRecord?.sleep_quality_score ?? qualityRating * 20;

    if (hours >= 7.5 && scoreVal >= 75) {
      return {
        score: Math.min(100, Math.max(scoreVal, 88)),
        status: t('sleep.optimalRecovery', 'Optimal Recovery'),
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        gradient: 'from-emerald-500 to-teal-500',
        message:
          language === 'ru'
            ? 'Отличная продолжительность сна и высокий уровень восстановления. Нервно-мышечная система полностью готова к тренировкам.'
            : language === 'kk'
            ? 'Өте жақсы ұйқы ұзақтығы және қалпына келудің жоғары деңгейі. Жүйке-бұлшықет жүйесі жаттығуларға толық дайын.'
            : 'Excellent sleep duration and high recovery readiness. Your neuromuscular system is primed for peak athletic performance.',
        tips:
          language === 'ru'
            ? [
                'Поддерживайте стабильное время засыпания (разброс до 30 мин).',
                'Оптимальная температура в спальне: 18–20°C для фазы глубокого сна.',
                'Избегайте кофеина за 8 часов до сна для максимальной регенерации.',
              ]
            : language === 'kk'
            ? [
                'Ұйықтау уақытын тұрақты сақтаңыз (30 минутқа дейінгі ауытқу).',
                'Терең ұйқы кезеңі үшін жатын бөлмедегі оңтайлы температура: 18–20°C.',
                'Толық регенерация үшін ұйықтардан 8 сағат бұрын кофеиннен аулақ болыңыз.',
              ]
            : [
                'Maintain consistent sleep and wake timing within a 30-minute window.',
                'Optimal bedroom temperature is 18–20°C to facilitate deep slow-wave sleep.',
                'Avoid caffeine within 8 hours of bedtime to preserve sleep architecture.',
              ],
      };
    } else if (hours < 6.5) {
      return {
        score: Math.min(scoreVal, 68),
        status: t('sleep.needsRest', 'Needs Rest'),
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        gradient: 'from-amber-500 to-rose-500',
        message:
          language === 'ru'
            ? 'Зафиксирован короткий сон (<6.5ч). Рекомендуется скорректировать объем силовых нагрузок и уделить внимание гидратации.'
            : language === 'kk'
            ? 'Қысқа ұйқы тіркелді (<6.5сағ). Күш жаттығуларының көлемін азайтып, ағзаның су балансына назар аударған жөн.'
            : 'Short sleep window detected (<6.5h). We recommend focusing on moderate technique and hydration rather than max intensity.',
        tips:
          language === 'ru'
            ? [
                'При необходимости сделайте короткий 20-минутный дневной отдых до 15:00.',
                'Сделайте акцент на мобильность суставов и разминку вместо максимальных весов.',
                'Ограничьте синий свет от экранов за 45 минут до сна сегодня вечером.',
              ]
            : language === 'kk'
            ? [
                'Қажет болса, сағат 15:00-ге дейін 20 минуттық қысқа демалыс жасаңыз.',
                'Максималды салмақтардың орнына буын қозғалғыштығына назар аударыңыз.',
                'Бүгін кешке ұйықтар алдында 45 минут бұрын телефон мен экрандарды шектеңіз.',
              ]
            : [
                'Consider a 20-minute power nap before 3:00 PM if fatigue sets in.',
                'Focus on joint mobility and active recovery rather than maximum loads.',
                'Limit screen exposure 45 minutes prior to bedtime tonight.',
              ],
      };
    } else {
      return {
        score: Math.min(100, Math.max(scoreVal, 80)),
        status: t('sleep.goodRecovery', 'Good Recovery'),
        badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        gradient: 'from-sky-500 to-indigo-500',
        message:
          language === 'ru'
            ? 'Достаточный уровень отдыха. Хорошая база для выполнения запланированной тренировочной программы.'
            : language === 'kk'
            ? 'Жеткілікті демалыс деңгейі. Жоспарланған жаттығу бағдарламасын орындау үшін жақсы негіз.'
            : 'Solid baseline rest achieved. Ready for your standard training volume and skill progression.',
        tips:
          language === 'ru'
            ? [
                'Сохраняйте спокойный вечерний ритуал подготовки ко сну.',
                'Утренний солнечный свет помогает синхронизировать циркадные ритмы.',
              ]
            : language === 'kk'
            ? [
                'Кешкі тыныш ұйқыға дайындық режимін сақтаңыз.',
                'Таңертеңгі күн сәулесі циркадтық ырғақты синхрондауға көмектеседі.',
              ]
            : [
                'Keep your evening wind-down routine calm and structured.',
                'Early morning daylight exposure helps synchronize your circadian clock.',
              ],
      };
    }
  }, [displayDuration, todayRecord, qualityRating, language, t]);

  // Target values for Apple Capsule Gauges
  const targetDurationHours = 8.0;
  const currentDurationHours = Number((displayDuration.totalMinutes / 60).toFixed(1));
  const durationPercent = Math.min(100, Math.round((currentDurationHours / targetDurationHours) * 100));
  const qualityPercent = todayRecord?.sleep_quality_score ?? (qualityRating * 20);
  const consistencyPercent = 88; // Circadian alignment score

  const handleSaveSleep = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const newRec = await sleepService.logSleep(
        {
          log_date: todayStr,
          bedtime,
          wake_time: wakeTime,
          total_sleep_minutes: calculatedDuration.totalMinutes,
          sleep_quality_score: qualityRating * 20,
          morning_feeling: morningFeeling.toLowerCase(),
          notes: notes.trim() || undefined,
        },
        String(user.id)
      );

      if (newRec) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.log_date !== todayStr);
          return [newRec, ...filtered];
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save sleep record:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string | number) => {
    try {
      await sleepService.deleteSleepRecord(id);
      setRecords((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (e) {
      console.error('Failed to delete sleep record:', e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-4 pb-24 space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header & Apple Health Main Status Card */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        
        {/* Top bar: title + recovery status badge */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-400 uppercase tracking-wider block">
              {t('sleep.title', 'Sleep & Readiness')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
                {displayDuration.hours}
                <span className="text-lg font-semibold text-stone-400 dark:text-zinc-500">
                  {t('sleep.hoursShort', 'h')}{' '}
                </span>
                {displayDuration.minutes}
                <span className="text-lg font-semibold text-stone-400 dark:text-zinc-500">
                  {t('sleep.minsShort', 'm')}
                </span>
              </span>
              <span className="text-xs font-medium text-stone-400 dark:text-zinc-500">
                / {targetDurationHours}h target
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInsightsModal(true)}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${sleepInsight.badgeColor}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{sleepInsight.status}</span>
            <span className="text-[11px] font-mono opacity-80">({sleepInsight.score})</span>
          </button>
        </div>

        {/* Soft Apple Sleep Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${sleepInsight.gradient} transition-all duration-500 ease-out shadow-xs`}
            style={{ width: `${Math.min(100, durationPercent)}%` }}
          />
        </div>

        {/* 3 Clean Apple Capsule Meters (Matching NutritionView aesthetic) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {/* Duration (Apple Indigo) */}
          <div className="p-3 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/[0.12] border border-indigo-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t('sleep.duration', 'Duration')}
              </span>
              <span className="text-[10px] font-mono text-indigo-500/80">
                {durationPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {currentDurationHours}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / {targetDurationHours}h
              </span>
            </div>
            <div className="w-full bg-indigo-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, durationPercent)}%` }}
              />
            </div>
          </div>

          {/* Quality Score (Apple Emerald) */}
          <div className="p-3 rounded-2xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.12] border border-emerald-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t('sleep.quality', 'Quality')}
              </span>
              <span className="text-[10px] font-mono text-emerald-500/80">
                {qualityPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {qualityPercent}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / 100
              </span>
            </div>
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${qualityPercent}%` }}
              />
            </div>
          </div>

          {/* Circadian Consistency (Apple Amber) */}
          <div className="p-3 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.12] border border-amber-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t('sleep.circadianRhythm', 'Circadian')}
              </span>
              <span className="text-[10px] font-mono text-amber-500/80">
                {consistencyPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {consistencyPercent}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / 100
              </span>
            </div>
            <div className="w-full bg-amber-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${consistencyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Apple Health Sleep Logger Card */}
      <div className="p-5 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Moon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {t('sleep.logTitle', 'Log Sleep Session')}
            </h2>
          </div>

          <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full">
            {calculatedDuration.hours}{t('sleep.hoursShort', 'h')} {calculatedDuration.minutes}{t('sleep.minsShort', 'm')}
          </span>
        </div>

        {/* Time Segmented Pickers (Bedtime & Wake Up) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800 space-y-1.5 transition-colors focus-within:border-indigo-500/50">
            <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('sleep.bedtime', 'Bedtime')}</span>
            </span>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-stone-900 dark:text-white focus:outline-none font-mono"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800 space-y-1.5 transition-colors focus-within:border-amber-500/50">
            <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('sleep.wakeUp', 'Wake Up')}</span>
            </span>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-stone-900 dark:text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Quality Rating (1-5 Segmented Selector) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              {t('sleep.quality', 'Quality Rating')}
            </span>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {qualityRating * 20}/100
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-stone-100 dark:bg-zinc-800/80 rounded-2xl">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQualityRating(star)}
                className={`py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1 ${
                  qualityRating === star
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : qualityRating > star
                    ? 'text-indigo-500/80 dark:text-indigo-400/80 hover:text-indigo-600'
                    : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                }`}
              >
                <span>★</span>
                <span>{star}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Morning Feeling Chips (Apple Capsule Pills) */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
            {t('sleep.feeling', 'Morning Feeling')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['Refreshed', 'Normal', 'Fatigued'] as const).map((feel) => (
              <button
                key={feel}
                type="button"
                onClick={() => setMorningFeeling(feel)}
                className={`py-2.5 px-2 rounded-2xl text-xs font-medium border transition-all duration-150 active:scale-95 text-center truncate ${
                  morningFeeling === feel
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                    : 'bg-stone-50 dark:bg-zinc-800/40 border-stone-200/60 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:border-stone-300'
                }`}
              >
                {feel === 'Refreshed'
                  ? `⚡ ${t('sleep.refreshed', 'Refreshed')}`
                  : feel === 'Normal'
                  ? `👌 ${t('sleep.normal', 'Normal')}`
                  : `😴 ${t('sleep.tired', 'Tired')}`}
              </button>
            ))}
          </div>
        </div>

        {/* Notes input */}
        <div className="space-y-1">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              language === 'ru'
                ? 'Заметки (сновидения, самочувствие, пробуждения)...'
                : language === 'kk'
                ? 'Жазбалар (түстер, көңіл-күй, оянулар)...'
                : 'Notes (sleep quality, wakeups, dreams)...'
            }
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Log Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{t('sleep.saveSleep', 'Log Sleep Record')}</span>
              </>
            )}
          </button>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
              <Check className="w-4 h-4" /> {t('sleep.savedSuccess', 'Saved successfully!')}
            </span>
          )}
        </div>
      </div>

      {/* 3. Weekly Overview Card with 7-Day Mini Bar Chart */}
      <div className="p-5 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {t('sleep.weeklyAverage', 'Weekly Average')}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-stone-900 dark:text-white">
                {weeklyStats.avgHours > 0 ? `${weeklyStats.avgHours}h` : '—'}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                {t('sleep.duration', 'avg')}
              </span>
            </div>
            <span className="text-stone-300 dark:text-zinc-700">•</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {weeklyStats.avgScore > 0 ? `${weeklyStats.avgScore}%` : '—'}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                {t('sleep.avgQuality', 'quality')}
              </span>
            </div>
          </div>
        </div>

        {/* 7-day mini bar visualization */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-2 items-end h-28 px-1">
            {last7Days.map((day, idx) => {
              const maxScaleHours = 10;
              const barHeightPercent = day.hasData
                ? Math.min(100, Math.max(12, Math.round((day.hours / maxScaleHours) * 100)))
                : 0;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
                    {day.hasData ? `${day.hours}h` : '—'}
                  </span>

                  <div className="w-full max-w-[28px] bg-stone-100 dark:bg-zinc-800/80 rounded-xl h-20 flex items-end p-1 overflow-hidden">
                    {day.hasData ? (
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          day.hours >= 7.5
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                            : day.hours >= 6
                            ? 'bg-gradient-to-t from-indigo-500 to-sky-400'
                            : 'bg-gradient-to-t from-amber-500 to-rose-400'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      />
                    ) : (
                      <div className="w-full h-1 rounded-full bg-stone-200 dark:bg-zinc-700/50" />
                    )}
                  </div>

                  <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 capitalize">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Sleep History Timeline */}
      <div className="p-5 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('sleep.pastHistory', 'Past Sleep History')}</span>
            <span>({records.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-stone-500 dark:text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span>{t('trainer.loading', 'Loading...')}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-6 rounded-2xl bg-stone-50/50 dark:bg-zinc-800/30 border border-dashed border-stone-200 dark:border-zinc-800 text-center text-xs text-stone-400 dark:text-zinc-500">
            {t('sleep.noHistory', 'No sleep records logged yet. Start tracking your sleep to optimize athletic recovery.')}
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {records.map((rec) => {
              const hrs = Math.floor((rec.total_sleep_minutes || 480) / 60);
              const mins = (rec.total_sleep_minutes || 480) % 60;
              const quality = Math.round((rec.sleep_quality_score || 80) / 20);

              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-stone-50/70 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-colors shadow-xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-stone-900 dark:text-white font-mono">
                        {rec.bedtime || '23:00'} → {rec.wake_time || '07:30'}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {hrs}{t('sleep.hoursShort', 'h')} {mins}{t('sleep.minsShort', 'm')}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 dark:text-zinc-400 flex items-center gap-3">
                      <span className="text-amber-500 font-medium">★ {quality}/5</span>
                      {rec.notes && <span className="truncate max-w-[140px] sm:max-w-xs">{rec.notes}</span>}
                      <span className="text-stone-400 dark:text-zinc-500 font-mono">
                        {rec.log_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors shrink-0"
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

      {/* 5. Apple Health Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {t('sleep.insightsNotice', 'Insights & Tips')}
                </h3>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-800">
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                  {t('sleep.readinessScore', 'Readiness Score')}
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {sleepInsight.score} / 100
                </span>
              </div>

              <p className="text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
                {sleepInsight.message}
              </p>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {t('sleep.insightsNotice', 'Recommendations')}
                </span>
                {sleepInsight.tips.map((tip, idx) => (
                  <div key={idx} className="text-xs text-stone-600 dark:text-zinc-400 flex items-start gap-2.5">
                    <span className="text-indigo-500 font-bold mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowInsightsModal(false)}
              className="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-900 dark:text-white text-xs font-bold transition-colors shadow-xs"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
