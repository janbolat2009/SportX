import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  NutritionIntelligence,
  EstimatedMealComponent,
  calculateNutrition
} from '../../services/nutritionIntelligence';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Apple, Plus, Check, Trash2, Loader2,
  Utensils, Scale, AlertCircle, ChevronRight, X
} from 'lucide-react';

interface MealLogEntry {
  id?: string;
  user_id?: string;
  meal_type: string;
  food_name?: string;
  description: string;
  amount_grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  estimated: boolean;
  model_version?: string;
  created_at?: string;
}

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export const NutritionView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useTranslation();

  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [components, setComponents] = useState<EstimatedMealComponent[]>([]);
  const [logs, setLogs] = useState<MealLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Targets
  const targetCalories = 2400;
  const targetProtein = 140;

  // Fetch past meal logs from Supabase
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
          const normalized = data.map((d: any) => ({
            ...d,
            carbs: d.carbs ?? d.carbohydrates ?? 0,
          }));
          setLogs(normalized);
        }
      } catch (err) {
        console.warn('Notice loading meals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, [user]);

  // Real-time asynchronous ML estimation with debouncing
  useEffect(() => {
    if (mealText.trim().length < 2) {
      setComponents([]);
      setValidationError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEstimating(true);
      try {
        const res = await NutritionIntelligence.estimateMealAsync(mealText, language);
        setComponents(res.components);
        setValidationError(null);
      } catch {
        const localRes = NutritionIntelligence.estimateMealLocal(mealText);
        setComponents(localRes.components);
        setValidationError(null);
      } finally {
        setEstimating(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [mealText, language]);

  // Handle portion change in grams
  const handleUpdatePortion = (index: number, grams: number) => {
    if (isNaN(grams) || grams < 0) {
      setValidationError(
        language === 'ru'
          ? 'Введите положительное число для порции.'
          : language === 'kk'
          ? 'Порция үшін оң санды енгізіңіз.'
          : 'Please enter a valid positive number.'
      );
      return;
    }

    if (grams > 5000) {
      setValidationError(
        language === 'ru'
          ? 'Порция не может превышать 5000г.'
          : language === 'kk'
          ? 'Порция 5000г-нан аспауы керек.'
          : 'Portion cannot exceed 5000g.'
      );
      return;
    }

    setValidationError(null);

    setComponents((prev) => {
      const updated = [...prev];
      const comp = updated[index];
      if (!comp) return prev;

      const safeGrams = Math.max(1, Math.round(grams));
      const scaled = calculateNutrition(comp.foodItem, safeGrams);

      updated[index] = {
        ...comp,
        quantity: safeGrams,
        unit: 'g',
        gramsEstimated: safeGrams,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        fiber: scaled.fiber,
        isEstimated: false,
      };
      return updated;
    });
  };

  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Totals Calculation
  const totalCalories = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.calories, 0)),
    [components]
  );
  const totalProtein = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.protein, 0) * 10) / 10,
    [components]
  );
  const totalCarbs = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.carbs, 0) * 10) / 10,
    [components]
  );
  const totalFat = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.fat, 0) * 10) / 10,
    [components]
  );
  const totalGrams = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.gramsEstimated, 0)),
    [components]
  );

  // Daily Totals
  const todayCalories = Math.round(logs.reduce((sum, l) => sum + (l.calories || 0), 0));
  const todayProtein = Math.round(logs.reduce((sum, l) => sum + (l.protein || 0), 0));
  const todayCarbs = Math.round(logs.reduce((sum, l) => sum + (l.carbs || 0), 0));
  const todayFat = Math.round(logs.reduce((sum, l) => sum + (l.fat || 0), 0));

  const handleSaveMeal = async () => {
    if (components.length === 0 || !user?.id) return;
    if (totalGrams <= 0) {
      setValidationError(
        language === 'ru'
          ? 'Вес порции должен быть больше нуля.'
          : language === 'kk'
          ? 'Порция салмағы нөлден үлкен болуы керек.'
          : 'Portion weight must be greater than zero.'
      );
      return;
    }

    setSaving(true);
    setValidationError(null);

    const primaryFoodName = components.map((c) => c.foodItem.nameEn).join(' + ');

    const newLog: MealLogEntry = {
      user_id: String(user.id),
      meal_type: mealType,
      food_name: primaryFoodName.slice(0, 100),
      description: mealText.trim() || primaryFoodName,
      amount_grams: totalGrams,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      estimated: components.some((c) => c.isEstimated),
      model_version: 'sportx-nutrition-v2.0',
      created_at: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('meal_logs')
          .insert({
            user_id: String(user.id),
            meal_type: mealType,
            food_name: primaryFoodName.slice(0, 100),
            description: mealText.trim() || primaryFoodName,
            amount_grams: totalGrams,
            calories: totalCalories,
            protein: totalProtein,
            carbohydrates: totalCarbs,
            fat: totalFat,
            estimated: components.some((c) => c.isEstimated),
            model_version: 'sportx-nutrition-v2.0',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          setLogs((prev) => [
            {
              ...data,
              carbs: data.carbohydrates ?? data.carbs ?? totalCarbs,
            } as any,
            ...prev,
          ]);
        } else {
          setLogs((prev) => [{ ...newLog, id: String(Date.now()) }, ...prev]);
        }
      } else {
        setLogs((prev) => [{ ...newLog, id: String(Date.now()) }, ...prev]);
      }

      setMealText('');
      setComponents([]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Minimalist Daily Overview Bar */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              {t('nutrition.title', 'Today\'s Nutrition')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {todayCalories.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">
                / {targetCalories.toLocaleString()} kcal
              </span>
            </div>
          </div>

          {/* Quick Macro Badges */}
          <div className="flex items-center gap-2 sm:gap-3 text-right">
            <div className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-400 block font-medium">Protein</span>
              <span className="text-xs font-semibold text-sky-400">{todayProtein}g</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-400 block font-medium">Carbs</span>
              <span className="text-xs font-semibold text-amber-400">{todayCarbs}g</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/40">
              <span className="text-[10px] text-zinc-400 block font-medium">Fat</span>
              <span className="text-xs font-semibold text-rose-400">{todayFat}g</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Clean Meal Logger Box */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 sm:p-5 border border-zinc-800/80 shadow-sm space-y-4">
        
        {/* Header & Meal Type Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>{t('nutrition.logMeal', 'Log Food')}</span>
          </h2>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  mealType === type
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t(`nutrition.${type.toLowerCase()}`, type)}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Text Input */}
        <div className="relative">
          <input
            type="text"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            placeholder={t('nutrition.placeholder', 'e.g. 200g chicken breast with rice + 2 eggs')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
          {estimating && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {components.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              '200g Chicken breast & rice',
              '2 eggs + toast',
              '150g Salmon with veggies',
              'Овсянка с бананом',
              'Борщ с говядиной',
              'Бесбармақ',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMealText(chip)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800/60 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Dynamic Portion & Component Editor */}
        {components.length > 0 && (
          <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-2">
              {components.map((comp, idx) => {
                const name =
                  language === 'ru'
                    ? comp.foodItem.nameRu
                    : language === 'kk'
                    ? comp.foodItem.nameKk
                    : comp.foodItem.nameEn;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white truncate block">
                          {name}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {comp.calories} kcal • P: {comp.protein}g • C: {comp.carbs}g • F: {comp.fat}g
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Portion Amount Stepper & Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-400 font-medium">
                          {t('nutrition.amount', 'Amount')}:
                        </span>
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2 py-0.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="5"
                            max="5000"
                            step="5"
                            value={comp.gramsEstimated || ''}
                            onChange={(e) => handleUpdatePortion(idx, parseFloat(e.target.value) || 0)}
                            className="w-14 bg-transparent text-xs font-bold text-white text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-400">g</span>
                        </div>
                      </div>

                      {/* Quick Gram Preset Chips */}
                      <div className="flex items-center gap-1">
                        {[100, 150, 200, 300, 500].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleUpdatePortion(idx, g)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                              comp.gramsEstimated === g
                                ? 'bg-emerald-500 text-black font-semibold'
                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                            }`}
                          >
                            {g}g
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Row & Log Action */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div className="text-xs text-zinc-400">
                <span className="font-semibold text-white text-sm mr-1.5">{totalCalories} kcal</span>
                <span>({totalGrams}g total)</span>
              </div>

              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={saving || totalGrams <= 0}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-all duration-150 shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('nutrition.saveMeal', 'Save Meal')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 shrink-0" />
            <span>{t('nutrition.savedSuccess', 'Meal logged successfully!')}</span>
          </div>
        )}
      </div>

      {/* 3. Today's Meal Timeline / History */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          {t('nutrition.todayHistory', 'Logged Today')} ({logs.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-center text-xs text-zinc-500">
            {t('nutrition.noMealsYet', 'No meals logged yet today.')}
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
                      {log.meal_type}
                    </span>
                    <span className="text-xs font-medium text-white truncate">
                      {log.description}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                    <span className="text-white font-medium">{log.calories} kcal</span>
                    <span>P: {log.protein}g</span>
                    <span>C: {log.carbs}g</span>
                    <span>F: {log.fat}g</span>
                    {log.amount_grams && <span className="text-zinc-500">({log.amount_grams}g)</span>}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
