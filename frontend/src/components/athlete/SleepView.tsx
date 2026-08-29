import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Moon, Sun, Sparkles, Check, Clock,
  Plus, Trash2, Loader2, Info, ChevronRight, X
} from 'lucide-react';

interface SleepRecord {
  id?: string;
  user_id?: string;
  sleep_date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  quality_rating: number;
  awakenings_count: number;
  morning_feeling: string;
  insights_summary?: string;
  created_at?: string;
}

export const SleepView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:15');
  const [qualityRating, setQualityRating] = useState(4);
  const [awakenings, setAwakenings] = useState(0);
  const [morningFeeling, setMorningFeeling] = useState<'Refreshed' | 'Normal' | 'Fatigued'>('Refreshed');

  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Automatically calculate duration crossing midnight
  const calculatedDuration = useMemo(() => {
    if (!bedtime || !wakeTime) return { hours: 8, minutes: 15, totalMinutes: 495 };

    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);

    let startMins = bH * 60 + bM;
    let endMins = wH * 60 + wM;

    if (endMins <= startMins) {
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
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        message: 'Excellent sleep duration and low disturbance. Your neuromuscular readiness for high-intensity training is peaked.',
        tips: [
          'Maintain regular sleep and wake times within 30 minutes.',
          'Optimal room temperature: 18–20°C for deep slow-wave sleep.',
          'Avoid heavy caffeine within 8 hours before bedtime.',
        ],
      };
    } else if (hours < 6.5) {
      return {
        score: 68,
        status: 'Needs Rest',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        message: 'Short sleep window detected (<6.5h). Consider focusing on moderate technique and hydration today.',
        tips: [
          'Incorporate a 20-minute power nap before 3:00 PM if needed.',
          'Focus on hydration and joint mobility today rather than maximum loads.',
          'Limit screen exposure 45 minutes prior to sleep tonight.',
        ],
      };
    } else {
      return {
        score: 82,
        status: 'Good Recovery',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        message: 'Adequate rest achieved. Good foundation for standard training sets.',
        tips: [
          'Keep your evening wind-down routine calm and structured.',
          'Morning sunlight exposure helps set your circadian rhythm.',
        ],
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
      setTimeout(() => setSaveSuccess(false), 2500);
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
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Minimalist Recovery Overview Card */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
            {t('sleep.title', 'Sleep & Readiness')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {calculatedDuration.hours}h {calculatedDuration.minutes}m
            </span>
            <span className="text-xs text-zinc-400">Duration</span>
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
      <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span>Log Sleep Session</span>
        </h2>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Bedtime</span>
            </span>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Wake Up</span>
            </span>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Quality Rating (1-5) */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400 block">
            Quality Rating
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setQualityRating(star)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
                  qualityRating >= star
                    ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
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
            Morning Feeling
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['Refreshed', 'Normal', 'Fatigued'] as const).map((feel) => (
              <button
                key={feel}
                type="button"
                onClick={() => setMorningFeeling(feel)}
                className={`py-2 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
                  morningFeeling === feel
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-xs'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {feel === 'Refreshed' ? '⚡ Refreshed' : feel === 'Normal' ? '👌 Normal' : '😴 Tired'}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Record</span>
              </>
            )}
          </button>

          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-150">
              <Check className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>

      {/* 3. Sleep History Timeline */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Recent Sleep ({records.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-center text-xs text-zinc-500">
            No sleep records logged yet.
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((rec) => {
              const hrs = Math.floor((rec.duration_minutes || 0) / 60);
              const mins = (rec.duration_minutes || 0) % 60;
              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white font-mono">
                        {rec.bedtime} → {rec.wake_time}
                      </span>
                      <span className="text-xs font-semibold text-indigo-400 font-mono">
                        {hrs}h {mins}m
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ({rec.sleep_date})
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ★ {rec.quality_rating}/5 • {rec.morning_feeling}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Recovery Assessment</h3>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-xs text-zinc-400 font-medium">Readiness Score</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {sleepInsight.score} / 100
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {sleepInsight.message}
              </p>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Circadian Optimization Tips
                </span>
                {sleepInsight.tips.map((tip, idx) => (
                  <div key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowInsightsModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
