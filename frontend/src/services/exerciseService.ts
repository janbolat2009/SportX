import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Exercise, ExerciseCategory } from '../types';
import { FALLBACK_CATEGORIES, FALLBACK_EXERCISES } from './exerciseData';

export { FALLBACK_CATEGORIES, FALLBACK_EXERCISES };

export interface LocalizedExercise {
  id: number;
  category_id?: number;
  category_name: string;
  slug: string;
  name: string;
  target_muscles: string;
  secondary_muscles: string;
  equipment: string;
  difficulty: string;
  description: string;
  starting_position: string;
  instructions: string;
  breathing: string;
  common_mistakes: string;
  camera_angle: string;
  default_camera_angle?: string;
  camera_height: string;
  camera_distance: string;
  body_visibility: string;
  camera_instructions: string;
  camera_setup_instructions?: string;
  youtube_id?: string;
  video_url?: string;
  ideal_rom_degrees?: number;
  normative_cadence_seconds?: number;
  analysis_supported: boolean;
  analysis_available: boolean;
}

export function getLocalizedExercise(exercise: Exercise, lang: string): LocalizedExercise {
  const l = lang === 'kk' ? 'kk' : lang === 'ru' ? 'ru' : 'en';
  const cameraAngle = (l === 'kk' ? exercise.camera_angle_kk : l === 'ru' ? exercise.camera_angle_ru : exercise.camera_angle_en) || exercise.camera_angle || exercise.default_camera_angle || 'Side View';
  const cameraInstructions = (l === 'kk' ? exercise.camera_instructions_kk : l === 'ru' ? exercise.camera_instructions_ru : exercise.camera_instructions_en) || exercise.camera_instructions || exercise.camera_setup_instructions || '';

  return {
    id: exercise.id || 0,
    category_id: exercise.category_id,
    category_name: exercise.category_name || '',
    slug: exercise.slug,
    name: (l === 'kk' ? exercise.name_kk : l === 'ru' ? exercise.name_ru : exercise.name_en) || exercise.name,
    target_muscles: (l === 'kk' ? exercise.target_muscles_kk : l === 'ru' ? exercise.target_muscles_ru : exercise.target_muscles_en) || exercise.target_muscles || '',
    secondary_muscles: (l === 'kk' ? exercise.secondary_muscles_kk : l === 'ru' ? exercise.secondary_muscles_ru : exercise.secondary_muscles_en) || exercise.secondary_muscles || '',
    equipment: (l === 'kk' ? exercise.equipment_kk : l === 'ru' ? exercise.equipment_ru : exercise.equipment_en) || exercise.equipment || '',
    difficulty: (l === 'kk' ? exercise.difficulty_kk : l === 'ru' ? exercise.difficulty_ru : exercise.difficulty_en) || exercise.difficulty || '',
    description: (l === 'kk' ? exercise.description_kk : l === 'ru' ? exercise.description_ru : exercise.description_en) || exercise.description || '',
    starting_position: (l === 'kk' ? exercise.starting_position_kk : l === 'ru' ? exercise.starting_position_ru : exercise.starting_position_en) || exercise.starting_position || '',
    instructions: (l === 'kk' ? exercise.instructions_kk : l === 'ru' ? exercise.instructions_ru : exercise.instructions_en) || exercise.instructions || '',
    breathing: (l === 'kk' ? exercise.breathing_kk : l === 'ru' ? exercise.breathing_ru : exercise.breathing_en) || exercise.breathing || '',
    common_mistakes: (l === 'kk' ? exercise.common_mistakes_kk : l === 'ru' ? exercise.common_mistakes_ru : exercise.common_mistakes_en) || exercise.common_mistakes || '',
    camera_angle: cameraAngle,
    default_camera_angle: cameraAngle,
    camera_height: (l === 'kk' ? exercise.camera_height_kk : l === 'ru' ? exercise.camera_height_ru : exercise.camera_height_en) || exercise.camera_height || '',
    camera_distance: (l === 'kk' ? exercise.camera_distance_kk : l === 'ru' ? exercise.camera_distance_ru : exercise.camera_distance_en) || exercise.camera_distance || '',
    body_visibility: (l === 'kk' ? exercise.body_visibility_kk : l === 'ru' ? exercise.body_visibility_ru : exercise.body_visibility_en) || exercise.body_visibility || '',
    camera_instructions: cameraInstructions,
    camera_setup_instructions: cameraInstructions,
    youtube_id: exercise.youtube_id || undefined,
    video_url: exercise.video_url || undefined,
    ideal_rom_degrees: exercise.ideal_rom_degrees,
    normative_cadence_seconds: exercise.normative_cadence_seconds,
    analysis_supported: exercise.analysis_supported ?? false,
    analysis_available: exercise.analysis_supported ?? false,
  };
}

export interface ExerciseFilterParams {
  categoryId?: number | string;
  categorySlug?: string;
  search?: string;
  difficulty?: string;
  equipment?: string;
  analysisSupportedOnly?: boolean;
}

export const exerciseService = {
  async getCategories(): Promise<ExerciseCategory[]> {
    let allCategories = [...FALLBACK_CATEGORIES];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exercise_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const dbSlugs = new Map(data.map((c: any) => [c.slug, c]));
          // Merge by slug so local enrichments/translations are retained
          allCategories = allCategories.map((fallbackCat) => {
            const dbCat = dbSlugs.get(fallbackCat.slug);
            return dbCat ? { ...fallbackCat, ...dbCat, id: dbCat.id || fallbackCat.id } : fallbackCat;
          });
          // Add any new categories from DB that are not in fallback
          const fallbackSlugSet = new Set(FALLBACK_CATEGORIES.map((c) => c.slug));
          for (const dbCat of data) {
            if (!fallbackSlugSet.has(dbCat.slug)) {
              allCategories.push(dbCat as ExerciseCategory);
            }
          }
        }
      } catch (err) {
        console.warn('Notice loading categories from Supabase:', err);
      }
    }
    return allCategories;
  },

  async getExercises(filters?: ExerciseFilterParams): Promise<Exercise[]> {
    let allExercises = [...FALLBACK_EXERCISES];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select(`
            *,
            exercise_categories:category_id (id, name, slug)
          `);

        if (!error && data && data.length > 0) {
          const dbExercises = data.map((d: any) => ({
            ...d,
            category_name: d.exercise_categories?.name || d.category_name || 'General'
          })) as Exercise[];

          const dbSlugMap = new Map(dbExercises.map((e) => [e.slug, e]));
          
          allExercises = allExercises.map((fallbackEx) => {
            const dbEx = dbSlugMap.get(fallbackEx.slug);
            if (!dbEx) return fallbackEx;
            
            // Enrich: Keep DB id if available, but fill all multilingual fields if DB is null/empty
            return {
              ...fallbackEx,
              ...dbEx,
              id: dbEx.id || fallbackEx.id,
              category_id: dbEx.category_id || fallbackEx.category_id,
              category_name: dbEx.category_name || fallbackEx.category_name,
              name: dbEx.name || fallbackEx.name,
              name_en: dbEx.name_en || fallbackEx.name_en,
              name_ru: dbEx.name_ru || fallbackEx.name_ru,
              name_kk: dbEx.name_kk || fallbackEx.name_kk,
              target_muscles: dbEx.target_muscles || fallbackEx.target_muscles,
              target_muscles_en: dbEx.target_muscles_en || fallbackEx.target_muscles_en,
              target_muscles_ru: dbEx.target_muscles_ru || fallbackEx.target_muscles_ru,
              target_muscles_kk: dbEx.target_muscles_kk || fallbackEx.target_muscles_kk,
              secondary_muscles: dbEx.secondary_muscles || fallbackEx.secondary_muscles,
              secondary_muscles_en: dbEx.secondary_muscles_en || fallbackEx.secondary_muscles_en,
              secondary_muscles_ru: dbEx.secondary_muscles_ru || fallbackEx.secondary_muscles_ru,
              secondary_muscles_kk: dbEx.secondary_muscles_kk || fallbackEx.secondary_muscles_kk,
              description: dbEx.description || fallbackEx.description,
              description_en: dbEx.description_en || fallbackEx.description_en,
              description_ru: dbEx.description_ru || fallbackEx.description_ru,
              description_kk: dbEx.description_kk || fallbackEx.description_kk,
              starting_position: dbEx.starting_position || fallbackEx.starting_position,
              starting_position_en: dbEx.starting_position_en || fallbackEx.starting_position_en,
              starting_position_ru: dbEx.starting_position_ru || fallbackEx.starting_position_ru,
              starting_position_kk: dbEx.starting_position_kk || fallbackEx.starting_position_kk,
              instructions: dbEx.instructions || fallbackEx.instructions,
              instructions_en: dbEx.instructions_en || fallbackEx.instructions_en,
              instructions_ru: dbEx.instructions_ru || fallbackEx.instructions_ru,
              instructions_kk: dbEx.instructions_kk || fallbackEx.instructions_kk,
              breathing: dbEx.breathing || fallbackEx.breathing,
              breathing_en: dbEx.breathing_en || fallbackEx.breathing_en,
              breathing_ru: dbEx.breathing_ru || fallbackEx.breathing_ru,
              breathing_kk: dbEx.breathing_kk || fallbackEx.breathing_kk,
              common_mistakes: dbEx.common_mistakes || fallbackEx.common_mistakes,
              common_mistakes_en: dbEx.common_mistakes_en || fallbackEx.common_mistakes_en,
              common_mistakes_ru: dbEx.common_mistakes_ru || fallbackEx.common_mistakes_ru,
              common_mistakes_kk: dbEx.common_mistakes_kk || fallbackEx.common_mistakes_kk,
              equipment: dbEx.equipment || fallbackEx.equipment,
              equipment_en: dbEx.equipment_en || fallbackEx.equipment_en,
              equipment_ru: dbEx.equipment_ru || fallbackEx.equipment_ru,
              equipment_kk: dbEx.equipment_kk || fallbackEx.equipment_kk,
              difficulty: dbEx.difficulty || fallbackEx.difficulty,
              difficulty_en: dbEx.difficulty_en || fallbackEx.difficulty_en,
              difficulty_ru: dbEx.difficulty_ru || fallbackEx.difficulty_ru,
              difficulty_kk: dbEx.difficulty_kk || fallbackEx.difficulty_kk,
              camera_angle: dbEx.camera_angle || fallbackEx.camera_angle,
              camera_angle_en: dbEx.camera_angle_en || fallbackEx.camera_angle_en,
              camera_angle_ru: dbEx.camera_angle_ru || fallbackEx.camera_angle_ru,
              camera_angle_kk: dbEx.camera_angle_kk || fallbackEx.camera_angle_kk,
              camera_height_en: dbEx.camera_height_en || fallbackEx.camera_height_en,
              camera_height_ru: dbEx.camera_height_ru || fallbackEx.camera_height_ru,
              camera_height_kk: dbEx.camera_height_kk || fallbackEx.camera_height_kk,
              camera_distance_en: dbEx.camera_distance_en || fallbackEx.camera_distance_en,
              camera_distance_ru: dbEx.camera_distance_ru || fallbackEx.camera_distance_ru,
              camera_distance_kk: dbEx.camera_distance_kk || fallbackEx.camera_distance_kk,
              body_visibility_en: dbEx.body_visibility_en || fallbackEx.body_visibility_en,
              body_visibility_ru: dbEx.body_visibility_ru || fallbackEx.body_visibility_ru,
              body_visibility_kk: dbEx.body_visibility_kk || fallbackEx.body_visibility_kk,
              camera_instructions_en: dbEx.camera_instructions_en || fallbackEx.camera_instructions_en,
              camera_instructions_ru: dbEx.camera_instructions_ru || fallbackEx.camera_instructions_ru,
              camera_instructions_kk: dbEx.camera_instructions_kk || fallbackEx.camera_instructions_kk,
              youtube_id: dbEx.youtube_id || fallbackEx.youtube_id,
              video_url: dbEx.video_url || fallbackEx.video_url,
              analysis_supported: dbEx.analysis_supported ?? fallbackEx.analysis_supported,
              analysis_available: dbEx.analysis_available ?? fallbackEx.analysis_available,
            };
          });

          // Also include any custom DB exercises not present in fallback
          const fallbackSlugSet = new Set(FALLBACK_EXERCISES.map((e) => e.slug));
          for (const dbEx of dbExercises) {
            if (!fallbackSlugSet.has(dbEx.slug)) {
              allExercises.push(dbEx);
            }
          }
        }
      } catch (err) {
        console.warn('Notice loading exercises from Supabase:', err);
      }
    }

    let results = allExercises;

    if (filters?.categoryId) {
      results = results.filter((e) => e.category_id === Number(filters.categoryId));
    }
    if (filters?.categorySlug) {
      const cat = FALLBACK_CATEGORIES.find((c) => c.slug === filters.categorySlug);
      if (cat) {
        results = results.filter(
          (e) =>
            e.category_id === cat.id ||
            e.category_name?.toLowerCase() === cat.name.toLowerCase() ||
            e.target_muscles?.toLowerCase().includes(cat.name.toLowerCase()) ||
            e.target_muscles_en?.toLowerCase().includes(cat.name.toLowerCase()) ||
            e.slug.includes(cat.slug)
        );
      }
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      const diff = filters.difficulty.toLowerCase();
      results = results.filter(
        (e) =>
          e.difficulty?.toLowerCase() === diff ||
          e.difficulty_en?.toLowerCase() === diff ||
          e.difficulty_ru?.toLowerCase() === diff ||
          e.difficulty_kk?.toLowerCase() === diff
      );
    }
    if (filters?.equipment && filters.equipment !== 'all') {
      const eq = filters.equipment.toLowerCase();
      results = results.filter(
        (e) =>
          e.equipment?.toLowerCase().includes(eq) ||
          e.equipment_en?.toLowerCase().includes(eq) ||
          e.equipment_ru?.toLowerCase().includes(eq) ||
          e.equipment_kk?.toLowerCase().includes(eq)
      );
    }
    if (filters?.analysisSupportedOnly) {
      results = results.filter((e) => e.analysis_supported || e.analysis_available);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      results = results.filter(
        (e) =>
          e.name?.toLowerCase().includes(s) ||
          e.name_en?.toLowerCase().includes(s) ||
          e.name_ru?.toLowerCase().includes(s) ||
          e.name_kk?.toLowerCase().includes(s) ||
          e.target_muscles?.toLowerCase().includes(s) ||
          e.target_muscles_en?.toLowerCase().includes(s) ||
          e.target_muscles_ru?.toLowerCase().includes(s) ||
          e.target_muscles_kk?.toLowerCase().includes(s) ||
          e.equipment?.toLowerCase().includes(s) ||
          e.category_name?.toLowerCase().includes(s)
      );
    }

    return results;
  },

  async getExerciseBySlug(slug: string): Promise<Exercise | null> {
    const fallback = FALLBACK_EXERCISES.find((e) => e.slug === slug);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select(`
            *,
            exercise_categories:category_id (id, name, slug)
          `)
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          const dbEx = {
            ...(data as any),
            category_name: (data as any).exercise_categories?.name || (data as any).category_name || 'General'
          } as Exercise;
          return fallback ? { ...fallback, ...dbEx, id: dbEx.id || fallback.id } : dbEx;
        }
      } catch {}
    }
    return fallback || null;
  },

  async getExerciseById(id: number): Promise<Exercise | null> {
    const fallback = FALLBACK_EXERCISES.find((e) => e.id === id);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select(`
            *,
            exercise_categories:category_id (id, name, slug)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const dbEx = {
            ...(data as any),
            category_name: (data as any).exercise_categories?.name || (data as any).category_name || 'General'
          } as Exercise;
          return fallback ? { ...fallback, ...dbEx, id: dbEx.id || fallback.id } : dbEx;
        }
      } catch {}
    }
    return fallback || null;
  }
};
