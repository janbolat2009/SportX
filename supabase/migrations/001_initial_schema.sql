-- ==============================================================================
-- SPORTX PRODUCTION DATABASE SCHEMA & INITIAL MIGRATION
-- File: supabase/migrations/001_initial_schema.sql
-- Description: Complete schema for SportX AI Fitness & Biomechanics Platform.
-- Covers: auth integration, profiles, athlete_profiles, coach_profiles, exercises,
-- workout_sessions, exercise_sessions, repetitions, technique_analysis, technique_issues,
-- sleep_records, nutrition_records, recovery_records, goals, notifications,
-- AI conversations, AI messages, RLS policies, and triggers.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USER PROFILES TABLE (Core Account Info)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'researcher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 2. ATHLETE PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    date_of_birth DATE,
    gender TEXT,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    sport TEXT DEFAULT 'General Fitness',
    training_level TEXT DEFAULT 'Intermediate',
    fitness_goals TEXT,
    anonymized_subject_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user ON public.athlete_profiles(user_id);

-- ==============================================================================
-- 3. COACH PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    organization TEXT,
    specialization TEXT,
    experience_years INT DEFAULT 1,
    bio TEXT,
    certifications TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. COACH-ATHLETE RELATIONSHIPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coach_athlete_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);

-- ==============================================================================
-- 5. EXERCISE CATEGORIES & EXERCISES CATALOG
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.exercise_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    target_muscle TEXT NOT NULL,
    secondary_muscles TEXT,
    equipment TEXT DEFAULT 'Bodyweight',
    difficulty TEXT DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    description TEXT NOT NULL,
    instructions TEXT,
    common_mistakes TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    analysis_config JSONB DEFAULT '{}'::jsonb,
    default_camera_angle TEXT DEFAULT 'Side View (90 deg)',
    camera_setup_instructions TEXT DEFAULT 'Position camera 2 to 3 meters away at hip height.',
    ideal_rom_degrees NUMERIC(5, 2) DEFAULT 90.0,
    normative_cadence_seconds NUMERIC(4, 2) DEFAULT 3.0,
    analysis_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_slug ON public.exercises(slug);

-- ==============================================================================
-- 6. WORKOUTS (COACH TRAINING PROGRAMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL,
    athlete_id UUID REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
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

-- ==============================================================================
-- 7. WORKOUT SESSIONS (LIVE FEED / UPLOADS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES public.exercises(id) ON DELETE SET NULL,
    session_type TEXT DEFAULT 'LIVE_CAMERA' CHECK (session_type IN ('LIVE_CAMERA', 'VIDEO_UPLOAD')),
    video_url TEXT,
    duration_seconds NUMERIC(8, 2) DEFAULT 0.0,
    total_reps INT DEFAULT 0,
    valid_reps INT DEFAULT 0,
    overall_score NUMERIC(5, 2) DEFAULT 0.0,
    alignment_score NUMERIC(5, 2) DEFAULT 0.0,
    rom_score NUMERIC(5, 2) DEFAULT 0.0,
    symmetry_score NUMERIC(5, 2) DEFAULT 0.0,
    tempo_score NUMERIC(5, 2) DEFAULT 0.0,
    stability_score NUMERIC(5, 2) DEFAULT 0.0,
    model_version TEXT DEFAULT 'sportx-ml-v1.0',
    feedback_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_athlete ON public.workout_sessions(athlete_id);

-- ==============================================================================
-- 8. EXERCISE SESSIONS
-- ==============================================================================
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

-- ==============================================================================
-- 9. REPETITIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.repetitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    rep_number INT NOT NULL,
    start_time NUMERIC(8,2) NOT NULL,
    end_time NUMERIC(8,2) NOT NULL,
    duration_seconds NUMERIC(6,2) NOT NULL,
    rep_score NUMERIC(5,2) NOT NULL,
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

-- ==============================================================================
-- 10. TECHNIQUE ANALYSIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.technique_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 0.95,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. TECHNIQUE ISSUES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.technique_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE CASCADE,
    error_code TEXT NOT NULL,
    error_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'critical')),
    confidence NUMERIC(4,3) DEFAULT 0.90,
    description TEXT NOT NULL,
    corrective_instruction TEXT NOT NULL,
    timestamp NUMERIC(8,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. TECHNIQUE SCORES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.technique_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    score_value NUMERIC(5,2) NOT NULL,
    benchmark_target NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. MEAL LOGS (Used in NutritionView)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL,
    food_name TEXT,
    description TEXT NOT NULL,
    amount_grams NUMERIC(7, 2) DEFAULT 100.0,
    calories NUMERIC(7, 2) DEFAULT 0.0,
    protein NUMERIC(6, 2) DEFAULT 0.0,
    carbohydrates NUMERIC(6, 2) DEFAULT 0.0,
    fat NUMERIC(6, 2) DEFAULT 0.0,
    fiber NUMERIC(6, 2) DEFAULT 0.0,
    estimated BOOLEAN DEFAULT FALSE,
    model_version TEXT DEFAULT 'sportx-nutrition-v2.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user ON public.meal_logs(user_id);

-- ==============================================================================
-- 14. NUTRITION RECORDS (Dashboard & Progress Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT DEFAULT 'LUNCH' CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    meal_description TEXT NOT NULL,
    calories INT DEFAULT 600,
    protein_g NUMERIC(5,1) DEFAULT 30.0,
    carbs_g NUMERIC(5,1) DEFAULT 60.0,
    fats_g NUMERIC(5,1) DEFAULT 20.0,
    water_ml NUMERIC(6,1) DEFAULT 500.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. SLEEP RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    sleep_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bedtime TEXT,
    wake_time TEXT,
    duration_minutes INT DEFAULT 480,
    quality_rating INT DEFAULT 4,
    awakenings_count INT DEFAULT 0,
    morning_feeling TEXT DEFAULT 'refreshed',
    insights_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 16. RECOVERY RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    soreness_level INT DEFAULT 3 CHECK (soreness_level BETWEEN 1 AND 10),
    fatigue_level INT DEFAULT 3 CHECK (fatigue_level BETWEEN 1 AND 10),
    stress_level INT DEFAULT 2 CHECK (stress_level BETWEEN 1 AND 10),
    calculated_readiness_score NUMERIC(5,2) DEFAULT 85.0,
    training_load_estimate NUMERIC(5,2) DEFAULT 50.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

-- ==============================================================================
-- 17. GOALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_metric TEXT NOT NULL,
    target_value NUMERIC(8, 2) NOT NULL,
    current_value NUMERIC(8, 2) DEFAULT 0.0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 18. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ALERT')),
    is_read BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'TECHNIQUE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 19. COACH COMMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coach_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 20. AI CONVERSATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 21. AI MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 22. AUTOMATIC PROFILE CREATION TRIGGER (AUTH.USERS -> PUBLIC.PROFILES)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    new_athlete_id UUID;
BEGIN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
    IF assigned_role NOT IN ('athlete', 'coach', 'researcher', 'admin') THEN
        assigned_role := 'athlete';
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        assigned_role,
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Automatically create Athlete Profile if role is athlete
    IF assigned_role = 'athlete' THEN
        INSERT INTO public.athlete_profiles (
            id,
            user_id,
            sport,
            training_level,
            anonymized_subject_id,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id, -- Use identical UUID for seamless join
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'sport', 'General Fitness'),
            COALESCE(NEW.raw_user_meta_data->>'training_level', 'Intermediate'),
            'SUBJ-' || substring(NEW.id::text from 1 for 8),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Automatically create Coach Profile if role is coach
    IF assigned_role = 'coach' THEN
        INSERT INTO public.coach_profiles (
            id,
            user_id,
            experience_years,
            created_at
        )
        VALUES (
            NEW.id,
            NEW.id,
            1,
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to ensure idempotence
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_athlete_profiles_modtime ON public.athlete_profiles;
CREATE TRIGGER update_athlete_profiles_modtime
    BEFORE UPDATE ON public.athlete_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_conversations_modtime ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_modtime
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 23. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athlete_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repetitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Exercises (Public View)
DROP POLICY IF EXISTS "Anyone can view exercise categories" ON public.exercise_categories;
DROP POLICY IF EXISTS "Anyone can view exercise categories" ON exercise_categories;
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (true);

-- 3. Athlete Profiles
DROP POLICY IF EXISTS "Athletes view own profile" ON public.athlete_profiles;
DROP POLICY IF EXISTS "Athletes view own profile" ON athlete_profiles;
CREATE POLICY "Athletes view own profile" ON public.athlete_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 4. Workout Sessions Policies
DROP POLICY IF EXISTS "Athletes manage own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Athletes manage own sessions" ON workout_sessions;
CREATE POLICY "Athletes manage own sessions" ON public.workout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workout_sessions.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 5. Sleep & Nutrition & Recovery
DROP POLICY IF EXISTS "Athletes manage sleep" ON public.sleep_records;
DROP POLICY IF EXISTS "Athletes manage sleep" ON sleep_records;
CREATE POLICY "Athletes manage sleep" ON public.sleep_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.sleep_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage nutrition" ON public.nutrition_records;
DROP POLICY IF EXISTS "Athletes manage nutrition" ON nutrition_records;
CREATE POLICY "Athletes manage nutrition" ON public.nutrition_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.nutrition_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Athletes manage recovery" ON public.recovery_records;
DROP POLICY IF EXISTS "Athletes manage recovery" ON recovery_records;
CREATE POLICY "Athletes manage recovery" ON public.recovery_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.recovery_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 6. Meal Logs Policies
DROP POLICY IF EXISTS "Users can manage own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can manage own meal logs" ON meal_logs;
CREATE POLICY "Users can manage own meal logs" ON public.meal_logs
    FOR ALL USING (auth.uid() = user_id);

-- 7. Goals Policies
DROP POLICY IF EXISTS "Athletes manage goals" ON public.goals;
DROP POLICY IF EXISTS "Athletes manage goals" ON goals;
CREATE POLICY "Athletes manage goals" ON public.goals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.goals.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8. Notifications
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users access own notifications" ON notifications;
CREATE POLICY "Users access own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- 9. AI Conversations & Messages
DROP POLICY IF EXISTS "Users manage own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users manage own conversations" ON ai_conversations;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users manage own messages" ON ai_messages;
CREATE POLICY "Users manage own messages" ON public.ai_messages
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 24. SEED EXERCISE CATEGORIES
-- ==============================================================================
INSERT INTO public.exercise_categories (id, name, slug, icon, display_order)
VALUES
    (1, 'Chest', 'chest', 'Dumbbell', 1),
    (2, 'Back', 'back', 'Activity', 2),
    (3, 'Shoulders', 'shoulders', 'Flame', 3),
    (4, 'Biceps', 'biceps', 'Dumbbell', 4),
    (5, 'Triceps', 'triceps', 'Dumbbell', 5),
    (6, 'Forearms', 'forearms', 'Activity', 6),
    (7, 'Core', 'core', 'Shield', 7),
    (8, 'Traps', 'traps', 'Flame', 8),
    (9, 'Neck', 'neck', 'Activity', 9),
    (10, 'Glutes', 'glutes', 'Activity', 10),
    (11, 'Quadriceps', 'quadriceps', 'TrendingUp', 11),
    (12, 'Hamstrings', 'hamstrings', 'TrendingUp', 12),
    (13, 'Calves', 'calves', 'Activity', 13),
    (14, 'Adductors', 'adductors', 'Activity', 14),
    (15, 'Full Body', 'full_body', 'Flame', 15),
    (16, 'Cardio', 'cardio', 'Activity', 16),
    (17, 'Mobility', 'mobility', 'Shield', 17)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO public.exercises (
    id, category_id, name, slug, category, target_muscle, secondary_muscles, description, instructions, common_mistakes, difficulty, equipment, default_camera_angle, camera_setup_instructions, ideal_rom_degrees, normative_cadence_seconds, analysis_available
)
VALUES
    (1, 11, 'Barbell / Bodyweight Squat', 'squat', 'Quadriceps', 'Quadriceps, Glutes, Core', 'Hamstrings, Calves', 'Lower-body foundational compound movement evaluating knee flexion depth, hip displacement, and spinal neutrality.', '1. Stand with feet shoulder-width apart, toes angled slightly outward.\n2. Inhale, brace your core, and initiate movement by hinging hips back.\n3. Descend under control until thighs reach parallel or below (>=90° knee angle).\n4. Drive through midfoot and heels back to standing lockout.', 'Knees caving inward (valgus collapse), shifting weight onto toes, rounding lower back, cut-off depth.', 'Intermediate', 'Bodyweight / Barbell', 'Side View (90 deg)', 'Position camera 2 to 3 meters away at hip/knee height with clear full-body visibility.', 90.0, 3.0, TRUE),
    (2, 1, 'Standard Push-up', 'pushup', 'Chest', 'Pectoralis Major, Triceps Brachii, Anterior Deltoids', 'Core, Serratus Anterior', 'Upper-body horizontal pressing movement evaluating chest depth, elbow flare angle, and straight-line plank posture.', '1. Start in a high plank with hands slightly wider than shoulder-width.\n2. Maintain rigid head-to-heel alignment by squeezing glutes and brace core.\n3. Lower chest until 2-3 inches above the floor while keeping elbows angled at 45 degrees.\n4. Press back up powerfully to full arm extension.', 'Sagging hips/lumbar hyperextension, flaring elbows out 90 degrees, incomplete range of motion, crane neck forward.', 'Beginner', 'Bodyweight', 'Side View', 'Position camera 2 to 3 meters away at floor/shin height with side view showing full body from head to heels.', 90.0, 2.5, TRUE),
    (3, 4, 'Dumbbell Bicep Curl', 'bicep_curl', 'Biceps', 'Biceps Brachii, Brachialis', 'Forearm Flexors, Anterior Deltoids', 'Isolated upper-limb flexion movement monitoring upper-arm stillness, elbow drift, and torso momentum compensation.', '1. Stand tall holding dumbbells at your sides with palms forward.\n2. Keep upper arms stationary against your ribcage.\n3. Curl dumbbells up toward shoulders while supinating wrists.\n4. Squeeze biceps at peak contraction and lower with 2-second eccentric control.', 'Swinging torso for momentum, elbows drifting forward or outward, dropping weights quickly without resistance.', 'Beginner', 'Dumbbells', 'Front or Side View', 'Position camera 2 to 3 meters away at chest height. Ensure upper arms and shoulders are in full view.', 120.0, 3.0, TRUE),
    (4, 3, 'Overhead Shoulder Press', 'shoulder_press', 'Shoulders', 'Deltoids (Anterior & Lateral), Triceps Brachii', 'Upper Trapezius, Core Stabilizers', 'Vertical overhead pressing movement evaluating overhead lockout, bilateral symmetry, and lumbar hyperextension.', '1. Stand or sit with dumbbells or barbell at shoulder height, palms forward.\n2. Engage core and glutes to lock ribcage down.\n3. Press weight directly upward in a straight bar path until arms are fully locked overhead.\n4. Lower smoothly back to chin level under control.', 'Arching lower back to push weight, pressing forward instead of overhead, asymmetrical press lockout.', 'Intermediate', 'Dumbbells / Barbell', 'Front View', 'Position camera 2.5 to 3.5 meters away at chest height. Ensure overhead arms reach is within frame.', 165.0, 3.0, TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
