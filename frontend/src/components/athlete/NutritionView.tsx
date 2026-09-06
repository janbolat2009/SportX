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
  Utensils, Sparkles, Droplets, ChevronRight, X,
  Search, Flame, Clock, Calendar
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

interface QuickPreset {
  id: string;
  name: { en: string; ru: string; kk: string };
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  grams: number;
  mealType: MealType;
}

const QUICK_PRESETS: QuickPreset[] = [
  // Breakfast
  {
    id: 'oatmeal_banana',
    emoji: '🥣',
    name: { en: 'Oatmeal & Banana', ru: 'Овсяная каша с бананом', kk: 'Банан қосылған сұлы ботқасы' },
    calories: 320,
    protein: 10,
    carbs: 58,
    fat: 5,
    grams: 250,
    mealType: 'Breakfast'
  },
  {
    id: 'eggs_toast',
    emoji: '🍳',
    name: { en: 'Scrambled Eggs & Toast', ru: 'Яичница из 2 яиц с тостом', kk: 'Тост қосылған 2 жұмыртқа' },
    calories: 330,
    protein: 20,
    carbs: 22,
    fat: 17,
    grams: 180,
    mealType: 'Breakfast'
  },
  {
    id: 'cottage_honey',
    emoji: '🫐',
    name: { en: 'Cottage Cheese 5% & Berries', ru: 'Творог 5% с ягодами', kk: 'Жидек қосылған 5% сүзбе' },
    calories: 250,
    protein: 28,
    carbs: 16,
    fat: 6,
    grams: 200,
    mealType: 'Breakfast'
  },
  // Lunch
  {
    id: 'chicken_rice',
    emoji: '🍗',
    name: { en: 'Chicken Breast & Rice', ru: 'Куриное филе с рисом', kk: 'Күріш қосылған тауық еті' },
    calories: 460,
    protein: 44,
    carbs: 50,
    fat: 6,
    grams: 350,
    mealType: 'Lunch'
  },
  {
    id: 'salmon_veggies',
    emoji: '🐟',
    name: { en: 'Grilled Salmon & Veggies', ru: 'Лосось на пару с брокколи', kk: 'Брокколи қосылған қызыл балық' },
    calories: 410,
    protein: 36,
    carbs: 14,
    fat: 22,
    grams: 300,
    mealType: 'Lunch'
  },
  {
    id: 'beef_buckwheat',
    emoji: '🥩',
    name: { en: 'Lean Beef & Buckwheat', ru: 'Говядина с гречкой', kk: 'Қарақұмық қосылған сиыр еті' },
    calories: 490,
    protein: 41,
    carbs: 49,
    fat: 11,
    grams: 350,
    mealType: 'Lunch'
  },
  // Dinner
  {
    id: 'turkey_salad',
    emoji: '🥗',
    name: { en: 'Turkey & Greek Salad', ru: 'Индейка с греческим салатом', kk: 'Грек салаты қосылған күркетауық' },
    calories: 360,
    protein: 38,
    carbs: 11,
    fat: 17,
    grams: 320,
    mealType: 'Dinner'
  },
  {
    id: 'pasta_beef',
    emoji: '🍝',
    name: { en: 'Durum Pasta with Meat', ru: 'Паста с нежирным фаршем', kk: 'Ет қосылған макарон' },
    calories: 510,
    protein: 35,
    carbs: 64,
    fat: 12,
    grams: 350,
    mealType: 'Dinner'
  },
  // Snacks
  {
    id: 'protein_shake',
    emoji: '🥤',
    name: { en: 'Whey Protein Shake', ru: 'Протеиновый коктейль', kk: 'Протеин шейк' },
    calories: 150,
    protein: 27,
    carbs: 4,
    fat: 2,
    grams: 300,
    mealType: 'Snack'
  },
  {
    id: 'apple_almonds',
    emoji: '🍏',
    name: { en: 'Crisp Apple & Almonds', ru: 'Зеленое яблоко и миндаль', kk: 'Жасыл алма мен бадам' },
    calories: 180,
    protein: 4,
    carbs: 24,
    fat: 9,
    grams: 190,
    mealType: 'Snack'
  }
];

export const NutritionView: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useTranslation();

  const [mealText, setMealText] = useState('');
  const [activeMealCategory, setActiveMealCategory] = useState<MealType>('Lunch');
  const [components, setComponents] = useState<EstimatedMealComponent[]>([]);
  const [logs, setLogs] = useState<MealLogEntry[]>([]);
  const [waterMl, setWaterMl] = useState<number>(1250);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Targets (Apple Health baseline)
  const targetCalories = 2400;
  const targetProtein = 140;
  const targetCarbs = 240;
  const targetFat = 65;
  const targetWater = 2500;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Fetch past meal logs
  useEffect(() => {
    async function fetchMeals() {
      if (!user?.id) return;
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from('meal_logs')
            .select('*')
            .eq('user_id', String(user.id))
            .order('created_at', { ascending: false })
            .limit(30);

          if (!error && data && data.length > 0) {
            const normalized = data.map((d: any) => ({
              ...d,
              carbs: d.carbs ?? d.carbohydrates ?? 0,
            }));
            setLogs(normalized);
            return;
          }
        }
      } catch (err) {
        console.warn('Notice loading meals:', err);
      } finally {
        setLoading(false);
      }

      // Local storage fallback for instant responsiveness
      try {
        const cached = localStorage.getItem(`sportx_meals_${user.id}`);
        if (cached) {
          setLogs(JSON.parse(cached));
        }
      } catch {}
    }
    fetchMeals();
  }, [user]);

  // Real-time estimation for custom search input
  useEffect(() => {
    if (mealText.trim().length < 2) {
      setComponents([]);
      return;
    }

    const timer = setTimeout(async () => {
      setEstimating(true);
      try {
        const res = await NutritionIntelligence.estimateMealAsync(mealText, language);
        setComponents(res.components);
      } catch {
        const localRes = NutritionIntelligence.estimateMealLocal(mealText);
        setComponents(localRes.components);
      } finally {
        setEstimating(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mealText, language]);

  // Adjust portion for custom food components
  const handleUpdatePortion = (index: number, delta: number) => {
    setComponents((prev) => {
      const updated = [...prev];
      const comp = updated[index];
      if (!comp) return prev;

      const currentGrams = comp.gramsEstimated || 100;
      const nextGrams = Math.max(25, Math.min(2000, currentGrams + delta));
      const scaled = calculateNutrition(comp.foodItem, nextGrams);

      updated[index] = {
        ...comp,
        quantity: nextGrams,
        unit: 'g',
        gramsEstimated: nextGrams,
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

  // Dynamic Totals Calculation for custom meal
  const customCalories = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.calories, 0)),
    [components]
  );
  const customProtein = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.protein, 0) * 10) / 10,
    [components]
  );
  const customCarbs = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.carbs, 0) * 10) / 10,
    [components]
  );
  const customFat = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.fat, 0) * 10) / 10,
    [components]
  );
  const customGrams = useMemo(
    () => Math.round(components.reduce((sum, c) => sum + c.gramsEstimated, 0)),
    [components]
  );

  // Daily Aggregations
  const todayCalories = Math.round(logs.reduce((sum, l) => sum + (l.calories || 0), 0));
  const todayProtein = Math.round(logs.reduce((sum, l) => sum + (l.protein || 0), 0));
  const todayCarbs = Math.round(logs.reduce((sum, l) => sum + (l.carbs || 0), 0));
  const todayFat = Math.round(logs.reduce((sum, l) => sum + (l.fat || 0), 0));

  const remainingCalories = Math.max(0, targetCalories - todayCalories);
  const calPercent = Math.min(100, Math.round((todayCalories / targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((todayProtein / targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((todayCarbs / targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((todayFat / targetFat) * 100));

  // 1-CLICK INSTANT QUICK PRESET LOGGING
  const handleQuickLog = async (preset: QuickPreset) => {
    if (!user?.id) return;
    const name = preset.name[language as keyof typeof preset.name] || preset.name.en;

    const newEntry: MealLogEntry = {
      id: 'meal_' + Date.now(),
      user_id: String(user.id),
      meal_type: preset.mealType,
      food_name: name,
      description: `${name} (${preset.grams}g)`,
      amount_grams: preset.grams,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      estimated: false,
      model_version: 'apple-oneclick-preset',
      created_at: new Date().toISOString(),
    };

    // Update state immediately for instant Apple responsiveness
    const nextLogs = [newEntry, ...logs];
    setLogs(nextLogs);
    try {
      localStorage.setItem(`sportx_meals_${user.id}`, JSON.stringify(nextLogs));
    } catch {}

    const mealLabel =
      preset.mealType === 'Breakfast'
        ? language === 'ru' ? 'Завтрак' : language === 'kk' ? 'Таңғы ас' : 'Breakfast'
        : preset.mealType === 'Lunch'
        ? language === 'ru' ? 'Обед' : language === 'kk' ? 'Түскі ас' : 'Lunch'
        : preset.mealType === 'Dinner'
        ? language === 'ru' ? 'Ужин' : language === 'kk' ? 'Кешкі ас' : 'Dinner'
        : language === 'ru' ? 'Перекус' : language === 'kk' ? 'Жеңіл ас' : 'Snack';

    showToast(`✓ ${preset.emoji} ${name} (+${preset.calories} ккал) • ${mealLabel}`);

    // Persist to Supabase in background
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('meal_logs').insert({
          user_id: String(user.id),
          meal_type: preset.mealType,
          food_name: name,
          description: `${name} (${preset.grams}g)`,
          amount_grams: preset.grams,
          calories: preset.calories,
          protein: preset.protein,
          carbohydrates: preset.carbs,
          fat: preset.fat,
          estimated: false,
          model_version: 'apple-oneclick-preset',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Notice saving meal log:', err);
      }
    }
  };

  // Save custom meal
  const handleSaveCustomMeal = async () => {
    if (components.length === 0 || !user?.id) return;
    setSaving(true);

    const primaryName = components
      .map((c) =>
        language === 'ru'
          ? c.foodItem.nameRu
          : language === 'kk'
          ? c.foodItem.nameKk
          : c.foodItem.nameEn
      )
      .join(' + ');

    const newLog: MealLogEntry = {
      id: 'meal_' + Date.now(),
      user_id: String(user.id),
      meal_type: activeMealCategory,
      food_name: primaryName.slice(0, 100),
      description: mealText.trim() || primaryName,
      amount_grams: customGrams,
      calories: customCalories,
      protein: customProtein,
      carbs: customCarbs,
      fat: customFat,
      estimated: true,
      model_version: 'sportx-nutrition-v2.0',
      created_at: new Date().toISOString(),
    };

    const nextLogs = [newLog, ...logs];
    setLogs(nextLogs);
    try {
      localStorage.setItem(`sportx_meals_${user.id}`, JSON.stringify(nextLogs));
    } catch {}

    setMealText('');
    setComponents([]);
    showToast(`✓ ${primaryName} (+${customCalories} ккал)`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('meal_logs').insert({
          user_id: String(user.id),
          meal_type: activeMealCategory,
          food_name: primaryName.slice(0, 100),
          description: mealText.trim() || primaryName,
          amount_grams: customGrams,
          calories: customCalories,
          protein: customProtein,
          carbohydrates: customCarbs,
          fat: customFat,
          estimated: true,
          model_version: 'sportx-nutrition-v2.0',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Notice saving custom meal:', err);
      }
    }

    setSaving(false);
  };

  // Delete meal
  const handleDeleteMeal = async (id?: string) => {
    if (!id) return;
    const nextLogs = logs.filter((l) => l.id !== id);
    setLogs(nextLogs);
    if (user?.id) {
      try {
        localStorage.setItem(`sportx_meals_${user.id}`, JSON.stringify(nextLogs));
      } catch {}
    }

    if (isSupabaseConfigured() && !id.startsWith('meal_')) {
      try {
        await supabase.from('meal_logs').delete().eq('id', id);
      } catch (err) {
        console.warn('Notice deleting meal:', err);
      }
    }
  };

  // Add water in 1 click
  const handleAddWater = (ml: number) => {
    setWaterMl((prev) => prev + ml);
    showToast(`💧 +${ml} ${language === 'ru' ? 'мл воды' : language === 'kk' ? 'мл су' : 'ml water'}`);
  };

  const activePresets = QUICK_PRESETS.filter((p) => p.mealType === activeMealCategory);

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-28 space-y-5 animate-in fade-in duration-300">
      
      {/* Apple Floating Toast Confirmation */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-stone-900/90 dark:bg-white/95 text-white dark:text-stone-900 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header: Date & Title (Apple Health Cupertino Header) */}
      <div className="flex items-end justify-between px-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
            {new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            {language === 'ru' ? 'Питание' : language === 'kk' ? 'Тамақтану' : 'Nutrition'}
          </h1>
        </div>

        {/* 1-Click Water Quick Log */}
        <button
          type="button"
          onClick={() => handleAddWater(250)}
          className="group px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200/60 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
          title="Добавить стакан воды 250мл"
        >
          <Droplets className="w-3.5 h-3.5 fill-current text-sky-500" />
          <span>{waterMl} / {targetWater} мл</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-sky-600 text-white rounded-full px-1">
            +
          </span>
        </button>
      </div>

      {/* 2. Apple Activity Visual Card (Calories & 3 Macro Pills) */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        
        {/* Calories Ring / Main Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-400 uppercase tracking-wider">
              {language === 'ru' ? 'Калории за день' : language === 'kk' ? 'Күндік калория' : 'Calories Today'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
                {todayCalories.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-stone-400 dark:text-zinc-500">
                / {targetCalories.toLocaleString()} kcal
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-medium text-stone-400 dark:text-zinc-400 uppercase tracking-wider block">
              {language === 'ru' ? 'Осталось' : language === 'kk' ? 'Қалды' : 'Remaining'}
            </span>
            <span className="text-lg font-bold text-rose-500 dark:text-rose-400">
              {remainingCalories.toLocaleString()} <span className="text-xs font-normal">kcal</span>
            </span>
          </div>
        </div>

        {/* Soft Apple Flame Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* 3 Clean Apple Macro Capsule Meters */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {/* Protein (Apple Blue) */}
          <div className="p-3 rounded-2xl bg-blue-500/[0.06] dark:bg-blue-500/[0.12] border border-blue-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {language === 'ru' ? 'Белки' : language === 'kk' ? 'Ақуыз' : 'Protein'}
              </span>
              <span className="text-[10px] font-mono text-blue-500/80">
                {proteinPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {todayProtein}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / {targetProtein}g
              </span>
            </div>
            <div className="w-full bg-blue-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* Carbs (Apple Tangerine) */}
          <div className="p-3 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.12] border border-amber-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {language === 'ru' ? 'Углеводы' : language === 'kk' ? 'Көмірсу' : 'Carbs'}
              </span>
              <span className="text-[10px] font-mono text-amber-500/80">
                {carbsPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {todayCarbs}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / {targetCarbs}g
              </span>
            </div>
            <div className="w-full bg-amber-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>

          {/* Fat (Apple Orchid/Pink) */}
          <div className="p-3 rounded-2xl bg-pink-500/[0.06] dark:bg-pink-500/[0.12] border border-pink-500/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                {language === 'ru' ? 'Жиры' : language === 'kk' ? 'Майлар' : 'Fats'}
              </span>
              <span className="text-[10px] font-mono text-pink-500/80">
                {fatPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                {todayFat}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                / {targetFat}g
              </span>
            </div>
            <div className="w-full bg-pink-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-500"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 1-Click Fast Logging Section ("Одним кликом всё понятно") */}
      <div className="p-5 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3.5">
        
        {/* Meal Time Tabs (Apple Segmented Picker) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
              {language === 'ru' ? 'Быстрое добавление в 1 клик' : language === 'kk' ? '1 кликпен жылдам қосу' : '1-Click Fast Add'}
            </h2>
          </div>

          <div className="flex p-0.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-[11px] font-medium">
            {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((m) => {
              const label =
                m === 'Breakfast'
                  ? language === 'ru' ? 'Завтрак' : language === 'kk' ? 'Таңғы' : 'Breakfast'
                  : m === 'Lunch'
                  ? language === 'ru' ? 'Обед' : language === 'kk' ? 'Түскі' : 'Lunch'
                  : m === 'Dinner'
                  ? language === 'ru' ? 'Ужин' : language === 'kk' ? 'Кешкі' : 'Dinner'
                  : language === 'ru' ? 'Перекус' : language === 'kk' ? 'Жеңіл' : 'Snack';

              const isActive = activeMealCategory === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMealCategory(m)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-xs font-bold'
                      : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {activePresets.map((preset) => {
            const name = preset.name[language as keyof typeof preset.name] || preset.name.en;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleQuickLog(preset)}
                className="group p-3 rounded-2xl bg-stone-50 hover:bg-emerald-500/10 dark:bg-zinc-800/50 dark:hover:bg-emerald-500/10 border border-stone-200/70 hover:border-emerald-500/30 dark:border-zinc-700/50 dark:hover:border-emerald-500/30 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between shadow-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base shrink-0">{preset.emoji}</span>
                    <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      {name}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                    Б: {preset.protein}г • У: {preset.carbs}г • Ж: {preset.fat}г
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-brand-400 block font-mono">
                    +{preset.calories}
                  </span>
                  <span className="text-[9px] text-stone-400 uppercase font-mono">ккал</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clean Natural Search Input for Custom Food */}
        <div className="pt-2 border-t border-stone-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder={
                language === 'ru'
                  ? 'Или введите блюдо: например, 200г творога и банан...'
                  : language === 'kk'
                  ? 'Немесе тағамды жазыңыз: мысалы, 200г сүзбе мен банан...'
                  : 'Or type custom food: e.g. 200g Greek yogurt & banana...'
              }
              className="w-full bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 dark:focus:border-brand-500 transition-colors shadow-xs"
            />
            {estimating && (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin absolute right-3.5 top-3" />
            )}
            {mealText && !estimating && (
              <button
                type="button"
                onClick={() => {
                  setMealText('');
                  setComponents([]);
                }}
                className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Food Component Adjuster */}
        {components.length > 0 && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
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
                  className="p-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700/50 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      {name}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                      {comp.calories} kcal • Б: {comp.protein}г • У: {comp.carbs}г • Ж: {comp.fat}г
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdatePortion(idx, -50)}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-800 dark:text-white font-bold text-xs flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-stone-800 dark:text-white font-mono px-1">
                      {comp.gramsEstimated || 100}g
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdatePortion(idx, +50)}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-800 dark:text-white font-bold text-xs flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      className="w-7 h-7 rounded-xl text-stone-400 hover:text-rose-500 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleSaveCustomMeal}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    {language === 'ru'
                      ? `Записать в ${activeMealCategory} (+${customCalories} ккал)`
                      : language === 'kk'
                      ? `${activeMealCategory} сақтау (+${customCalories} ккал)`
                      : `Log to ${activeMealCategory} (+${customCalories} kcal)`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* 4. Today's Meals Timeline (Apple Health Logged Meals List) */}
      <div className="p-5 rounded-[28px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-stone-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-400 dark:text-zinc-500" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {language === 'ru' ? 'Дневник за сегодня' : language === 'kk' ? 'Бүгінгі тамақтану күнделігі' : 'Today\'s Meal Timeline'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-400 dark:text-zinc-500">
            {logs.length} {language === 'ru' ? 'записей' : language === 'kk' ? 'жазба' : 'meals'}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 mx-auto flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
              {language === 'ru' ? 'Ещё нет приемов пищи за сегодня' : language === 'kk' ? 'Бүгінге әлі тамақ қосылмады' : 'No meals logged yet today'}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500 max-w-xs mx-auto">
              {language === 'ru'
                ? 'Нажмите на любую карточку выше, чтобы добавить прием пищи в 1 клик.'
                : language === 'kk'
                ? '1 кликпен тағамды қосу үшін жоғарыдағы карточкаларды басыңыз.'
                : 'Tap any card above to log your meal in a single click.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const timeStr = log.created_at
                ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              const categoryBadge =
                log.meal_type === 'Breakfast'
                  ? '🌅 Завтрак'
                  : log.meal_type === 'Lunch'
                  ? '☀️ Обед'
                  : log.meal_type === 'Dinner'
                  ? '🌙 Ужин'
                  : '🍏 Перекус';

              return (
                <div
                  key={log.id || Math.random()}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/60 dark:border-zinc-700/40 flex items-center justify-between gap-3 shadow-xs hover:border-stone-300 dark:hover:border-zinc-600 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300">
                        {categoryBadge}
                      </span>
                      {timeStr && (
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                          {timeStr}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                      {log.food_name || log.description}
                    </h4>
                    <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono mt-0.5">
                      Б: {log.protein}г • У: {log.carbs}г • Ж: {log.fat}г
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white font-mono block">
                        {log.calories}
                      </span>
                      <span className="text-[9px] text-stone-400 uppercase font-mono">kcal</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(log.id)}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
