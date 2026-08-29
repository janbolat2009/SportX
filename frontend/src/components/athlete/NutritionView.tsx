import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  NutritionIntelligence,
  MealEstimationResult,
  EstimatedMealComponent,
  calculateNutrition,
  STRUCTURED_FOOD_DATABASE,
  FoodItem
} from '../../services/nutritionIntelligence';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Apple, Plus, Sparkles, Flame, CheckCircle2,
  Trash2, Loader2, Info, Utensils, Scale, AlertCircle, Edit3
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

type PortionUnit = 'g' | 'kg' | 'ml' | 'pieces' | 'servings';

export const NutritionView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useTranslation();
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [components, setComponents] = useState<EstimatedMealComponent[]>([]);
  const [logs, setLogs] = useState<MealLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
          .limit(30);

        if (!error && data) {
          // Normalize carbohydrates column if DB used carbohydrates instead of carbs
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
    }, 200);

    return () => clearTimeout(timer);
  }, [mealText, language]);

  // Handle manual portion change in grams or units
  const handleUpdatePortion = (index: number, newAmount: number, unit: PortionUnit = 'g') => {
    if (isNaN(newAmount) || newAmount < 0) {
      setValidationError(
        language === 'ru'
          ? 'Пожалуйста, введите положительное число для порции.'
          : language === 'kk'
          ? 'Порция үшін оң санды енгізіңіз.'
          : 'Please enter a valid positive number for portion size.'
      );
      return;
    }

    if (newAmount > 5000) {
      setValidationError(
        language === 'ru'
          ? 'Порция не может превышать 5000г.'
          : language === 'kk'
          ? 'Порция 5000г-нан аспауы керек.'
          : 'Portion size cannot exceed 5000g.'
      );
      return;
    }

    setValidationError(null);

    setComponents((prev) => {
      const updated = [...prev];
      const comp = updated[index];
      if (!comp) return prev;

      let calculatedGrams = newAmount;
      if (unit === 'kg') calculatedGrams = newAmount * 1000;
      else if (unit === 'pieces') calculatedGrams = newAmount * (comp.foodItem.defaultPortionGrams || 100);
      else if (unit === 'servings') calculatedGrams = newAmount * (comp.foodItem.defaultPortionGrams || 150);

      calculatedGrams = Math.round(calculatedGrams);
      const scaled = calculateNutrition(comp.foodItem, calculatedGrams);

      updated[index] = {
        ...comp,
        quantity: newAmount,
        unit: unit,
        gramsEstimated: calculatedGrams,
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

  // Remove a component
  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Totals Calculation
  const totalCalories = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.calories, 0) * 10) / 10,
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
  const totalFiber = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + (c.fiber || 0), 0) * 10) / 10,
    [components]
  );
  const totalGrams = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.gramsEstimated, 0)),
    [components]
  );

  const handleSaveMeal = async () => {
    if (components.length === 0 || !user?.id) return;
    if (totalGrams <= 0) {
      setValidationError(
        language === 'ru'
          ? 'Общий вес порции должен быть больше нуля.'
          : language === 'kk'
          ? 'Порция салмағы нөлден үлкен болуы керек.'
          : 'Total portion weight must be greater than zero.'
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
      fiber: totalFiber,
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
            fiber: totalFiber,
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
  const todayCalories = Math.round(logs.reduce((sum, l) => sum + (l.calories || 0), 0));
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

      {/* Daily Progress Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">{t('nutrition.calories', 'Calories')}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{todayCalories}</span>
            <span className="text-[11px] text-zinc-500 font-mono">/ {targetCalories}</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">{t('nutrition.protein', 'Protein')}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">{todayProtein}g</span>
            <span className="text-[11px] text-zinc-500 font-mono">/ {targetProtein}g</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (todayProtein / targetProtein) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">{t('nutrition.carbs', 'Carbs')}</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">{todayCarbs}g</span>
          <span className="text-[10px] text-zinc-500">{t('nutrition.energy', 'Energy & Glycogen')}</span>
        </div>

        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">{t('nutrition.fats', 'Fats')}</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono block">{todayFat}g</span>
          <span className="text-[10px] text-zinc-500">{t('nutrition.hormones', 'Hormonal Balance')}</span>
        </div>
      </div>

      {/* Meal Logger Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{t('nutrition.logMeal', 'Log Meal')}</span>
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
                {t(`nutrition.${type.toLowerCase()}`, type)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder={t('nutrition.placeholder', 'e.g. Chicken breast with rice + 2 eggs')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {estimating && (
              <div className="absolute right-3.5 top-3.5">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              </div>
            )}
          </div>

          {/* Quick Example Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'Chicken breast with rice',
              '2 eggs and toast',
              '200g salmon and broccoli',
              'Овсянка с бананом',
              'Борщ с говядиной',
              'Бесбармақ',
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

        {/* Validation Alert */}
        {validationError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Dynamic Portion Editor & Review Card */}
        {components.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-4 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>{t('nutrition.detectedFoods', 'Detected Foods & Portions')}</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {totalGrams}g Total
              </span>
            </div>

            {/* Editable Portion Items List */}
            <div className="space-y-3">
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
                    className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          100g = {comp.foodItem.caloriesPer100g} kcal | P: {comp.foodItem.proteinPer100g}g | C: {comp.foodItem.carbsPer100g}g | F: {comp.foodItem.fatPer100g}g
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove food"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Portion Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-850">
                      
                      {/* Manual Portion Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {t('nutrition.amount', 'Amount')}:
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="5"
                            max="5000"
                            step="5"
                            value={comp.gramsEstimated || ''}
                            onChange={(e) => handleUpdatePortion(idx, parseFloat(e.target.value) || 0, 'g')}
                            className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500 text-center"
                          />
                          <span className="text-xs font-mono text-zinc-400 font-bold">grams</span>
                        </div>
                      </div>

                      {/* Quick Adjustment Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                        {[50, 100, 150, 200, 250, 350, 500].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleUpdatePortion(idx, g, 'g')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                              comp.gramsEstimated === g
                                ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {g}g
                          </button>
                        ))}
                      </div>

                    </div>

                    {/* Calculated Macro Summary for this portion */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono pt-1">
                      <span className="text-white font-bold">{comp.calories} kcal</span>
                      <span className="text-sky-400">P: {comp.protein}g</span>
                      <span className="text-amber-400">C: {comp.carbs}g</span>
                      <span className="text-rose-400">F: {comp.fat}g</span>
                      {comp.fiber !== undefined && comp.fiber > 0 && (
                        <span className="text-emerald-400">Fib: {comp.fiber}g</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Row & Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('nutrition.calories', 'Calories')}</span>
                  <span className="text-lg font-black text-white">{totalCalories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('nutrition.protein', 'Protein')}</span>
                  <span className="text-sm font-bold text-sky-400">{totalProtein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('nutrition.carbs', 'Carbs')}</span>
                  <span className="text-sm font-bold text-amber-400">{totalCarbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">{t('nutrition.fats', 'Fats')}</span>
                  <span className="text-sm font-bold text-rose-400">{totalFat}g</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={saving || totalGrams <= 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{t('nutrition.saveMeal', 'Log This Meal')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('nutrition.savedSuccess', 'Meal logged successfully to your daily nutrition log.')}</span>
          </div>
        )}
      </div>

      {/* Meal History List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-zinc-400" />
          <span>{t('nutrition.todayHistory', "Today's Meal Log")} ({logs.length})</span>
        </h2>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <p>{t('nutrition.loadingHistory', 'Loading meal history...')}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-400">{t('nutrition.noMealsYet', 'No meals logged yet today.')}</p>
            <p className="text-[11px] text-zinc-500">
              {t('nutrition.noMealsDesc', 'Type your breakfast, lunch, dinner or snack above to keep track of your daily calories & macros.')}
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
                    {log.amount_grams ? (
                      <span className="text-[10px] font-mono text-zinc-500">
                        ({log.amount_grams}g)
                      </span>
                    ) : null}
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
