-- ==============================================================================
-- SPORTX PRODUCTION DATABASE SCHEMA & INITIAL MIGRATION
-- File: supabase/migrations/001_initial_schema.sql
-- Description: Complete schema for SportX AI Fitness & Biomechanics Platform.
-- Covers: auth integration, profiles, exercises (17 categories), workout sessions,
-- exercise sessions, technique analysis, technique issues, meal logs, sleep records,
-- goals, notifications, AI conversations, AI messages, RLS policies, and triggers.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USER PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin')),
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height NUMERIC(5, 2), -- Height in cm
    weight NUMERIC(5, 2), -- Weight in kg
    fitness_goal TEXT DEFAULT 'Strength & Technique',
    sport TEXT DEFAULT 'General Fitness',
    training_level TEXT DEFAULT 'Intermediate' CHECK (training_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    specialization TEXT,
    experience_years INT DEFAULT 1,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================================
-- 2. EXERCISE CATEGORIES & EXERCISES CATALOG
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
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category_id);

-- ==============================================================================
-- 3. WORKOUT SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds NUMERIC(8, 2) DEFAULT 0.0,
    total_exercises INT DEFAULT 0,
    total_repetitions INT DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON public.workout_sessions(user_id, created_at DESC);

-- ==============================================================================
-- 4. EXERCISE SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES public.exercises(id) ON DELETE SET NULL,
    repetitions INT DEFAULT 0,
    sets INT DEFAULT 1,
    duration_seconds NUMERIC(8, 2) DEFAULT 0.0,
    average_technique_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_workout ON public.exercise_sessions(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user ON public.exercise_sessions(user_id);

-- ==============================================================================
-- 5. TECHNIQUE ANALYSIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.technique_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES public.exercises(id) ON DELETE SET NULL,
    technique_score NUMERIC(5, 2) DEFAULT 0.0,
    rep_count INT DEFAULT 0,
    symmetry_score NUMERIC(5, 2) DEFAULT 0.0,
    range_of_motion_score NUMERIC(5, 2) DEFAULT 0.0,
    confidence NUMERIC(4, 3) DEFAULT 1.0,
    model_version TEXT DEFAULT 'sportx-pose-v1.0',
    analysis_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technique_analysis_user ON public.technique_analysis(user_id, created_at DESC);

-- ==============================================================================
-- 6. TECHNIQUE ISSUES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.technique_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.technique_analysis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    severity TEXT DEFAULT 'MODERATE' CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    metric TEXT,
    value NUMERIC(6, 2),
    threshold NUMERIC(6, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technique_issues_analysis ON public.technique_issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_technique_issues_user ON public.technique_issues(user_id);

-- ==============================================================================
-- 7. MEAL LOGS
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

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, created_at DESC);

-- ==============================================================================
-- 8. SLEEP RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sleep_time TEXT NOT NULL,
    wake_time TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    night_awakenings INT DEFAULT 0,
    sleep_quality INT DEFAULT 80,
    morning_feeling TEXT DEFAULT 'refreshed',
    notes TEXT,
    ai_insight TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_records_user ON public.sleep_records(user_id, created_at DESC);

-- ==============================================================================
-- 9. GOALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    target_value NUMERIC(8, 2) NOT NULL,
    current_value NUMERIC(8, 2) DEFAULT 0.0,
    unit TEXT NOT NULL,
    deadline DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

-- ==============================================================================
-- 10. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ==============================================================================
-- 11. AI CONVERSATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, created_at DESC);

-- ==============================================================================
-- 12. AI MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON public.ai_messages(user_id);

-- ==============================================================================
-- 13. AUTOMATIC PROFILE CREATION TRIGGER (AUTH.USERS -> PUBLIC.PROFILES)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
BEGIN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
    IF assigned_role NOT IN ('athlete', 'coach', 'admin') THEN
        assigned_role := 'athlete';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        avatar_url,
        sport,
        training_level,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        assigned_role,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'sport', 'General Fitness'),
        COALESCE(NEW.raw_user_meta_data->>'training_level', 'Intermediate'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

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

DROP TRIGGER IF EXISTS update_goals_modtime ON public.goals;
CREATE TRIGGER update_goals_modtime
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_conversations_modtime ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_modtime
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Exercise Catalogs (Public Read)
DROP POLICY IF EXISTS "Anyone can view exercise categories" ON public.exercise_categories;
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (true);

-- Workout Sessions Policies
DROP POLICY IF EXISTS "Users can view own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Exercise Sessions Policies
DROP POLICY IF EXISTS "Users can view own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Users can view own exercise sessions" ON public.exercise_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Users can insert own exercise sessions" ON public.exercise_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Users can update own exercise sessions" ON public.exercise_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own exercise sessions" ON public.exercise_sessions;
CREATE POLICY "Users can delete own exercise sessions" ON public.exercise_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Technique Analysis Policies
DROP POLICY IF EXISTS "Users can view own technique analysis" ON public.technique_analysis;
CREATE POLICY "Users can view own technique analysis" ON public.technique_analysis
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own technique analysis" ON public.technique_analysis;
CREATE POLICY "Users can insert own technique analysis" ON public.technique_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own technique analysis" ON public.technique_analysis;
CREATE POLICY "Users can delete own technique analysis" ON public.technique_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Technique Issues Policies
DROP POLICY IF EXISTS "Users can view own technique issues" ON public.technique_issues;
CREATE POLICY "Users can view own technique issues" ON public.technique_issues
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own technique issues" ON public.technique_issues;
CREATE POLICY "Users can insert own technique issues" ON public.technique_issues
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meal Logs Policies
DROP POLICY IF EXISTS "Users can view own meal logs" ON public.meal_logs;
CREATE POLICY "Users can view own meal logs" ON public.meal_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal logs" ON public.meal_logs;
CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meal logs" ON public.meal_logs;
CREATE POLICY "Users can delete own meal logs" ON public.meal_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Sleep Records Policies
DROP POLICY IF EXISTS "Users can view own sleep records" ON public.sleep_records;
CREATE POLICY "Users can view own sleep records" ON public.sleep_records
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sleep records" ON public.sleep_records;
CREATE POLICY "Users can insert own sleep records" ON public.sleep_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sleep records" ON public.sleep_records;
CREATE POLICY "Users can delete own sleep records" ON public.sleep_records
    FOR DELETE USING (auth.uid() = user_id);

-- Goals Policies
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view and update own notifications" ON public.notifications;
CREATE POLICY "Users can view and update own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- AI Conversations Policies
DROP POLICY IF EXISTS "Users can manage own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

-- AI Messages Policies
DROP POLICY IF EXISTS "Users can manage own AI messages" ON public.ai_messages;
CREATE POLICY "Users can manage own AI messages" ON public.ai_messages
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 15. SEED EXERCISE CATEGORIES & RICH EXERCISE LIBRARY
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
    -- QUADRICEPS (AI Supported)
    (1, 11, 'Barbell / Bodyweight Squat', 'squat', 'Quadriceps', 'Quadriceps, Glutes, Core', 'Hamstrings, Calves', 'Lower-body foundational compound movement evaluating knee flexion depth, hip displacement, and spinal neutrality.', '1. Stand with feet shoulder-width apart, toes angled slightly outward.\n2. Inhale, brace your core, and initiate movement by hinging hips back.\n3. Descend under control until thighs reach parallel or below (>=90° knee angle).\n4. Drive through midfoot and heels back to standing lockout.', 'Knees caving inward (valgus collapse), shifting weight onto toes, rounding lower back, cut-off depth.', 'Intermediate', 'Bodyweight / Barbell', 'Side View (90 deg)', 'Position camera 2 to 3 meters away at hip/knee height with clear full-body visibility.', 90.0, 3.0, TRUE),
    
    -- CHEST (AI Supported)
    (2, 1, 'Standard Push-up', 'pushup', 'Chest', 'Pectoralis Major, Triceps Brachii, Anterior Deltoids', 'Core, Serratus Anterior', 'Upper-body horizontal pressing movement evaluating chest depth, elbow flare angle, and straight-line plank posture.', '1. Start in a high plank with hands slightly wider than shoulder-width.\n2. Maintain rigid head-to-heel alignment by squeezing glutes and brace core.\n3. Lower chest until 2-3 inches above the floor while keeping elbows angled at 45 degrees.\n4. Press back up powerfully to full arm extension.', 'Sagging hips/lumbar hyperextension, flaring elbows out 90 degrees, incomplete range of motion, crane neck forward.', 'Beginner', 'Bodyweight', 'Side View', 'Position camera 2 to 3 meters away at floor/shin height with side view showing full body from head to heels.', 90.0, 2.5, TRUE),

    -- BICEPS (AI Supported)
    (3, 4, 'Dumbbell Bicep Curl', 'bicep_curl', 'Biceps', 'Biceps Brachii, Brachialis', 'Forearm Flexors, Anterior Deltoids', 'Isolated upper-limb flexion movement monitoring upper-arm stillness, elbow drift, and torso momentum compensation.', '1. Stand tall holding dumbbells at your sides with palms forward.\n2. Keep upper arms stationary against your ribcage.\n3. Curl dumbbells up toward shoulders while supinating wrists.\n4. Squeeze biceps at peak contraction and lower with 2-second eccentric control.', 'Swinging torso for momentum, elbows drifting forward or outward, dropping weights quickly without resistance.', 'Beginner', 'Dumbbells', 'Front or Side View', 'Position camera 2 to 3 meters away at chest height. Ensure upper arms and shoulders are in full view.', 120.0, 3.0, TRUE),

    -- SHOULDERS (AI Supported)
    (4, 3, 'Overhead Shoulder Press', 'shoulder_press', 'Shoulders', 'Deltoids (Anterior & Lateral), Triceps Brachii', 'Upper Trapezius, Core Stabilizers', 'Vertical overhead pressing movement evaluating overhead lockout, bilateral symmetry, and lumbar hyperextension.', '1. Stand or sit with dumbbells or barbell at shoulder height, palms forward.\n2. Engage core and glutes to lock ribcage down.\n3. Press weight directly upward in a straight bar path until arms are fully locked overhead.\n4. Lower smoothly back to chin level under control.', 'Arching lower back to push weight, pressing forward instead of overhead, asymmetrical press lockout.', 'Intermediate', 'Dumbbells / Barbell', 'Front View', 'Position camera 2.5 to 3.5 meters away at chest height. Ensure overhead arms reach is within frame.', 165.0, 3.0, TRUE),

    -- BACK
    (5, 2, 'Pull-up', 'pull_up', 'Back', 'Latissimus Dorsi, Teres Major, Biceps', 'Rhomboids, Lower Trapezius', 'The gold standard bodyweight vertical pulling movement.', '1. Overhand grip wider than shoulders.\n2. Initiate by pulling shoulder blades down.\n3. Pull chest up toward bar.\n4. Lower smoothly into full extension.', 'Kicking legs for momentum (kipping), half-rep range of motion at bottom.', 'Advanced', 'Pull-up Bar', 'Back View', 'Position camera behind athlete.', 140.0, 3.0, FALSE),
    (6, 2, 'Barbell Bent-Over Row', 'barbell_bent_row', 'Back', 'Latissimus Dorsi, Rhomboids, Mid Trapezius', 'Erector Spinae, Biceps', 'Fundamental horizontal pulling exercise for back thickness.', '1. Hinge hips to 45 degrees with flat spine.\n2. Pull bar to upper abdomen leading with elbows.\n3. Squeeze shoulder blades together at top.\n4. Lower with steady tempo.', 'Rounding thoracic/lumbar spine, standing up too vertical.', 'Intermediate', 'Barbell', 'Side View', 'Position camera side angle.', 90.0, 3.0, FALSE),

    -- TRICEPS
    (7, 5, 'Cable Tricep Pushdown', 'tricep_pushdown', 'Triceps', 'Triceps Brachii (Lateral & Medial heads)', 'Forearms', 'Isolated elbow extension for arm development.', '1. Keep elbows pinned to sides.\n2. Push cable attachment down until full arm extension.\n3. Squeeze triceps for 1 second.\n4. Control eccentric ascent to 90 degrees.', 'Letting elbows flare forward or swinging upper body.', 'Beginner', 'Cable Machine', 'Side View', 'Side camera view.', 110.0, 2.5, FALSE),

    -- CORE
    (8, 7, 'Forearm Plank', 'forearm_plank', 'Core', 'Rectus Abdominis, Transverse Abdominis', 'Glutes, Shoulders', 'Isometric anti-extension core stability benchmark.', '1. Rest on forearms and toes.\n2. Align ears, shoulders, hips, knees, and ankles in one straight line.\n3. Squeeze glutes and brace core.\n4. Maintain steady breathing.', 'Sagging hips into anterior pelvic tilt, pike hips in air.', 'Beginner', 'Bodyweight', 'Side View', 'Position camera side profile at floor height.', 180.0, 45.0, FALSE),

    -- GLUTES & HAMSTRINGS
    (9, 10, 'Barbell Hip Thrust', 'hip_thrust', 'Glutes', 'Gluteus Maximus', 'Hamstrings, Quadriceps, Core', 'High-load glute hypertrophy and hip extension movement.', '1. Sit on floor with upper back against bench.\n2. Place barbell over hips.\n3. Drive hips up until parallel with floor.\n4. Squeeze glutes at top lockout.', 'Hyperextending lumbar spine at top instead of posterior pelvic tilt.', 'Intermediate', 'Barbell & Bench', 'Side View', 'Side camera view.', 180.0, 3.0, FALSE),
    (10, 12, 'Romanian Deadlift (RDL)', 'romanian_deadlift', 'Hamstrings', 'Hamstrings, Gluteus Maximus', 'Erector Spinae, Traps', 'Essential hip hinge movement for posterior chain strength.', '1. Hold barbell with slight knee bend.\n2. Hinge hips backward keeping bar close to shins.\n3. Feel deep hamstring stretch.\n4. Squeeze glutes to return.', 'Rounding lumbar spine, bending knees excessively into a squat.', 'Intermediate', 'Barbell / Dumbbells', 'Side View', 'Side camera view showing hip hinge.', 80.0, 3.5, FALSE),

    -- CALVES & FOREARMS
    (11, 13, 'Standing Calf Raise', 'standing_calf_raise', 'Calves', 'Gastrocnemius, Soleus', 'Foot intrinsic muscles', 'Ankle plantarflexion for lower leg resilience.', '1. Stand on edge of step.\n2. Lower heels below step level for deep stretch.\n3. Rise onto balls of feet.\n4. Pause for 1 second at peak.', 'Bouncing rapidly without pausing at top contraction.', 'Beginner', 'Step / Machine', 'Side View', 'Side camera view of lower leg.', 45.0, 2.5, FALSE),
    (12, 6, 'Farmer Carry', 'farmer_carry', 'Forearms', 'Forearm Flexors, Grip, Trapezius', 'Core Stabilizers, Calves', 'Functional loaded carry testing whole-body postural endurance.', '1. Hold heavy dumbbells at sides.\n2. Stand tall with neutral spine.\n3. Walk in straight line with upright posture.\n4. Maintain steady cadence.', 'Slouching shoulders forward, wobbling side to side.', 'Beginner', 'Dumbbells / Trap Bar', 'Side View', 'Full body tracking.', 180.0, 30.0, FALSE),

    -- TRAPS, NECK & ADDUCTORS
    (13, 8, 'Dumbbell Shrug', 'dumbbell_shrug', 'Traps', 'Upper Trapezius, Levator Scapulae', 'Forearm Grip', 'Scapular elevation movement for upper back and neck resilience.', '1. Hold dumbbells at sides with neutral grip.\n2. Elevate shoulders straight up toward ears.\n3. Pause for 1 second at top contraction.\n4. Lower weights with smooth 2-second control.', 'Rolling shoulders in circles, using excessive momentum from knees.', 'Beginner', 'Dumbbells', 'Front View', 'Position camera in front showing shoulders.', 30.0, 2.5, FALSE),
    (14, 9, 'Isometric Neck Strengthening', 'neck_isometric', 'Neck', 'Sternocleidomastoid, Splenius Capitis', 'Cervical Stabilizers', 'Concussion prevention and posture stabilization drill for young athletes.', '1. Place palm against forehead or temple.\n2. Apply moderate isometric resistance while keeping head neutral.\n3. Hold for 5-10 seconds per vector.\n4. Repeat for flexion, extension, and lateral flexion.', 'Jerking or forceful hyperflexion of cervical spine.', 'Beginner', 'Bodyweight', 'Front/Side View', 'Position camera at head level.', 0.0, 10.0, FALSE),
    (15, 14, 'Copenhagen Side Plank', 'copenhagen_plank', 'Adductors', 'Adductor Longus, Adductor Magnus, Obliques', 'Core Stabilizers, Gluteus Medius', 'High-yield groin injury prevention and groin strength benchmark.', '1. Rest top foot on bench in a side plank posture.\n2. Raise bottom leg to touch underside of bench.\n3. Maintain rigid hip alignment without sagging toward floor.\n4. Hold for prescribed duration.', 'Letting pelvis rotate forward or sag downward.', 'Intermediate', 'Bench', 'Side View', 'Position camera side-on showing full plank alignment.', 180.0, 20.0, FALSE),

    -- FULL BODY, CARDIO & MOBILITY
    (16, 15, 'Burpee', 'burpee', 'Full Body', 'Full Body (Chest, Core, Quads, Deltoids)', 'Cardiovascular System', 'High-intensity athletic conditioning movement.', '1. Drop into squat, hands on floor.\n2. Kick feet back into push-up position.\n3. Perform push-up.\n4. Jump feet forward and jump up with hands overhead.', 'Collapsing lower back during plank landing, skipping full jump.', 'Intermediate', 'Bodyweight', 'Side View', 'Side camera view.', 90.0, 2.0, FALSE),
    (17, 16, 'Jumping Jacks', 'jumping_jacks', 'Cardio', 'Cardiovascular System, Calves, Deltoids', 'Adductors, Abductors', 'Rhythmic full-body warm-up and conditioning drill.', '1. Stand with feet together, arms at sides.\n2. Jump feet wide while raising arms overhead.\n3. Jump back to starting position in continuous rhythm.\n4. Land softly on balls of feet.', 'Landing hard on flat feet instead of springy balls of feet.', 'Beginner', 'Bodyweight', 'Front View', 'Front camera view.', 180.0, 1.5, FALSE),
    (18, 17, 'World Greatest Stretch', 'worlds_greatest_stretch', 'Mobility', 'Thoracic Spine, Hip Flexors, Hamstrings', 'Glutes, Ankles', 'Multi-planar full body mobility dynamic sequence.', '1. Step forward into deep lunge.\n2. Place inside elbow to instep.\n3. Rotate arm and chest toward sky.\n4. Push hips back to stretch front hamstring.', 'Rushing through positions without deep breathing.', 'Beginner', 'Bodyweight', 'Side View', 'Side camera view.', 90.0, 5.0, FALSE)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    target_muscle = EXCLUDED.target_muscle,
    secondary_muscles = EXCLUDED.secondary_muscles,
    description = EXCLUDED.description,
    instructions = EXCLUDED.instructions,
    common_mistakes = EXCLUDED.common_mistakes,
    difficulty = EXCLUDED.difficulty,
    equipment = EXCLUDED.equipment,
    default_camera_angle = EXCLUDED.default_camera_angle,
    camera_setup_instructions = EXCLUDED.camera_setup_instructions,
    ideal_rom_degrees = EXCLUDED.ideal_rom_degrees,
    normative_cadence_seconds = EXCLUDED.normative_cadence_seconds,
    analysis_available = EXCLUDED.analysis_available;
