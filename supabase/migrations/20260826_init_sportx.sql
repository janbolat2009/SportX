-- =====================================================================
-- SportX Supabase Database Schema & Row Level Security (RLS) Policies
-- Migration: 20260826_init_sportx.sql
-- =====================================================================

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'researcher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Athlete Profiles
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 3. Coach Profiles
CREATE TABLE IF NOT EXISTS public.coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization TEXT,
    specialization TEXT,
    experience_years INT DEFAULT 1,
    bio TEXT,
    certifications TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Coach-Athlete Relationships
CREATE TABLE IF NOT EXISTS public.coach_athlete_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);

-- 5. Exercises Registry
CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    target_muscles TEXT NOT NULL,
    description TEXT NOT NULL,
    default_camera_angle TEXT DEFAULT 'Frontal (0 deg)',
    camera_setup_instructions TEXT NOT NULL,
    ideal_rom_degrees NUMERIC(5,2) DEFAULT 90.0,
    normative_cadence_seconds NUMERIC(4,2) DEFAULT 3.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Workouts / Training Plans
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

-- 7. Workout Sessions
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

-- 8. Exercise Sessions (Per-exercise segment)
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

-- 9. Repetitions
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

-- 10. Technique Analysis
CREATE TABLE IF NOT EXISTS public.technique_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    confidence NUMERIC(4,3) DEFAULT 0.95,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Technique Issues
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

-- 12. Technique Scores
CREATE TABLE IF NOT EXISTS public.technique_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    score_value NUMERIC(5,2) NOT NULL,
    benchmark_target NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Goals
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

-- 14. Sleep Records
CREATE TABLE IF NOT EXISTS public.sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    bedtime TEXT,
    wake_time TEXT,
    total_sleep_minutes INT DEFAULT 480,
    sleep_quality_score NUMERIC(5,2) DEFAULT 80.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

-- 15. Nutrition Records
CREATE TABLE IF NOT EXISTS public.nutrition_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_type TEXT DEFAULT 'LUNCH' CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    meal_description TEXT NOT NULL,
    calories INT DEFAULT 600,
    protein_g NUMERIC(5,1) DEFAULT 30.0,
    carbs_g NUMERIC(5,1) DEFAULT 60.0,
    fats_g NUMERIC(5,1) DEFAULT 20.0,
    water_ml NUMERIC(6,1) DEFAULT 500.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Recovery Records
CREATE TABLE IF NOT EXISTS public.recovery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    soreness_level INT DEFAULT 3 CHECK (soreness_level BETWEEN 1 AND 10),
    fatigue_level INT DEFAULT 3 CHECK (fatigue_level BETWEEN 1 AND 10),
    stress_level INT DEFAULT 2 CHECK (stress_level BETWEEN 1 AND 10),
    calculated_readiness_score NUMERIC(5,2) DEFAULT 85.0,
    training_load_estimate NUMERIC(5,2) DEFAULT 50.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, log_date)
);

-- 17. Notifications
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

-- 18. Coach Comments
CREATE TABLE IF NOT EXISTS public.coach_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    repetition_id UUID REFERENCES public.repetitions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Model Versions
CREATE TABLE IF NOT EXISTS public.model_versions (
    id SERIAL PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    version_tag TEXT UNIQUE NOT NULL,
    description TEXT,
    feature_version TEXT DEFAULT 'pose-kinematics-v1.0',
    test_accuracy NUMERIC(5,4),
    test_f1 NUMERIC(5,4),
    latency_fps NUMERIC(6,1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Analysis Results (Research & benchmarks)
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
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- 1. Profiles: users can read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Exercises: anyone authenticated can read
CREATE POLICY "Anyone can view exercises" ON public.exercises
    FOR SELECT USING (true);

-- 3. Model Versions: anyone authenticated can read
CREATE POLICY "Anyone can view model versions" ON public.model_versions
    FOR SELECT USING (true);

-- 4. Athlete Profiles: athletes view their own, coaches view supervised athletes
CREATE POLICY "Athletes view own profile" ON public.athlete_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coaches view supervised athletes" ON public.athlete_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            JOIN public.coach_athlete_relationships car ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.athlete_profiles.id
            AND car.status = 'active'
        )
    );

-- 5. Workout Sessions: athletes view/insert own sessions, coaches view supervised
CREATE POLICY "Athletes manage own sessions" ON public.workout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workout_sessions.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

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

-- 6. Repetitions: accessible if parent session is accessible
CREATE POLICY "Users access own repetitions" ON public.repetitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            JOIN public.athlete_profiles ap ON ap.id = ws.athlete_id
            WHERE ws.id = public.repetitions.session_id
            AND ap.user_id = auth.uid()
        )
    );

-- 7. Sleep, Nutrition, Recovery: athlete private
CREATE POLICY "Athletes manage sleep" ON public.sleep_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.sleep_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

CREATE POLICY "Athletes manage nutrition" ON public.nutrition_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.nutrition_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

CREATE POLICY "Athletes manage recovery" ON public.recovery_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.recovery_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 8. Notifications: private to recipient user
CREATE POLICY "Users access own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);
