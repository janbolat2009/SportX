import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import { NutritionRecord } from '../types';

export const nutritionService = {
  async getNutritionRecords(athleteUserId?: string, limit = 7): Promise<NutritionRecord[]> {
    if (isSupabaseConfigured() && athleteUserId) {
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('nutrition_records')
          .select('*')
          .eq('athlete_id', athlete.id)
          .order('date', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            athlete_id: d.athlete_id,
            log_date: d.date,
            meal_type: d.meal_type,
            meal_description: d.meal_description || d.description || '',
            calories: d.calories || 600,
            protein_g: d.protein_g || d.protein || 30,
            carbs_g: d.carbs_g || d.carbohydrates || 60,
            fats_g: d.fats_g || d.fat || 20,
            water_ml: d.water_ml || 500,
            notes: d.notes,
            created_at: d.created_at,
          }));
        }
      }
    }

    return [];
  },

  async logNutrition(
    record: {
      log_date: string;
      meal_type: string;
      meal_description: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      water_ml: number;
      notes?: string;
    },
    athleteUserId?: string
  ): Promise<any> {
    if (isSupabaseConfigured() && athleteUserId) {
      let { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (!athlete) {
        const subjectId = 'ATH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newAp } = await supabase
          .from('athlete_profiles')
          .upsert(
            {
              user_id: athleteUserId,
              sport: 'General Fitness',
              training_level: 'Intermediate',
              anonymized_subject_id: subjectId,
            },
            { onConflict: 'user_id' }
          )
          .select('id')
          .maybeSingle();
        athlete = newAp;
      }

      if (athlete) {
        const mealTypeUpper = (record.meal_type || 'LUNCH').toUpperCase();
        const validMealType = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(mealTypeUpper)
          ? mealTypeUpper
          : 'LUNCH';

        const { data, error } = await supabase
          .from('nutrition_records')
          .insert({
            athlete_id: athlete.id,
            date: record.log_date || new Date().toISOString().split('T')[0],
            meal_type: validMealType,
            meal_description: record.meal_description || 'Meal',
            calories: Math.round(Number(record.calories) || 0),
            protein_g: Number(record.protein_g) || 0,
            carbs_g: Number(record.carbs_g) || 0,
            fats_g: Number(record.fats_g) || 0,
            water_ml: Number(record.water_ml) || 250,
          })
          .select()
          .single();

        // Also sync to meal_logs for compatibility
        try {
          await supabase.from('meal_logs').insert({
            user_id: athleteUserId,
            meal_type: validMealType.charAt(0) + validMealType.slice(1).toLowerCase(),
            food_name: record.meal_description || 'Meal',
            description: record.meal_description || 'Meal',
            amount_grams: 300,
            calories: Math.round(Number(record.calories) || 0),
            protein: Number(record.protein_g) || 0,
            carbohydrates: Number(record.carbs_g) || 0,
            fat: Number(record.fats_g) || 0,
            fiber: 5,
            estimated: false,
            model_version: 'sportx-nutrition-v2.0',
            created_at: new Date().toISOString(),
          });
        } catch {}

        if (error) throw error;
        return data;
      }
    }

    return api.logNutrition(record);
  },
};
