-- ==============================================================================
-- SPORTX: ПОЛНАЯ СХЕМА + RLS ПОЛИТИКИ
-- Запусти ЭТОТ файл в Supabase Dashboard → SQL Editor → Run
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- ТАБЛИЦЫ
-- ==============================================================================

-- 1. PROFILES (основные аккаунты)
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

-- 2. ATHLETE PROFILES
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
    anonymized_subject_id TEXT UNIQUE NOT NULL DEFAULT ('SUBJ-' || gen_random_uuid()::text),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user ON public.athlete_profiles(user_id);

-- 3. COACH PROFILES
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
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user ON public.coach_profiles(user_id);

-- 4. COACH-ATHLETE RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.coach_athlete_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);

-- 5. EXERCISE CATEGORIES
CREATE TABLE IF NOT EXISTS public.exercise_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    display_order INT DEFAULT 0
);

-- 6. EXERCISES
CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.exercise_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    target_muscle TEXT NOT NULL,
    secondary_muscles TEXT,
    equipment TEXT DEFAULT 'Bodyweight',
    difficulty TEXT DEFAULT 'Intermediate',
    description TEXT NOT NULL,
    instructions TEXT,
    common_mistakes TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    analysis_config JSONB DEFAULT '{}'::jsonb,
    default_camera_angle TEXT DEFAULT 'Side View (90 deg)',
    camera_setup_instructions TEXT DEFAULT 'Position camera 2 to 3 meters away at hip height.',
    ideal_rom_degrees NUMERIC(5,2) DEFAULT 90.0,
    normative_cadence_seconds NUMERIC(4,2) DEFAULT 3.0,
    analysis_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON public.exercises(slug);

-- 7. WORKOUTS
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

-- 8. WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    exercise_id INT REFERENCES public.exercises(id) ON DELETE SET NULL,
    session_type TEXT DEFAULT 'LIVE_CAMERA',
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
CREATE INDEX IF NOT EXISTS idx_workout_sessions_athlete ON public.workout_sessions(athlete_id);

-- 9. EXERCISE SESSIONS
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

-- 10. REPETITIONS
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

-- 11. TECHNIQUE ANALYSIS
CREATE TABLE IF NOT EXISTS public.technique_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 0.95,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TECHNIQUE ISSUES
CREATE TABLE IF NOT EXISTS public.technique_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE CASCADE,
    error_code TEXT NOT NULL,
    error_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate',
    confidence NUMERIC(4,3) DEFAULT 0.90,
    description TEXT NOT NULL,
    corrective_instruction TEXT NOT NULL,
    timestamp NUMERIC(8,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TECHNIQUE SCORES
CREATE TABLE IF NOT EXISTS public.technique_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    score_value NUMERIC(5,2) NOT NULL,
    benchmark_target NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. MEAL LOGS
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL,
    food_name TEXT,
    description TEXT NOT NULL,
    amount_grams NUMERIC(7,2) DEFAULT 100.0,
    calories NUMERIC(7,2) DEFAULT 0.0,
    protein NUMERIC(6,2) DEFAULT 0.0,
    carbohydrates NUMERIC(6,2) DEFAULT 0.0,
    fat NUMERIC(6,2) DEFAULT 0.0,
    fiber NUMERIC(6,2) DEFAULT 0.0,
    estimated BOOLEAN DEFAULT FALSE,
    model_version TEXT DEFAULT 'sportx-nutrition-v2.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user ON public.meal_logs(user_id);

-- 15. NUTRITION RECORDS
CREATE TABLE IF NOT EXISTS public.nutrition_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT DEFAULT 'LUNCH',
    meal_description TEXT NOT NULL,
    calories INT DEFAULT 600,
    protein_g NUMERIC(5,1) DEFAULT 30.0,
    carbs_g NUMERIC(5,1) DEFAULT 60.0,
    fats_g NUMERIC(5,1) DEFAULT 20.0,
    water_ml NUMERIC(6,1) DEFAULT 500.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SLEEP RECORDS
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

-- 17. RECOVERY RECORDS
CREATE TABLE IF NOT EXISTS public.recovery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    soreness_level INT DEFAULT 3,
    fatigue_level INT DEFAULT 3,
    stress_level INT DEFAULT 2,
    calculated_readiness_score NUMERIC(5,2) DEFAULT 85.0,
    training_load_estimate NUMERIC(5,2) DEFAULT 50.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

-- 18. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_metric TEXT NOT NULL,
    target_value NUMERIC(8,2) NOT NULL,
    current_value NUMERIC(8,2) DEFAULT 0.0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'TECHNIQUE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. COACH COMMENTS
CREATE TABLE IF NOT EXISTS public.coach_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. AI MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ТРИГГЕР: автосоздание профиля при регистрации
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
BEGIN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
    IF assigned_role NOT IN ('athlete', 'coach', 'researcher', 'admin') THEN
        assigned_role := 'athlete';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        assigned_role,
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    IF assigned_role = 'athlete' THEN
        INSERT INTO public.athlete_profiles (user_id, sport, training_level, anonymized_subject_id, created_at, updated_at)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'sport', 'General Fitness'),
            COALESCE(NEW.raw_user_meta_data->>'training_level', 'Intermediate'),
            'SUBJ-' || substring(NEW.id::text from 1 for 8),
            NOW(), NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    IF assigned_role = 'coach' THEN
        INSERT INTO public.coach_profiles (user_id, experience_years, created_at)
        VALUES (NEW.id, 1, NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- ==============================================================================
-- RLS — включаем и задаём политики
-- ==============================================================================

ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athlete_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repetitions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_analysis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_issues          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages               ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR role IN ('coach', 'trainer')
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      JOIN public.athlete_profiles ap ON car.athlete_id = ap.id
      WHERE (cp.user_id = auth.uid() AND ap.user_id = public.profiles.id)
         OR (ap.user_id = auth.uid() AND cp.user_id = public.profiles.id)
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── COACH PROFILES ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view coach profiles" ON public.coach_profiles;
CREATE POLICY "Public can view coach profiles" ON public.coach_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can insert own profile" ON public.coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can update own profile" ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── ATHLETE PROFILES ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes manage own profile" ON public.athlete_profiles;
CREATE POLICY "Athletes manage own profile" ON public.athlete_profiles FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches view connected athletes" ON public.athlete_profiles;
CREATE POLICY "Coaches view connected athletes" ON public.athlete_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      WHERE car.athlete_id = public.athlete_profiles.id
        AND cp.user_id = auth.uid()
        AND car.status = 'active'
    )
  );

-- ── COACH-ATHLETE RELATIONSHIPS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Coaches and athletes view relationships" ON public.coach_athlete_relationships;
CREATE POLICY "Coaches and athletes view relationships" ON public.coach_athlete_relationships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = coach_athlete_relationships.coach_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Athletes can connect to coaches" ON public.coach_athlete_relationships;
CREATE POLICY "Athletes can connect to coaches" ON public.coach_athlete_relationships FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coaches and athletes can update relationships" ON public.coach_athlete_relationships;
CREATE POLICY "Coaches and athletes can update relationships" ON public.coach_athlete_relationships FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = coach_athlete_relationships.coach_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid())
  );

-- ── EXERCISES (публичный каталог) ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view exercise categories" ON public.exercise_categories;
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- ── WORKOUT SESSIONS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes manage own sessions" ON public.workout_sessions;
CREATE POLICY "Athletes manage own sessions" ON public.workout_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = workout_sessions.athlete_id AND ap.user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches view athlete sessions" ON public.workout_sessions;
CREATE POLICY "Coaches view athlete sessions" ON public.workout_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.coach_athlete_relationships car
    JOIN public.coach_profiles cp ON car.coach_id = cp.id
    WHERE car.athlete_id = workout_sessions.athlete_id AND cp.user_id = auth.uid() AND car.status = 'active'
  ));

-- ── REPETITIONS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes manage repetitions" ON public.repetitions;
CREATE POLICY "Athletes manage repetitions" ON public.repetitions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    JOIN public.athlete_profiles ap ON ws.athlete_id = ap.id
    WHERE ws.id = repetitions.session_id AND ap.user_id = auth.uid()
  ));

-- ── SLEEP RECORDS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes manage sleep" ON public.sleep_records;
CREATE POLICY "Athletes manage sleep" ON public.sleep_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = sleep_records.athlete_id AND ap.user_id = auth.uid()));

-- ── NUTRITION & MEAL LOGS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own meal logs" ON public.meal_logs;
CREATE POLICY "Users can manage own meal logs" ON public.meal_logs FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes manage nutrition" ON public.nutrition_records;
CREATE POLICY "Athletes manage nutrition" ON public.nutrition_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = nutrition_records.athlete_id AND ap.user_id = auth.uid()));

-- ── RECOVERY & GOALS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes manage recovery" ON public.recovery_records;
CREATE POLICY "Athletes manage recovery" ON public.recovery_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = recovery_records.athlete_id AND ap.user_id = auth.uid()));

DROP POLICY IF EXISTS "Athletes manage goals" ON public.goals;
CREATE POLICY "Athletes manage goals" ON public.goals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles ap WHERE ap.id = goals.athlete_id AND ap.user_id = auth.uid()));

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
CREATE POLICY "Users access own notifications" ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- ── AI ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own messages" ON public.ai_messages;
CREATE POLICY "Users manage own messages" ON public.ai_messages FOR ALL
  USING (auth.uid() = user_id);

-- ── COACH COMMENTS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Coaches manage own comments" ON public.coach_comments;
CREATE POLICY "Coaches manage own comments" ON public.coach_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = coach_comments.coach_id AND cp.user_id = auth.uid()));
