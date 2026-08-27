-- =====================================================================
-- SportX Supabase Database Schema, Functions, Triggers & RLS Policies
-- Migration: 20260827_full_sportx_supabase.sql
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. BASE PROFILES & ROLE PROFILES
-- =====================================================================

-- 1.1 Base Profiles Table (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'User',
    role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Athlete Profiles
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    training_level TEXT DEFAULT 'Intermediate' CHECK (training_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    fitness_goal TEXT DEFAULT 'Strength & Biomechanics',
    fitness_goals TEXT DEFAULT 'Strength & Biomechanics',
    sport TEXT DEFAULT 'General Fitness',
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    date_of_birth DATE,
    gender TEXT,
    anonymized_subject_id TEXT UNIQUE NOT NULL DEFAULT ('ATH-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Coach Profiles
CREATE TABLE IF NOT EXISTS public.coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization TEXT DEFAULT 'Youth Athletic Development',
    experience_years INT DEFAULT 1,
    bio TEXT,
    organization TEXT,
    certifications TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 Coach-Athlete Relationships
CREATE TABLE IF NOT EXISTS public.coach_athlete_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);

-- =====================================================================
-- 2. EXERCISES, CATEGORIES & SESSIONS
-- =====================================================================

-- 2.0 Exercise Categories (17 Standard Muscle & Functional Categories)
CREATE TABLE IF NOT EXISTS public.exercise_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_name TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.exercise_categories (id, name, slug, description, icon_name, display_order)
VALUES
    (1, 'Chest', 'chest', 'Pectoralis major, minor, and anterior shoulder complex', 'Dumbbell', 1),
    (2, 'Back', 'back', 'Latissimus dorsi, rhomboids, and posterior kinetic chain', 'Shield', 2),
    (3, 'Shoulders', 'shoulders', 'Deltoids and scapular stabilizer muscle groups', 'Activity', 3),
    (4, 'Biceps', 'biceps', 'Biceps brachii, brachialis, and elbow flexors', 'Zap', 4),
    (5, 'Triceps', 'triceps', 'Triceps brachii and elbow extensors', 'Flame', 5),
    (6, 'Forearms', 'forearms', 'Wrist flexors, extensors, and grip strength', 'Target', 6),
    (7, 'Core', 'core', 'Rectus abdominis, obliques, and deep transverse stabilizers', 'Layers', 7),
    (8, 'Traps', 'traps', 'Upper, middle, and lower trapezius', 'ShieldCheck', 8),
    (9, 'Neck', 'neck', 'Cervical stabilizers and neck musculature', 'UserCheck', 9),
    (10, 'Glutes', 'glutes', 'Gluteus maximus, medius, and hip power generators', 'TrendingUp', 10),
    (11, 'Quadriceps', 'quadriceps', 'Anterior thigh and knee extensors', 'Award', 11),
    (12, 'Hamstrings', 'hamstrings', 'Posterior thigh and knee flexors', 'Repeat', 12),
    (13, 'Calves', 'calves', 'Gastrocnemius and soleus ankle complex', 'Gauge', 13),
    (14, 'Adductors', 'adductors', 'Medial thigh and hip adductor group', 'Crosshair', 14),
    (15, 'Full Body', 'full_body', 'Multi-joint full body athletic compound movements', 'Globe', 15),
    (16, 'Cardio', 'cardio', 'Cardiovascular endurance and high-velocity conditioning', 'Heart', 16),
    (17, 'Mobility', 'mobility', 'Joint mobility, thoracic range of motion, and tissue health', 'Compass', 17)
ON CONFLICT (slug) DO NOTHING;

-- 2.1 Exercises Catalog
CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.exercise_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    target_muscles TEXT NOT NULL,
    secondary_muscles TEXT,
    description TEXT NOT NULL,
    instructions TEXT,
    common_mistakes TEXT,
    difficulty TEXT DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    equipment TEXT DEFAULT 'Bodyweight',
    default_camera_angle TEXT DEFAULT 'Frontal (0 deg)',
    camera_setup_instructions TEXT NOT NULL,
    ideal_rom_degrees NUMERIC(5,2) DEFAULT 90.0,
    normative_cadence_seconds NUMERIC(4,2) DEFAULT 3.0,
    analysis_supported BOOLEAN DEFAULT FALSE,
    video_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Rich Exercise Library
INSERT INTO public.exercises (
    id, category_id, name, slug, target_muscles, secondary_muscles, description, instructions, common_mistakes, difficulty, equipment, default_camera_angle, camera_setup_instructions, ideal_rom_degrees, normative_cadence_seconds, analysis_supported
)
VALUES
    -- QUADRICEPS & LEGS (AI Supported)
    (1, 11, 'Barbell / Bodyweight Squat', 'squat', 'Quadriceps, Glutes, Core', 'Hamstrings, Calves', 'Lower-body foundational compound movement evaluating knee flexion depth, hip displacement, and spinal neutrality.', '1. Stand with feet shoulder-width apart, toes angled slightly outward.\n2. Inhale, brace your core, and initiate movement by hinging hips back.\n3. Descend under control until thighs reach parallel or below (>=90° knee angle).\n4. Drive through midfoot and heels back to standing lockout.', 'Knees caving inward (valgus collapse), shifting weight onto toes, rounding lower back, cut-off depth.', 'Intermediate', 'Bodyweight / Barbell', 'Side View (90 deg)', 'Position camera 2 to 3 meters away at hip/knee height with clear full-body visibility.', 90.0, 3.0, TRUE),
    
    -- CHEST (AI Supported)
    (2, 1, 'Standard Push-up', 'pushup', 'Pectoralis Major, Triceps Brachii, Anterior Deltoids', 'Core, Serratus Anterior', 'Upper-body horizontal pressing movement evaluating chest depth, elbow flare angle, and straight-line plank posture.', '1. Start in a high plank with hands slightly wider than shoulder-width.\n2. Maintain rigid head-to-heel alignment by squeezing glutes and brace core.\n3. Lower chest until 2-3 inches above the floor while keeping elbows angled at 45 degrees.\n4. Press back up powerfully to full arm extension.', 'Sagging hips/lumbar hyperextension, flaring elbows out 90 degrees, incomplete range of motion, crane neck forward.', 'Beginner', 'Bodyweight', 'Side View', 'Position camera 2 to 3 meters away at floor/shin height with side view showing full body from head to heels.', 90.0, 2.5, TRUE),

    -- BICEPS (AI Supported)
    (3, 4, 'Dumbbell Bicep Curl', 'bicep_curl', 'Biceps Brachii, Brachialis', 'Forearm Flexors, Anterior Deltoids', 'Isolated upper-limb flexion movement monitoring upper-arm stillness, elbow drift, and torso momentum compensation.', '1. Stand tall holding dumbbells at your sides with palms forward.\n2. Keep upper arms stationary against your ribcage.\n3. Curl dumbbells up toward shoulders while supinating wrists.\n4. Squeeze biceps at peak contraction and lower with 2-second eccentric control.', 'Swinging torso for momentum, elbows drifting forward or outward, dropping weights quickly without resistance.', 'Beginner', 'Dumbbells', 'Front or Side View', 'Position camera 2 to 3 meters away at chest height. Ensure upper arms and shoulders are in full view.', 120.0, 3.0, TRUE),

    -- SHOULDERS (AI Supported)
    (4, 3, 'Overhead Shoulder Press', 'shoulder_press', 'Deltoids (Anterior & Lateral), Triceps Brachii', 'Upper Trapezius, Core Stabilizers', 'Vertical overhead pressing movement evaluating overhead lockout, bilateral symmetry, and lumbar hyperextension.', '1. Stand or sit with dumbbells or barbell at shoulder height, palms forward.\n2. Engage core and glutes to lock ribcage down.\n3. Press weight directly upward in a straight bar path until arms are fully locked overhead.\n4. Lower smoothly back to chin level under control.', 'Arching lower back to push weight, pressing forward instead of overhead, asymmetrical press lockout.', 'Intermediate', 'Dumbbells / Barbell', 'Front View', 'Position camera 2.5 to 3.5 meters away at chest height. Ensure overhead arms reach is within frame.', 165.0, 3.0, TRUE),

    -- CHEST (Catalog)
    (5, 1, 'Barbell Bench Press', 'barbell_bench_press', 'Pectoralis Major, Anterior Deltoids, Triceps', 'Serratus Anterior', 'Primary upper body horizontal strength builder.', 'Lie on bench, grip bar slightly wider than shoulders, retract scapulae, lower bar to mid-chest, press up.', 'Flaring elbows at 90 degrees, bouncing bar off sternum.', 'Intermediate', 'Barbell', 'Side View', 'Position camera from 45 degree angle.', 90.0, 3.0, FALSE),
    (6, 1, 'Incline Dumbbell Press', 'incline_dumbbell_press', 'Clavicular Pectoralis, Anterior Deltoids', 'Triceps', 'Upper chest focus on a 30-45 degree incline bench.', 'Set bench to 30 degrees, press dumbbells upward converging slightly at top.', 'Setting incline too steep (>45 deg) which shifts load to front delts.', 'Intermediate', 'Dumbbells', 'Side View', 'Position camera side angle.', 90.0, 3.0, FALSE),
    (7, 1, 'Chest Dips', 'chest_dips', 'Lower Pectoralis, Triceps Brachii', 'Anterior Deltoids', 'Bodyweight compound pressing exercise for lower chest mass.', 'Grip parallel bars, lean torso forward 30 degrees, descend until shoulders below elbows, press up.', 'Staying upright (shifts load to triceps), dipping too deep with shoulder impingement.', 'Advanced', 'Parallel Bars', 'Side View', 'Side camera angle.', 90.0, 2.5, FALSE),

    -- BACK (Catalog)
    (8, 2, 'Pull-up', 'pull_up', 'Latissimus Dorsi, Teres Major, Biceps', 'Rhomboids, Lower Trapezius', 'The gold standard bodyweight vertical pulling movement.', 'Overhand grip wider than shoulders, initiate by pulling shoulder blades down, pull chest to bar.', 'Kicking legs for momentum (kipping), half-rep range of motion at bottom.', 'Advanced', 'Pull-up Bar', 'Back View', 'Position camera behind athlete.', 140.0, 3.0, FALSE),
    (9, 2, 'Barbell Bent-Over Row', 'barbell_bent_row', 'Latissimus Dorsi, Rhomboids, Mid Trapezius', 'Erector Spinae, Biceps', 'Fundamental horizontal pulling exercise for back thickness.', 'Hinge hips to 45 degrees with flat spine, pull bar to upper abdomen leading with elbows.', 'Rounding thoracic/lumbar spine, standing up too vertical.', 'Intermediate', 'Barbell', 'Side View', 'Position camera side angle.', 90.0, 3.0, FALSE),
    (10, 2, 'Lat Pulldown', 'lat_pulldown', 'Latissimus Dorsi, Teres Major', 'Biceps, Forearms', 'Controlled machine vertical pulling movement.', 'Grip bar wide, sit upright with thighs secured, pull bar to upper clavicle squeezing lats.', 'Leaning excessively back, pulling behind the neck.', 'Beginner', 'Cable Machine', 'Front/Side View', 'Position camera front-side.', 120.0, 3.0, FALSE),

    -- TRICEPS (Catalog)
    (11, 5, 'Cable Tricep Pushdown', 'tricep_pushdown', 'Triceps Brachii (Lateral & Medial heads)', 'Forearms', 'Isolated elbow extension for arm development.', 'Keep elbows pinned to sides, push cable attachment down until full extension, control ascent.', 'Letting elbows flare forward or swinging upper body.', 'Beginner', 'Cable Machine', 'Side View', 'Side camera view.', 110.0, 2.5, FALSE),
    (12, 5, 'Skull Crushers (Lying Tricep Extension)', 'skull_crushers', 'Triceps Brachii (Long head)', 'Forearms', 'Lying elbow extension emphasizing long-head stretch.', 'Lie flat, hold EZ bar with arms vertical, bend elbows lowering bar to forehead, extend arms.', 'Elbows flaring outward, moving upper arms back and forth.', 'Intermediate', 'EZ Bar', 'Side View', 'Side camera view.', 90.0, 3.0, FALSE),

    -- CORE (Catalog)
    (13, 7, 'Forearm Plank', 'forearm_plank', 'Rectus Abdominis, Transverse Abdominis', 'Glutes, Shoulders', 'Isometric anti-extension core stability benchmark.', 'Rest on forearms and toes, align ears, shoulders, hips, knees, and ankles in one straight line.', 'Sagging hips into anterior pelvic tilt, pike hips in air.', 'Beginner', 'Bodyweight', 'Side View', 'Position camera side profile at floor height.', 180.0, 45.0, FALSE),
    (14, 7, 'Hanging Leg Raise', 'hanging_leg_raise', 'Rectus Abdominis, Hip Flexors', 'Grip, Lats', 'Advanced dynamic abdominal flexion exercise.', 'Hang from bar, contract abs and lift legs up to 90 degrees without swinging.', 'Using hip swing momentum rather than ab contraction.', 'Advanced', 'Pull-up Bar', 'Side View', 'Side camera view.', 90.0, 3.0, FALSE),

    -- GLUTES & HAMSTRINGS (Catalog)
    (15, 10, 'Barbell Hip Thrust', 'hip_thrust', 'Gluteus Maximus', 'Hamstrings, Quadriceps, Core', 'High-load glute hypertrophy and hip extension movement.', 'Sit on floor with upper back against bench, place barbell over hips, drive hips up until parallel with floor.', 'Hyperextending lumbar spine at top instead of posterior pelvic tilt.', 'Intermediate', 'Barbell & Bench', 'Side View', 'Side camera view.', 180.0, 3.0, FALSE),
    (16, 12, 'Romanian Deadlift (RDL)', 'romanian_deadlift', 'Hamstrings, Gluteus Maximus', 'Erector Spinae, Traps', 'Essential hip hinge movement for posterior chain strength.', 'Hold barbell with slight knee bend, hinge hips backward keeping bar close to shins, squeeze glutes to return.', 'Rounding lumbar spine, bending knees excessively into a squat.', 'Intermediate', 'Barbell / Dumbbells', 'Side View', 'Side camera view showing hip hinge.', 80.0, 3.5, FALSE),

    -- CALVES & FOREARMS (Catalog)
    (17, 13, 'Standing Calf Raise', 'standing_calf_raise', 'Gastrocnemius, Soleus', 'Foot intrinsic muscles', 'Ankle plantarflexion for lower leg resilience.', 'Stand on edge of step, lower heels below step level for deep stretch, rise onto balls of feet.', 'Bouncing rapidly without pausing at top contraction.', 'Beginner', 'Step / Machine', 'Side View', 'Side camera view of lower leg.', 45.0, 2.5, FALSE),
    (18, 6, 'Farmer Carry', 'farmer_carry', 'Forearm Flexors, Grip, Trapezius', 'Core Stabilizers, Calves', 'Functional loaded carry testing whole-body postural endurance.', 'Hold heavy dumbbells at sides, stand tall, walk in straight line with upright posture.', 'Slouching shoulders forward, wobbling side to side.', 'Beginner', 'Dumbbells / Trap Bar', 'Side View', 'Full body tracking.', 180.0, 30.0, FALSE),

    -- FULL BODY & CARDIO (Catalog)
    (19, 15, 'Burpee', 'burpee', 'Full Body (Chest, Core, Quads, Deltoids)', 'Cardiovascular System', 'High-intensity athletic conditioning movement.', 'Drop into squat, kick feet back into push-up, perform push-up, jump feet forward, jump up with hands overhead.', 'Collapsing lower back during plank landing, skipping full jump.', 'Intermediate', 'Bodyweight', 'Side View', 'Side camera view.', 90.0, 2.0, FALSE),
    (20, 16, 'Jumping Jacks', 'jumping_jacks', 'Cardiovascular System, Calves, Deltoids', 'Adductors, Abductors', 'Rhythmic full-body warm-up and conditioning drill.', 'Jump feet wide while raising arms overhead, jump back to starting position in continuous rhythm.', 'Landing hard on flat feet instead of springy balls of feet.', 'Beginner', 'Bodyweight', 'Front View', 'Front camera view.', 180.0, 1.5, FALSE),

    -- MOBILITY (Catalog)
    (21, 17, 'World Greatest Stretch', 'worlds_greatest_stretch', 'Thoracic Spine, Hip Flexors, Hamstrings', 'Glutes, Ankles', 'Multi-planar full body mobility dynamic sequence.', 'Step forward into deep lunge, place inside elbow to instep, rotate arm and chest toward sky.', 'Rushing through positions without deep breathing.', 'Beginner', 'Bodyweight', 'Side View', 'Side camera view.', 90.0, 5.0, FALSE)
ON CONFLICT (slug) DO NOTHING;

-- 2.2 Workouts / Assigned Programs
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES public.exercises(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_sets INT DEFAULT 3,
    target_reps INT DEFAULT 10,
    target_tempo TEXT DEFAULT '3-1-2',
    target_rom NUMERIC(5,2) DEFAULT 90.0,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Workout Sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    session_type TEXT DEFAULT 'LIVE_CAMERA' CHECK (session_type IN ('LIVE_CAMERA', 'VIDEO_UPLOAD')),
    video_url TEXT,
    duration_seconds NUMERIC(8,2) DEFAULT 0.0,
    total_reps INT DEFAULT 0,
    valid_reps INT DEFAULT 0,
    overall_score NUMERIC(5,2) DEFAULT 0.0,
    alignment_score NUMERIC(5,2) DEFAULT 0.0,
    rom_score NUMERIC(5,2) DEFAULT 0.0,
    symmetry_score NUMERIC(5,2) DEFAULT 0.0,
    tempo_score NUMERIC(5,2) DEFAULT 0.0,
    stability_score NUMERIC(5,2) DEFAULT 0.0,
    model_version TEXT DEFAULT 'sportx-ml-v1.0',
    feedback_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Exercise Sessions (Sets within a workout session)
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    set_number INT DEFAULT 1,
    target_reps INT DEFAULT 10,
    completed_reps INT DEFAULT 0,
    average_score NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Repetitions (Granular rep-by-rep kinematic telemetry)
CREATE TABLE IF NOT EXISTS public.repetitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
    rep_number INT NOT NULL,
    start_time NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    end_time NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    duration_seconds NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    rep_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    alignment_score NUMERIC(5,2) DEFAULT 0.0,
    rom_score NUMERIC(5,2) DEFAULT 0.0,
    symmetry_score NUMERIC(5,2) DEFAULT 0.0,
    tempo_score NUMERIC(5,2) DEFAULT 0.0,
    stability_score NUMERIC(5,2) DEFAULT 0.0,
    peak_angle NUMERIC(5,2) DEFAULT 0.0,
    min_angle NUMERIC(5,2) DEFAULT 0.0,
    is_valid BOOLEAN DEFAULT TRUE,
    phase_durations JSONB,
    detected_errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3. AI ANALYSIS & TECHNIQUE LOGGING
-- =====================================================================

-- 3.1 Technique Analysis Records
CREATE TABLE IF NOT EXISTS public.technique_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE SET NULL,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    model_name TEXT NOT NULL DEFAULT 'SportX Gradient Boosting',
    model_version TEXT NOT NULL DEFAULT 'sportx-ml-v1.0',
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    confidence NUMERIC(4,3) DEFAULT 0.95,
    range_of_motion NUMERIC(5,2),
    symmetry NUMERIC(4,3),
    tempo NUMERIC(4,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Technique Issues (Biomechanical error detections)
CREATE TABLE IF NOT EXISTS public.technique_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.technique_analysis(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    error_code TEXT NOT NULL,
    error_name TEXT NOT NULL,
    issue_type TEXT DEFAULT 'BIOMECHANICAL_DEVIATION',
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'mild', 'moderate', 'high', 'severe', 'critical')),
    confidence NUMERIC(4,3) DEFAULT 0.90,
    description TEXT NOT NULL,
    corrective_instruction TEXT NOT NULL,
    timestamp NUMERIC(8,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Technique Scores (Sub-metric kinematic aggregates)
CREATE TABLE IF NOT EXISTS public.technique_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    score_value NUMERIC(5,2) NOT NULL,
    benchmark_target NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 4. HOLISTIC TRACKING & GOALS
-- =====================================================================

-- 4.1 Goals
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC(8,2) NOT NULL DEFAULT 100.0,
    current_value NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    unit TEXT NOT NULL DEFAULT '%',
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Sleep Records
CREATE TABLE IF NOT EXISTS public.sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    sleep_date DATE NOT NULL,
    bedtime TEXT,
    wake_time TEXT,
    duration_minutes INT DEFAULT 480,
    total_sleep_minutes INT DEFAULT 480,
    quality NUMERIC(5,2) DEFAULT 80.0,
    sleep_quality_score NUMERIC(5,2) DEFAULT 80.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, sleep_date)
);

-- 4.3 Nutrition Records
CREATE TABLE IF NOT EXISTS public.nutrition_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT DEFAULT 'LUNCH' CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    description TEXT NOT NULL DEFAULT '',
    meal_description TEXT NOT NULL DEFAULT '',
    protein NUMERIC(5,1) DEFAULT 30.0,
    protein_g NUMERIC(5,1) DEFAULT 30.0,
    carbohydrates NUMERIC(5,1) DEFAULT 60.0,
    carbs_g NUMERIC(5,1) DEFAULT 60.0,
    fat NUMERIC(5,1) DEFAULT 20.0,
    fats_g NUMERIC(5,1) DEFAULT 20.0,
    calories INT DEFAULT 600,
    water_ml NUMERIC(6,1) DEFAULT 500.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 Recovery Records
CREATE TABLE IF NOT EXISTS public.recovery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    soreness INT DEFAULT 3 CHECK (soreness BETWEEN 1 AND 10),
    soreness_level INT DEFAULT 3 CHECK (soreness_level BETWEEN 1 AND 10),
    fatigue INT DEFAULT 3 CHECK (fatigue BETWEEN 1 AND 10),
    fatigue_level INT DEFAULT 3 CHECK (fatigue_level BETWEEN 1 AND 10),
    sleep_quality NUMERIC(5,2) DEFAULT 80.0,
    training_load NUMERIC(5,2) DEFAULT 50.0,
    training_load_estimate NUMERIC(5,2) DEFAULT 50.0,
    readiness_score NUMERIC(5,2) DEFAULT 85.0,
    calculated_readiness_score NUMERIC(5,2) DEFAULT 85.0,
    stress_level INT DEFAULT 2 CHECK (stress_level BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, date)
);

-- 4.5 Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'TECHNIQUE_ALERT',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ALERT')),
    read BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'TECHNIQUE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.6 Coach Comments
CREATE TABLE IF NOT EXISTS public.coach_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 5. RESEARCH & MACHINE LEARNING BENCHMARK REGISTRY
-- =====================================================================

-- 5.1 Model Versions
CREATE TABLE IF NOT EXISTS public.model_versions (
    id SERIAL PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    version TEXT NOT NULL,
    version_tag TEXT UNIQUE NOT NULL,
    description TEXT,
    dataset TEXT DEFAULT 'Kaggle 3D Pose Landmarks',
    feature_version TEXT DEFAULT 'pose-kinematics-v1.0',
    accuracy NUMERIC(5,4),
    precision NUMERIC(5,4),
    recall NUMERIC(5,4),
    f1_score NUMERIC(5,4),
    test_accuracy NUMERIC(5,4),
    test_f1 NUMERIC(5,4),
    latency_fps NUMERIC(6,1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 Analysis Results (Formal evaluation benchmarks)
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id INT REFERENCES public.model_versions(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    sample_count INT DEFAULT 0,
    accuracy NUMERIC(5,4),
    f1_score NUMERIC(5,4),
    precision NUMERIC(5,4),
    recall NUMERIC(5,4),
    confusion_matrix JSONB,
    latency_ms NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 6. DATABASE FUNCTIONS & AUTOMATIC TRIGGERS
-- =====================================================================

-- 6.1 Function to automatically update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_athlete_profiles_updated_at ON public.athlete_profiles;
CREATE TRIGGER set_athlete_profiles_updated_at BEFORE UPDATE ON public.athlete_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_coach_profiles_updated_at ON public.coach_profiles;
CREATE TRIGGER set_coach_profiles_updated_at BEFORE UPDATE ON public.coach_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_relationships_updated_at ON public.coach_athlete_relationships;
CREATE TRIGGER set_relationships_updated_at BEFORE UPDATE ON public.coach_athlete_relationships FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_goals_updated_at ON public.goals;
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6.2 Trigger on auth.users to auto-create public.profiles & role profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
    -- Sanitize role
    IF user_role NOT IN ('athlete', 'coach') THEN
        user_role := 'athlete';
    END IF;

    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Athlete');

    -- Insert Base Profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    -- Insert Role Specific Profile
    IF user_role = 'athlete' THEN
        INSERT INTO public.athlete_profiles (user_id, sport, training_level, anonymized_subject_id)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'sport', 'General Fitness'),
            COALESCE(NEW.raw_user_meta_data->>'training_level', 'Intermediate'),
            'ATH-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))
        )
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF user_role = 'coach' THEN
        INSERT INTO public.coach_profiles (user_id, specialization, experience_years)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'specialization', 'Youth Athletic Development'),
            COALESCE((NEW.raw_user_meta_data->>'experience_years')::INT, 1)
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 7. SUPABASE STORAGE SETUP FOR AVATARS
-- =====================================================================

-- Create avatars storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Storage RLS Policies
CREATE POLICY "Public Read Avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athlete_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repetitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- 8.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Coaches can view connected athlete profiles" ON public.profiles;
CREATE POLICY "Coaches can view connected athlete profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            JOIN public.athlete_profiles ap ON ap.id = car.athlete_id
            WHERE cp.user_id = auth.uid()
            AND ap.user_id = public.profiles.id
            AND car.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 8.2 ATHLETE PROFILES POLICIES
DROP POLICY IF EXISTS "Athletes can manage own athlete profile" ON public.athlete_profiles;
CREATE POLICY "Athletes can manage own athlete profile" ON public.athlete_profiles
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view supervised athlete profiles" ON public.athlete_profiles;
CREATE POLICY "Coaches can view supervised athlete profiles" ON public.athlete_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.athlete_profiles.id
            AND car.status = 'active'
        )
    );

-- 8.3 COACH PROFILES POLICIES
DROP POLICY IF EXISTS "Coaches can manage own coach profile" ON public.coach_profiles;
CREATE POLICY "Coaches can manage own coach profile" ON public.coach_profiles
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes can view their connected coach profiles" ON public.coach_profiles;
CREATE POLICY "Athletes can view their connected coach profiles" ON public.coach_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            JOIN public.coach_athlete_relationships car ON car.athlete_id = ap.id
            WHERE ap.user_id = auth.uid()
            AND car.coach_id = public.coach_profiles.id
            AND car.status = 'active'
        )
    );

-- 8.4 COACH-ATHLETE RELATIONSHIPS POLICIES
DROP POLICY IF EXISTS "Coaches manage their relationships" ON public.coach_athlete_relationships;
CREATE POLICY "Coaches manage their relationships" ON public.coach_athlete_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            WHERE cp.id = public.coach_athlete_relationships.coach_id
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes view their coach relationships" ON public.coach_athlete_relationships;
CREATE POLICY "Athletes view their coach relationships" ON public.coach_athlete_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.coach_athlete_relationships.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8.5 EXERCISES & MODEL VERSIONS (Read-only catalog for authenticated users)
DROP POLICY IF EXISTS "Authenticated users view exercises" ON public.exercises;
CREATE POLICY "Authenticated users view exercises" ON public.exercises
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users view model versions" ON public.model_versions;
CREATE POLICY "Authenticated users view model versions" ON public.model_versions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users view analysis results" ON public.analysis_results;
CREATE POLICY "Authenticated users view analysis results" ON public.analysis_results
    FOR SELECT USING (auth.role() = 'authenticated');

-- 8.6 WORKOUTS (Assigned Programs)
DROP POLICY IF EXISTS "Athletes view their workouts" ON public.workouts;
CREATE POLICY "Athletes view their workouts" ON public.workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workouts.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes update completion on their workouts" ON public.workouts;
CREATE POLICY "Athletes update completion on their workouts" ON public.workouts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workouts.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Coaches manage assigned workouts" ON public.workouts;
CREATE POLICY "Coaches manage assigned workouts" ON public.workouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            WHERE cp.id = public.workouts.coach_id
            AND cp.user_id = auth.uid()
        )
    );

-- 8.7 WORKOUT SESSIONS & EXERCISE SESSIONS
DROP POLICY IF EXISTS "Athletes manage their workout sessions" ON public.workout_sessions;
CREATE POLICY "Athletes manage their workout sessions" ON public.workout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workout_sessions.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Coaches view supervised workout sessions" ON public.workout_sessions;
CREATE POLICY "Coaches view supervised workout sessions" ON public.workout_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.workout_sessions.athlete_id
            AND car.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Athletes manage exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Athletes manage exercise sessions" ON public.exercise_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.exercise_sessions.workout_session_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8.8 REPETITIONS
DROP POLICY IF EXISTS "Athletes manage repetitions" ON public.repetitions;
CREATE POLICY "Athletes manage repetitions" ON public.repetitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.repetitions.session_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Coaches view supervised repetitions" ON public.repetitions;
CREATE POLICY "Coaches view supervised repetitions" ON public.repetitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            JOIN public.workout_sessions ws ON ws.athlete_id = car.athlete_id
            WHERE cp.user_id = auth.uid()
            AND ws.id = public.repetitions.session_id
            AND car.status = 'active'
        )
    );

-- 8.9 TECHNIQUE ANALYSIS & TECHNIQUE ISSUES & SCORES
DROP POLICY IF EXISTS "Athletes manage technique analysis" ON public.technique_analysis;
CREATE POLICY "Athletes manage technique analysis" ON public.technique_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.technique_analysis.session_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage technique issues" ON public.technique_issues;
CREATE POLICY "Athletes manage technique issues" ON public.technique_issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.technique_issues.session_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage technique scores" ON public.technique_scores;
CREATE POLICY "Athletes manage technique scores" ON public.technique_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.technique_scores.session_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8.10 GOALS, SLEEP, NUTRITION, RECOVERY (Private to Athlete)
DROP POLICY IF EXISTS "Athletes manage goals" ON public.goals;
CREATE POLICY "Athletes manage goals" ON public.goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.goals.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage sleep records" ON public.sleep_records;
CREATE POLICY "Athletes manage sleep records" ON public.sleep_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.sleep_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage nutrition records" ON public.nutrition_records;
CREATE POLICY "Athletes manage nutrition records" ON public.nutrition_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.nutrition_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage recovery records" ON public.recovery_records;
CREATE POLICY "Athletes manage recovery records" ON public.recovery_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.recovery_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8.11 NOTIFICATIONS
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- 8.12 COACH COMMENTS
DROP POLICY IF EXISTS "Coaches manage comments for supervised athletes" ON public.coach_comments;
CREATE POLICY "Coaches manage comments for supervised athletes" ON public.coach_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.coach_comments.athlete_id
            AND car.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Athletes view comments on their sessions" ON public.coach_comments;
CREATE POLICY "Athletes view comments on their sessions" ON public.coach_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.coach_comments.athlete_id
            AND ap.user_id = auth.uid()
        )
    );
