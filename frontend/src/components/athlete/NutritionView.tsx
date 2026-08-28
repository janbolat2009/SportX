import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { NutritionIntelligence, MealEstimationResult } from '../../services/nutritionIntelligence';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Apple, Plus, Sparkles, Flame, CheckCircle2,
  Trash2, Loader2, Info, ArrowRight, Utensils
} from 'lucide-react';

interface MealLogEntry {
  id?: string;
  user_id?: string;
  meal_type: string;
  description: string;
  serving_size?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  estimated: boolean;
  created_at?: string;
}

export const NutritionView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [estimation, setEstimation] = useState<MealEstimationResult | null>(null);
  const [logs, setLogs] = useState<MealLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load past meals from Supabase
  useEffect(() => {
    async function fetchMeals() {
      if (!isSupabaseConfigured() || !user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', String(user.id))
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setLogs(data as any);
        }
      } catch (err) {
        console.warn('Notice loading meals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, [user]);

  // Real-time estimation as user types
  useEffect(() => {
    if (mealText.trim().length >= 2) {
      const res = NutritionIntelligence.estimateMeal(mealText);
      setEstimation(res);
    } else {
      setEstimation(null);
    }
  }, [mealText]);

  const handleSaveMeal = async () => {
    if (!estimation || estimation.components.length === 0 || !user?.id) return;

    setSaving(true);
    const newLog: MealLogEntry = {
      user_id: String(user.id),
      meal_type: mealType,
      description: mealText.trim(),
      serving_size: `${estimation.totalGrams}g estimated`,
      calories: estimation.totalCalories,
      protein: estimation.totalProtein,
      carbs: estimation.totalCarbs,
      fat: estimation.totalFat,
      fiber: estimation.totalFiber,
      estimated: true,
      created_at: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('meal_logs')
          .insert(newLog)
          .select()
          .single();

        if (!error && data) {
          setLogs((prev) => [data as any, ...prev]);
        } else {
          setLogs((prev) => [{ ...newLog, id: String(Date.now()) }, ...prev]);
        }
      } else {
        setLogs((prev) => [{ ...newLog, id: String(Date.now()) }, ...prev]);
      }

      setMealText('');
      setEstimation(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id?: string) => {
    if (!id) return;
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('meal_logs').delete().eq('id', id);
      }
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Delete meal error:', err);
    }
  };

  // Daily Totals
  const todayCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const todayProtein = Math.round(logs.reduce((sum, l) => sum + (l.protein || 0), 0));
  const todayCarbs = Math.round(logs.reduce((sum, l) => sum + (l.carbs || 0), 0));
  const todayFat = Math.round(logs.reduce((sum, l) => sum + (l.fat || 0), 0));

  const targetCalories = 2400;
  const targetProtein = 140;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-6 animate-in fade-in">
      
      {/* Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Apple className="w-6 h-6 text-emerald-400" />
          <span>{t('nutrition.title', 'Nutrition Intelligence')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {t('nutrition.subtitle', 'Type your meal in English, Russian or Kazakh to estimate calories and macronutrients.')}
        </p>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Calories</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{todayCalories}</span>
            <span className="text-[11px] text-zinc-500 font-mono">/ {targetCalories}</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Protein</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">{todayProtein}g</span>
            <span className="text-[11px] text-zinc-500 font-mono">/ {targetProtein}g</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-sky-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (todayProtein / targetProtein) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Carbohydrates</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">{todayCarbs}g</span>
          <span className="text-[10px] text-zinc-500">Energy & Recovery</span>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Fats</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono block">{todayFat}g</span>
          <span className="text-[10px] text-zinc-500">Hormonal Balance</span>
        </div>
      </div>

      {/* Meal Logger Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{t('nutrition.logMeal', 'Log Meal with Natural Language')}</span>
          </h2>

          {/* Meal Type Selector */}
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  mealType === type
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder="e.g. Chicken breast with rice + 2 eggs (or Борщ с хлебом / Кеспе)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Suggestions quick chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'Chicken breast with rice',
              '2 eggs and toast',
              'Овсянка с бананом',
              'Борщ с говядиной',
              'Бешбармак',
              'Творог 5%'
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMealText(chip)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Parsed Estimation Preview */}
        {estimation && estimation.components.length > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Estimated Nutrition (FDC / OpenFood Database)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {estimation.totalGrams}g Total
              </span>
            </div>

            {/* Components breakdown */}
            <div className="space-y-1.5">
              {estimation.components.map((comp, idx) => {
                const name =
                  language === 'ru'
                    ? comp.foodItem.nameRu
                    : language === 'kk'
                    ? comp.foodItem.nameKk
                    : comp.foodItem.nameEn;

                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-zinc-850">
                    <span className="text-zinc-200 truncate pr-2">{name} ({comp.gramsEstimated}g)</span>
                    <div className="flex items-center gap-2.5 text-zinc-400 font-mono text-[11px] shrink-0">
                      <span className="text-white font-bold">{comp.calories} kcal</span>
                      <span>P: {comp.protein}g</span>
                      <span>C: {comp.carbs}g</span>
                      <span>F: {comp.fat}g</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Row & Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">TOTAL CALORIES</span>
                  <span className="text-base font-black text-white">{estimation.totalCalories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">PROTEIN</span>
                  <span className="text-sm font-bold text-sky-400">{estimation.totalProtein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">CARBS</span>
                  <span className="text-sm font-bold text-amber-400">{estimation.totalCarbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">FATS</span>
                  <span className="text-sm font-bold text-rose-400">{estimation.totalFat}g</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Log This Meal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Meal logged successfully to your daily nutrition log.</span>
          </div>
        )}
      </div>

      {/* Meal History Table / Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-zinc-400" />
          <span>Today's Meal Log ({logs.length})</span>
        </h2>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <p>Loading meal history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-400">No meals logged yet today.</p>
            <p className="text-[11px] text-zinc-500">
              Type your breakfast, lunch, dinner or snack above to keep track of your daily calories & macros.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                      {log.meal_type}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {log.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span className="text-white font-bold">{log.calories} kcal</span>
                    <span>P: {log.protein}g</span>
                    <span>C: {log.carbs}g</span>
                    <span>F: {log.fat}g</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
