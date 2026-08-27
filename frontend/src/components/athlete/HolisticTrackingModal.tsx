import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sleepService } from '../../services/sleepService';
import { nutritionService } from '../../services/nutritionService';
import { recoveryService } from '../../services/recoveryService';
import { Moon, Utensils, HeartPulse, X, Check } from 'lucide-react';

interface Props {
  type?: 'sleep' | 'nutrition' | 'recovery';
  initialTab?: 'sleep' | 'nutrition' | 'recovery';
  onClose: () => void;
  onSuccess: () => void;
}

export const HolisticTrackingModal: React.FC<Props> = ({ type = 'sleep', initialTab, onClose, onSuccess }) => {
  const { user } = useAuth();
  const activeType = initialTab || type;
  const todayStr = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sleep fields
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepHours, setSleepHours] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(85);

  // Nutrition fields
  const [mealType, setMealType] = useState('LUNCH');
  const [mealDesc, setMealDesc] = useState('');
  const [calories, setCalories] = useState(650);
  const [protein, setProtein] = useState(40);
  const [carbs, setCarbs] = useState(75);
  const [fats, setFats] = useState(18);
  const [water, setWater] = useState(500);

  // Recovery fields
  const [soreness, setSoreness] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [stress, setStress] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userIdStr = user?.id ? String(user.id) : undefined;
      if (activeType === 'sleep') {
        await sleepService.logSleep(
          {
            log_date: todayStr,
            bedtime,
            wake_time: wakeTime,
            total_sleep_minutes: Math.round(sleepHours * 60),
            sleep_quality_score: sleepQuality,
          },
          userIdStr
        );
      } else if (activeType === 'nutrition') {
        await nutritionService.logNutrition(
          {
            log_date: todayStr,
            meal_type: mealType,
            meal_description: mealDesc || 'Healthy meal',
            calories,
            protein_g: protein,
            carbs_g: carbs,
            fats_g: fats,
            water_ml: water,
          },
          userIdStr
        );
      } else if (activeType === 'recovery') {
        await recoveryService.logRecovery(
          {
            log_date: todayStr,
            soreness_level: soreness,
            fatigue_level: fatigue,
            stress_level: stress,
            training_load_estimate: 60,
          },
          userIdStr
        );
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {type === 'sleep' && <Moon className="w-5 h-5 text-indigo-400" />}
            {type === 'nutrition' && <Utensils className="w-5 h-5 text-amber-400" />}
            {type === 'recovery' && <HeartPulse className="w-5 h-5 text-rose-400" />}
            <h3 className="text-base font-bold text-white capitalize">Log Daily {type}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {activeType === 'sleep' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Bedtime</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Total Sleep: {sleepHours} Hours</label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Sleep Quality: {sleepQuality}%</label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </>
          )}

          {activeType === 'nutrition' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Meal Description</label>
                <input
                  type="text"
                  placeholder="e.g. Oatmeal with protein and berries"
                  value={mealDesc}
                  onChange={(e) => setMealDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'recovery' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Muscle Soreness: {soreness}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={soreness}
                  onChange={(e) => setSoreness(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Subjective Fatigue: {fatigue}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={fatigue}
                  onChange={(e) => setFatigue(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Stress Level: {stress}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
