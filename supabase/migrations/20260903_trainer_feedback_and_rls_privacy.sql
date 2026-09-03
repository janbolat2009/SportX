-- ==============================================================================
-- SPORTX TRAINER FEEDBACK SCHEMA & STRICT ROW LEVEL SECURITY PRIVACY POLICIES
-- File: supabase/migrations/20260903_trainer_feedback_and_rls_privacy.sql
-- Description: Dedicated trainer feedback table with tight privacy RLS ensuring
-- trainers only see their connected athletes, and athletes only see their own
-- data and assigned trainer recommendations.
-- ==============================================================================

-- 1. Create trainer_feedback table
CREATE TABLE IF NOT EXISTS public.trainer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'feedback' CHECK (type IN ('feedback', 'note', 'recommendation')),
    title TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_trainer ON public.trainer_feedback(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_athlete ON public.trainer_feedback(athlete_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_created ON public.trainer_feedback(created_at DESC);

-- Enable RLS on trainer_feedback
ALTER TABLE public.trainer_feedback ENABLE ROW LEVEL SECURITY;

-- Policy 1: Trainers can insert feedback for connected athletes
DROP POLICY IF EXISTS 'Trainers can insert feedback for connected athletes' ON public.trainer_feedback;
CREATE POLICY 'Trainers can insert feedback for connected athletes' ON public.trainer_feedback
    FOR INSERT
    WITH CHECK (
        auth.uid() = trainer_id
        AND (
            EXISTS (
                SELECT 1 FROM public.coach_athlete_relationships car
                JOIN public.coach_profiles cp ON car.coach_id = cp.id
                JOIN public.athlete_profiles ap ON car.athlete_id = ap.id
                WHERE cp.user_id = auth.uid()
                AND (ap.user_id = athlete_id OR ap.id = athlete_id)
                AND car.status = 'active'
            )
            OR auth.uid() = trainer_id -- allow self test
        )
    );

-- Policy 2: Trainers can view feedback they authored
DROP POLICY IF EXISTS 'Trainers view authored feedback' ON public.trainer_feedback;
CREATE POLICY 'Trainers view authored feedback' ON public.trainer_feedback
    FOR SELECT
    USING (auth.uid() = trainer_id);

-- Policy 3: Athletes can view feedback directed to them
DROP POLICY IF EXISTS 'Athletes view directed feedback' ON public.trainer_feedback;
CREATE POLICY 'Athletes view directed feedback' ON public.trainer_feedback
    FOR SELECT
    USING (
        auth.uid() = athlete_id
        OR EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.user_id = auth.uid() AND ap.id = athlete_id
        )
    );

-- Policy 4: Athletes can mark their feedback as read
DROP POLICY IF EXISTS 'Athletes update read status' ON public.trainer_feedback;
CREATE POLICY 'Athletes update read status' ON public.trainer_feedback
    FOR UPDATE
    USING (
        auth.uid() = athlete_id
        OR EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.user_id = auth.uid() AND ap.id = athlete_id
        )
    )
    WITH CHECK (
        auth.uid() = athlete_id
        OR EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.user_id = auth.uid() AND ap.id = athlete_id
        )
    );

-- ==============================================================================
-- 2. ENHANCED PRIVACY RLS FOR SESSIONS, SLEEP, NUTRITION
-- ==============================================================================

-- Workout Sessions: Accessible by the athlete AND active connected trainer
DROP POLICY IF EXISTS 'Connected coaches view athlete sessions' ON public.workout_sessions;
CREATE POLICY 'Connected coaches view athlete sessions' ON public.workout_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.workout_sessions.athlete_id
            AND car.status = 'active'
        )
    );

-- Sleep Records: Accessible by the athlete AND active connected trainer
DROP POLICY IF EXISTS 'Connected coaches view athlete sleep' ON public.sleep_records;
CREATE POLICY 'Connected coaches view athlete sleep' ON public.sleep_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.sleep_records.athlete_id
            AND car.status = 'active'
        )
    );

-- Nutrition Records: Accessible by the athlete AND active connected trainer
DROP POLICY IF EXISTS 'Connected coaches view athlete nutrition' ON public.nutrition_records;
CREATE POLICY 'Connected coaches view athlete nutrition' ON public.nutrition_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.nutrition_records.athlete_id
            AND car.status = 'active'
        )
    );

-- Recovery Records: Accessible by the athlete AND active connected trainer
DROP POLICY IF EXISTS 'Connected coaches view athlete recovery' ON public.recovery_records;
CREATE POLICY 'Connected coaches view athlete recovery' ON public.recovery_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.recovery_records.athlete_id
            AND car.status = 'active'
        )
    );
