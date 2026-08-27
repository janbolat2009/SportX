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
      const { data: athlete } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', athleteUserId)
        .maybeSingle();

      if (athlete) {
        const { data, error } = await supabase
          .from('nutrition_records')
          .insert({
            athlete_id: athlete.id,
            date: record.log_date,
            meal_type: record.meal_type as any,
            description: record.meal_description,
            meal_description: record.meal_description,
            calories: record.calories,
            protein: record.protein_g,
            protein_g: record.protein_g,
            carbohydrates: record.carbs_g,
            carbs_g: record.carbs_g,
            fat: record.fats_g,
            fats_g: record.fats_g,
            water_ml: record.water_ml,
            notes: record.notes,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    return api.logNutrition(record);
  },
};
