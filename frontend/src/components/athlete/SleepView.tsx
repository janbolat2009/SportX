import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Moon, Sun, Sparkles, CheckCircle2, Clock,
  Flame, BatteryCharging, AlertCircle, Plus, Trash2, Loader2
} from 'lucide-react';

interface SleepRecord {
  id?: string;
  user_id?: string;
  sleep_date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  quality_rating: number; // 1 - 5
  awakenings_count: number;
  morning_feeling: string;
  insights_summary?: string;
  created_at?: string;
}

export const SleepView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [qualityRating, setQualityRating] = useState(4);
  const [awakenings, setAwakenings] = useState(0);
  const [morningFeeling, setMorningFeeling] = useState<'Refreshed' | 'Normal' | 'Fatigued'>('Refreshed');

  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Automatically calculate duration crossing midnight
  const calculatedDuration = useMemo(() => {
    if (!bedtime || !wakeTime) return { hours: 8, minutes: 0, totalMinutes: 480 };

    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let startMins = bH * 60 + bM;
    let endMins = wH * 60 + wM;

    if (endMins <= startMins) {
      // Crossed midnight (e.g. 23:30 to 07:10)
      endMins += 24 * 60;
    }

    const diffMins = endMins - startMins;
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return { hours, minutes, totalMinutes: diffMins };
  }, [bedtime, wakeTime]);

  // Load past sleep records from Supabase
  useEffect(() => {
    async function fetchSleepRecords() {
      if (!isSupabaseConfigured() || !user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sleep_records')
          .select('*')
          .eq('user_id', String(user.id))
          .order('sleep_date', { ascending: false })
          .limit(14);

        if (!error && data) {
          setRecords(data as any);
        }
      } catch (err) {
        console.warn('Notice loading sleep records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSleepRecords();
  }, [user]);

  // Compute sleep insight
  const sleepInsight = useMemo(() => {
    const { hours } = calculatedDuration;
    if (hours >= 7.5 && qualityRating >= 4 && awakenings <= 1) {
      return {
        score: 92,
        status: 'Optimal Recovery',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        message: 'Excellent sleep duration and low disturbance. Your neuromuscular readiness for high-intensity training is peaked.',
      };
    } else if (hours < 6.5) {
      return {
        score: 68,
        status: 'Insufficient Rest',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        message: 'Short sleep window detected (<6.5h). Consider focusing on moderate technique and hydration today.',
      };
    } else {
      return {
        score: 82,
        status: 'Moderate Recovery',
        color: 'text-sky-400',
        bg: 'bg-sky-500/10 border-sky-500/20',
        message: 'Adequate rest achieved. Good foundation for standard training sets.',
      };
    }
  }, [calculatedDuration, qualityRating, awakenings]);

  const handleSaveSleep = async () => {
    if (!user?.id) return;
    setSaving(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: SleepRecord = {
      user_id: String(user.id),
      sleep_date: todayStr,
      bedtime,
      wake_time: wakeTime,
      duration_minutes: calculatedDuration.totalMinutes,
      quality_rating: qualityRating,
      awakenings_count: awakenings,
      morning_feeling: morningFeeling,
      insights_summary: sleepInsight.message,
      created_at: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('sleep_records')
          .insert(newRecord)
          .select()
          .single();

        if (!error && data) {
          setRecords((prev) => [data as any, ...prev]);
        } else {
          setRecords((prev) => [{ ...newRecord, id: String(Date.now()) }, ...prev]);
        }
      } else {
        setRecords((prev) => [{ ...newRecord, id: String(Date.now()) }, ...prev]);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save sleep error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id?: string) => {
    if (!id) return;
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('sleep_records').delete().eq('id', id);
      }
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete sleep error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Moon className="w-6 h-6 text-indigo-400" />
          <span>{t('sleep.title', 'Sleep & Recovery Insights')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {t('sleep.subtitle', 'Track sleep and wake times to calculate objective sleep duration and evaluate training readiness.')}
        </p>
      </div>

      {/* Sleep Logger Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Log Last Night's Sleep</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
            Auto-calculated Duration
          </span>
        </div>

        {/* Time Input Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bedtime */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bedtime</span>
            </label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Wake Time */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Wake Time</span>
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Calculated Duration Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Total Duration
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white font-mono">
                {calculatedDuration.hours}h {calculatedDuration.minutes}m
              </span>
            </div>
            <span className="text-[10px] text-indigo-300/80 font-mono">
              ({calculatedDuration.totalMinutes} minutes)
            </span>
          </div>
        </div>

        {/* Subjective Factors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Quality Rating */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Sleep Quality (1 - 5)
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQualityRating(star)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    qualityRating >= star
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  ★ {star}
                </button>
              ))}
            </div>
          </div>

          {/* Night Awakenings */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Night Awakenings
            </label>
            <select
              value={awakenings}
              onChange={(e) => setAwakenings(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>0 (Slept through night)</option>
              <option value={1}>1 time</option>
              <option value={2}>2 times</option>
              <option value={3}>3+ times</option>
            </select>
          </div>

          {/* Morning Feeling */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Morning Sensation
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['Refreshed', 'Normal', 'Fatigued'] as const).map((feel) => (
                <button
                  key={feel}
                  type="button"
                  onClick={() => setMorningFeeling(feel)}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    morningFeeling === feel
                      ? 'bg-zinc-800 border-indigo-500 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {feel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI-Assisted Sleep Recovery Assessment */}
        <div className={`p-4 rounded-2xl border ${sleepInsight.bg} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className={`w-4 h-4 ${sleepInsight.color}`} />
              <span>Recovery Assessment: <b className={sleepInsight.color}>{sleepInsight.status}</b></span>
            </span>
            <span className="text-xs font-mono font-bold text-white">
              Score: {sleepInsight.score}/100
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {sleepInsight.message}
          </p>
          <p className="text-[10px] text-zinc-500 italic">
            Note: Subjective factors provide an estimated recovery insight, not a clinical sleep measurement.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Save Sleep Record</span>
              </>
            )}
          </button>

          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Sleep record saved!
            </span>
          )}
        </div>
      </div>

      {/* Sleep History Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-200">
          Sleep History ({records.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <p>Loading sleep history...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-400">No sleep records logged yet.</p>
            <p className="text-[11px] text-zinc-500">
              Log your sleep daily to assess weekly recovery patterns and biomechanical readiness.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map((rec) => {
              const hrs = Math.floor((rec.duration_minutes || 0) / 60);
              const mins = (rec.duration_minutes || 0) % 60;
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        {rec.sleep_date}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {rec.bedtime} → {rec.wake_time}
                      </span>
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        ({hrs}h {mins}m)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Quality: {rec.quality_rating}/5 • Feeling: {rec.morning_feeling}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
