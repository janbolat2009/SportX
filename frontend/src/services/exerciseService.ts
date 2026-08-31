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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ExerciseCategory[];
      }
    }
    return FALLBACK_CATEGORIES;
  },

  async getExercises(filters?: ExerciseFilterParams): Promise<Exercise[]> {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories:category_id (id, name, slug)
        `);

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.ilike('difficulty', `%${filters.difficulty}%`);
      }
      if (filters?.equipment && filters.equipment !== 'all') {
        query = query.ilike('equipment', `%${filters.equipment}%`);
      }
      if (filters?.analysisSupportedOnly) {
        query = query.eq('analysis_supported', true);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,name_ru.ilike.%${filters.search}%,name_kk.ilike.%${filters.search}%,target_muscles.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let results = data.map((d: any) => ({
          ...d,
          category_name: d.exercise_categories?.name || 'General'
        })) as Exercise[];

        if (filters?.categorySlug) {
          results = results.filter((e) => {
            const cat = FALLBACK_CATEGORIES.find((c) => c.slug === filters.categorySlug);
            return cat ? e.category_id === cat.id : true;
          });
        }
        return results;
      }
    }

    // Fallback in-memory query
    let results = [...FALLBACK_EXERCISES];

    if (filters?.categoryId) {
      results = results.filter((e) => e.category_id === Number(filters.categoryId));
    }
    if (filters?.categorySlug) {
      const cat = FALLBACK_CATEGORIES.find((c) => c.slug === filters.categorySlug);
      if (cat) results = results.filter((e) => e.category_id === cat.id);
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories:category_id (id, name, slug)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (!error && data) {
        return {
          ...(data as any),
          category_name: (data as any).exercise_categories?.name || 'General'
        } as Exercise;
      }
    }

    const found = FALLBACK_EXERCISES.find((e) => e.slug === slug);
    return found || null;
  },

  async getExerciseById(id: number): Promise<Exercise | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories:category_id (id, name, slug)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...(data as any),
          category_name: (data as any).exercise_categories?.name || 'General'
        } as Exercise;
      }
    }

    const found = FALLBACK_EXERCISES.find((e) => e.id === id);
    return found || null;
  }
};
