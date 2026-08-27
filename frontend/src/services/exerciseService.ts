import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Exercise, ExerciseCategory } from '../types';

export const FALLBACK_CATEGORIES: ExerciseCategory[] = [
  { id: 1, name: 'Chest', slug: 'chest', description: 'Pectoralis complex and horizontal pressing muscles', icon_name: 'Dumbbell', display_order: 1 },
  { id: 2, name: 'Back', slug: 'back', description: 'Latissimus dorsi, rhomboids, and pulling chain', icon_name: 'Shield', display_order: 2 },
  { id: 3, name: 'Shoulders', slug: 'shoulders', description: 'Deltoids and scapular stabilizer muscle groups', icon_name: 'Activity', display_order: 3 },
  { id: 4, name: 'Biceps', slug: 'biceps', description: 'Biceps brachii and elbow flexors', icon_name: 'Zap', display_order: 4 },
  { id: 5, name: 'Triceps', slug: 'triceps', description: 'Triceps brachii and elbow extensors', icon_name: 'Flame', display_order: 5 },
  { id: 6, name: 'Forearms', slug: 'forearms', description: 'Wrist flexors, extensors, and grip strength', icon_name: 'Target', display_order: 6 },
  { id: 7, name: 'Core', slug: 'core', description: 'Rectus abdominis, obliques, and transverse stabilizers', icon_name: 'Layers', display_order: 7 },
  { id: 8, name: 'Traps', slug: 'traps', description: 'Upper, middle, and lower trapezius', icon_name: 'ShieldCheck', display_order: 8 },
  { id: 9, name: 'Neck', slug: 'neck', description: 'Cervical stabilizers and neck musculature', icon_name: 'UserCheck', display_order: 9 },
  { id: 10, name: 'Glutes', slug: 'glutes', description: 'Gluteus maximus, medius, and hip power generators', icon_name: 'TrendingUp', display_order: 10 },
  { id: 11, name: 'Quadriceps', slug: 'quadriceps', description: 'Anterior thigh and knee extensors', icon_name: 'Award', display_order: 11 },
  { id: 12, name: 'Hamstrings', slug: 'hamstrings', description: 'Posterior thigh and knee flexors', icon_name: 'Repeat', display_order: 12 },
  { id: 13, name: 'Calves', slug: 'calves', description: 'Gastrocnemius and soleus ankle complex', icon_name: 'Gauge', display_order: 13 },
  { id: 14, name: 'Adductors', slug: 'adductors', description: 'Medial thigh and hip adductor group', icon_name: 'Crosshair', display_order: 14 },
  { id: 15, name: 'Full Body', slug: 'full_body', description: 'Multi-joint full body athletic compound movements', icon_name: 'Globe', display_order: 15 },
  { id: 16, name: 'Cardio', slug: 'cardio', description: 'Cardiovascular endurance and high-velocity conditioning', icon_name: 'Heart', display_order: 16 },
  { id: 17, name: 'Mobility', slug: 'mobility', description: 'Joint mobility, thoracic range of motion, and tissue health', icon_name: 'Compass', display_order: 17 },
];

export const FALLBACK_EXERCISES: Exercise[] = [
  // 1. QUADRICEPS (AI Supported)
  {
    id: 1,
    category_id: 11,
    category_name: 'Quadriceps',
    name: 'Barbell / Bodyweight Squat',
    slug: 'squat',
    target_muscles: 'Quadriceps, Glutes, Core',
    secondary_muscles: 'Hamstrings, Calves',
    description: 'Lower-body foundational compound movement evaluating knee flexion depth, hip displacement, and spinal neutrality.',
    instructions: '1. Stand with feet shoulder-width apart, toes angled slightly outward.\n2. Inhale, brace your core, and initiate movement by hinging hips back.\n3. Descend under control until thighs reach parallel or below (>=90° knee angle).\n4. Drive through midfoot and heels back to standing lockout.',
    common_mistakes: 'Knees caving inward (valgus collapse), shifting weight onto toes, rounding lower back, cutting off depth.',
    difficulty: 'Intermediate',
    equipment: 'Bodyweight / Barbell',
    default_camera_angle: 'Side View (90 deg)',
    camera_setup_instructions: 'Position camera 2 to 3 meters away at hip/knee height with clear full-body visibility.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 3.0,
    analysis_supported: true,
  },
  // 2. CHEST (AI Supported)
  {
    id: 2,
    category_id: 1,
    category_name: 'Chest',
    name: 'Standard Push-up',
    slug: 'pushup',
    target_muscles: 'Pectoralis Major, Triceps Brachii, Anterior Deltoids',
    secondary_muscles: 'Core, Serratus Anterior',
    description: 'Upper-body horizontal pressing movement evaluating chest depth, elbow flare angle, and straight-line plank posture.',
    instructions: '1. Start in a high plank with hands slightly wider than shoulder-width.\n2. Maintain rigid head-to-heel alignment by squeezing glutes and bracing core.\n3. Lower chest until 2-3 inches above the floor while keeping elbows angled at 45 degrees.\n4. Press back up powerfully to full arm extension.',
    common_mistakes: 'Sagging hips/lumbar hyperextension, flaring elbows out 90 degrees, incomplete range of motion, craning neck forward.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Position camera 2 to 3 meters away at floor/shin height with side view showing full body from head to heels.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 2.5,
    analysis_supported: true,
  },
  // 3. BICEPS (AI Supported)
  {
    id: 3,
    category_id: 4,
    category_name: 'Biceps',
    name: 'Dumbbell Bicep Curl',
    slug: 'bicep_curl',
    target_muscles: 'Biceps Brachii, Brachialis',
    secondary_muscles: 'Forearm Flexors, Anterior Deltoids',
    description: 'Isolated upper-limb flexion movement monitoring upper-arm stillness, elbow drift, and torso momentum compensation.',
    instructions: '1. Stand tall holding dumbbells at your sides with palms forward.\n2. Keep upper arms stationary against your ribcage.\n3. Curl dumbbells up toward shoulders while supinating wrists.\n4. Squeeze biceps at peak contraction and lower with 2-second eccentric control.',
    common_mistakes: 'Swinging torso for momentum, elbows drifting forward or outward, dropping weights quickly without resistance.',
    difficulty: 'Beginner',
    equipment: 'Dumbbells',
    default_camera_angle: 'Front or Side View',
    camera_setup_instructions: 'Position camera 2 to 3 meters away at chest height. Ensure upper arms and shoulders are in full view.',
    ideal_rom_degrees: 120,
    normative_cadence_seconds: 3.0,
    analysis_supported: true,
  },
  // 4. SHOULDERS (AI Supported)
  {
    id: 4,
    category_id: 3,
    category_name: 'Shoulders',
    name: 'Overhead Shoulder Press',
    slug: 'shoulder_press',
    target_muscles: 'Deltoids (Anterior & Lateral), Triceps Brachii',
    secondary_muscles: 'Upper Trapezius, Core Stabilizers',
    description: 'Vertical overhead pressing movement evaluating overhead lockout, bilateral symmetry, and lumbar hyperextension.',
    instructions: '1. Stand or sit with dumbbells or barbell at shoulder height, palms forward.\n2. Engage core and glutes to lock ribcage down.\n3. Press weight directly upward in a straight bar path until arms are fully locked overhead.\n4. Lower smoothly back to chin level under control.',
    common_mistakes: 'Arching lower back to push weight, pressing forward instead of overhead, asymmetrical press lockout.',
    difficulty: 'Intermediate',
    equipment: 'Dumbbells / Barbell',
    default_camera_angle: 'Front View',
    camera_setup_instructions: 'Position camera 2.5 to 3.5 meters away at chest height. Ensure overhead arms reach is within frame.',
    ideal_rom_degrees: 165,
    normative_cadence_seconds: 3.0,
    analysis_supported: true,
  },
  // 5. CHEST (Catalog)
  {
    id: 5,
    category_id: 1,
    category_name: 'Chest',
    name: 'Barbell Bench Press',
    slug: 'barbell_bench_press',
    target_muscles: 'Pectoralis Major, Anterior Deltoids, Triceps',
    secondary_muscles: 'Serratus Anterior',
    description: 'Primary upper body horizontal strength builder.',
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, retract scapulae, lower bar to mid-chest, press up.',
    common_mistakes: 'Flaring elbows at 90 degrees, bouncing bar off sternum.',
    difficulty: 'Intermediate',
    equipment: 'Barbell',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Position camera from 45 degree angle.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 3.0,
    analysis_supported: false,
  },
  // 6. CHEST (Catalog)
  {
    id: 6,
    category_id: 1,
    category_name: 'Chest',
    name: 'Incline Dumbbell Press',
    slug: 'incline_dumbbell_press',
    target_muscles: 'Clavicular Pectoralis, Anterior Deltoids',
    secondary_muscles: 'Triceps',
    description: 'Upper chest focus on a 30-45 degree incline bench.',
    instructions: 'Set bench to 30 degrees, press dumbbells upward converging slightly at top.',
    common_mistakes: 'Setting incline too steep (>45 deg) which shifts load to front delts.',
    difficulty: 'Intermediate',
    equipment: 'Dumbbells',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Position camera side angle.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 3.0,
    analysis_supported: false,
  },
  // 7. BACK (Catalog)
  {
    id: 8,
    category_id: 2,
    category_name: 'Back',
    name: 'Pull-up',
    slug: 'pull_up',
    target_muscles: 'Latissimus Dorsi, Teres Major, Biceps',
    secondary_muscles: 'Rhomboids, Lower Trapezius',
    description: 'The gold standard bodyweight vertical pulling movement.',
    instructions: 'Overhand grip wider than shoulders, initiate by pulling shoulder blades down, pull chest to bar.',
    common_mistakes: 'Kicking legs for momentum (kipping), half-rep range of motion at bottom.',
    difficulty: 'Advanced',
    equipment: 'Pull-up Bar',
    default_camera_angle: 'Back View',
    camera_setup_instructions: 'Position camera behind athlete.',
    ideal_rom_degrees: 140,
    normative_cadence_seconds: 3.0,
    analysis_supported: false,
  },
  // 8. BACK (Catalog)
  {
    id: 9,
    category_id: 2,
    category_name: 'Back',
    name: 'Barbell Bent-Over Row',
    slug: 'barbell_bent_row',
    target_muscles: 'Latissimus Dorsi, Rhomboids, Mid Trapezius',
    secondary_muscles: 'Erector Spinae, Biceps',
    description: 'Fundamental horizontal pulling exercise for back thickness.',
    instructions: 'Hinge hips to 45 degrees with flat spine, pull bar to upper abdomen leading with elbows.',
    common_mistakes: 'Rounding thoracic/lumbar spine, standing up too vertical.',
    difficulty: 'Intermediate',
    equipment: 'Barbell',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Position camera side angle.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 3.0,
    analysis_supported: false,
  },
  // 9. TRICEPS (Catalog)
  {
    id: 11,
    category_id: 5,
    category_name: 'Triceps',
    name: 'Cable Tricep Pushdown',
    slug: 'tricep_pushdown',
    target_muscles: 'Triceps Brachii (Lateral & Medial heads)',
    secondary_muscles: 'Forearms',
    description: 'Isolated elbow extension for arm development.',
    instructions: 'Keep elbows pinned to sides, push cable attachment down until full extension, control ascent.',
    common_mistakes: 'Letting elbows flare forward or swinging upper body.',
    difficulty: 'Beginner',
    equipment: 'Cable Machine',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view.',
    ideal_rom_degrees: 110,
    normative_cadence_seconds: 2.5,
    analysis_supported: false,
  },
  // 10. CORE (Catalog)
  {
    id: 13,
    category_id: 7,
    category_name: 'Core',
    name: 'Forearm Plank',
    slug: 'forearm_plank',
    target_muscles: 'Rectus Abdominis, Transverse Abdominis',
    secondary_muscles: 'Glutes, Shoulders',
    description: 'Isometric anti-extension core stability benchmark.',
    instructions: 'Rest on forearms and toes, align ears, shoulders, hips, knees, and ankles in one straight line.',
    common_mistakes: 'Sagging hips into anterior pelvic tilt, piking hips in air.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Position camera side profile at floor height.',
    ideal_rom_degrees: 180,
    normative_cadence_seconds: 45.0,
    analysis_supported: false,
  },
  // 11. GLUTES (Catalog)
  {
    id: 15,
    category_id: 10,
    category_name: 'Glutes',
    name: 'Barbell Hip Thrust',
    slug: 'hip_thrust',
    target_muscles: 'Gluteus Maximus',
    secondary_muscles: 'Hamstrings, Quadriceps, Core',
    description: 'High-load glute hypertrophy and hip extension movement.',
    instructions: 'Sit on floor with upper back against bench, place barbell over hips, drive hips up until parallel with floor.',
    common_mistakes: 'Hyperextending lumbar spine at top instead of posterior pelvic tilt.',
    difficulty: 'Intermediate',
    equipment: 'Barbell & Bench',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view.',
    ideal_rom_degrees: 180,
    normative_cadence_seconds: 3.0,
    analysis_supported: false,
  },
  // 12. HAMSTRINGS (Catalog)
  {
    id: 16,
    category_id: 12,
    category_name: 'Hamstrings',
    name: 'Romanian Deadlift (RDL)',
    slug: 'romanian_deadlift',
    target_muscles: 'Hamstrings, Gluteus Maximus',
    secondary_muscles: 'Erector Spinae, Traps',
    description: 'Essential hip hinge movement for posterior chain strength.',
    instructions: 'Hold barbell with slight knee bend, hinge hips backward keeping bar close to shins, squeeze glutes to return.',
    common_mistakes: 'Rounding lumbar spine, bending knees excessively into a squat.',
    difficulty: 'Intermediate',
    equipment: 'Barbell / Dumbbells',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view showing hip hinge.',
    ideal_rom_degrees: 80,
    normative_cadence_seconds: 3.5,
    analysis_supported: false,
  },
  // 13. CALVES (Catalog)
  {
    id: 17,
    category_id: 13,
    category_name: 'Calves',
    name: 'Standing Calf Raise',
    slug: 'standing_calf_raise',
    target_muscles: 'Gastrocnemius, Soleus',
    secondary_muscles: 'Foot intrinsic muscles',
    description: 'Ankle plantarflexion for lower leg resilience.',
    instructions: 'Stand on edge of step, lower heels below step level for deep stretch, rise onto balls of feet.',
    common_mistakes: 'Bouncing rapidly without pausing at top contraction.',
    difficulty: 'Beginner',
    equipment: 'Step / Machine',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view of lower leg.',
    ideal_rom_degrees: 45,
    normative_cadence_seconds: 2.5,
    analysis_supported: false,
  },
  // 14. FOREARMS (Catalog)
  {
    id: 18,
    category_id: 6,
    category_name: 'Forearms',
    name: 'Farmer Carry',
    slug: 'farmer_carry',
    target_muscles: 'Forearm Flexors, Grip, Trapezius',
    secondary_muscles: 'Core Stabilizers, Calves',
    description: 'Functional loaded carry testing whole-body postural endurance.',
    instructions: 'Hold heavy dumbbells at sides, stand tall, walk in straight line with upright posture.',
    common_mistakes: 'Slouching shoulders forward, wobbling side to side.',
    difficulty: 'Beginner',
    equipment: 'Dumbbells / Trap Bar',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Full body tracking.',
    ideal_rom_degrees: 180,
    normative_cadence_seconds: 30.0,
    analysis_supported: false,
  },
  // 15. FULL BODY (Catalog)
  {
    id: 19,
    category_id: 15,
    category_name: 'Full Body',
    name: 'Burpee',
    slug: 'burpee',
    target_muscles: 'Full Body (Chest, Core, Quads, Deltoids)',
    secondary_muscles: 'Cardiovascular System',
    description: 'High-intensity athletic conditioning movement.',
    instructions: 'Drop into squat, kick feet back into push-up, perform push-up, jump feet forward, jump up with hands overhead.',
    common_mistakes: 'Collapsing lower back during plank landing, skipping full jump.',
    difficulty: 'Intermediate',
    equipment: 'Bodyweight',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 2.0,
    analysis_supported: false,
  },
  // 16. CARDIO (Catalog)
  {
    id: 20,
    category_id: 16,
    category_name: 'Cardio',
    name: 'Jumping Jacks',
    slug: 'jumping_jacks',
    target_muscles: 'Cardiovascular System, Calves, Deltoids',
    secondary_muscles: 'Adductors, Abductors',
    description: 'Rhythmic full-body warm-up and conditioning drill.',
    instructions: 'Jump feet wide while raising arms overhead, jump back to starting position in continuous rhythm.',
    common_mistakes: 'Landing hard on flat feet instead of springy balls of feet.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    default_camera_angle: 'Front View',
    camera_setup_instructions: 'Front camera view.',
    ideal_rom_degrees: 180,
    normative_cadence_seconds: 1.5,
    analysis_supported: false,
  },
  // 17. MOBILITY (Catalog)
  {
    id: 21,
    category_id: 17,
    category_name: 'Mobility',
    name: 'World Greatest Stretch',
    slug: 'worlds_greatest_stretch',
    target_muscles: 'Thoracic Spine, Hip Flexors, Hamstrings',
    secondary_muscles: 'Glutes, Ankles',
    description: 'Multi-planar full body mobility dynamic sequence.',
    instructions: 'Step forward into deep lunge, place inside elbow to instep, rotate arm and chest toward sky.',
    common_mistakes: 'Rushing through positions without deep breathing.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
    default_camera_angle: 'Side View',
    camera_setup_instructions: 'Side camera view.',
    ideal_rom_degrees: 90,
    normative_cadence_seconds: 5.0,
    analysis_supported: false,
  }
];

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
        `)
        .order('id', { ascending: true });

      if (filters?.categoryId) {
        query = query.eq('category_id', Number(filters.categoryId));
      }
      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters?.equipment && filters.equipment !== 'all') {
        query = query.ilike('equipment', `%${filters.equipment}%`);
      }
      if (filters?.analysisSupportedOnly) {
        query = query.eq('analysis_supported', true);
      }
      if (filters?.search) {
        const s = filters.search.trim();
        query = query.or(`name.ilike.%${s}%,target_muscles.ilike.%${s}%,equipment.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          ...d,
          category_name: d.exercise_categories?.name || 'General'
        })) as Exercise[];
      }
    }

    // Fallback in-memory search and filter
    let results = [...FALLBACK_EXERCISES];

    if (filters?.categoryId) {
      results = results.filter((e) => e.category_id === Number(filters.categoryId));
    }
    if (filters?.categorySlug) {
      const cat = FALLBACK_CATEGORIES.find((c) => c.slug === filters.categorySlug);
      if (cat) results = results.filter((e) => e.category_id === cat.id);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      results = results.filter((e) => e.difficulty?.toLowerCase() === filters.difficulty?.toLowerCase());
    }
    if (filters?.equipment && filters.equipment !== 'all') {
      results = results.filter((e) => e.equipment?.toLowerCase().includes(filters.equipment!.toLowerCase()));
    }
    if (filters?.analysisSupportedOnly) {
      results = results.filter((e) => e.analysis_supported);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.target_muscles.toLowerCase().includes(s) ||
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
          ...data,
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
          ...data,
          category_name: (data as any).exercise_categories?.name || 'General'
        } as Exercise;
      }
    }

    const found = FALLBACK_EXERCISES.find((e) => e.id === id);
    return found || null;
  }
};
