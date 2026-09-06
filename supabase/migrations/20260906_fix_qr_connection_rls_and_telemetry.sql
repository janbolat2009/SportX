-- ==============================================================================
-- SPORTX DATABASE MIGRATION: RLS SECURITY POLICIES FOR QR CONNECTION & TELEMETRY
-- File: supabase/migrations/20260906_fix_qr_connection_rls_and_telemetry.sql
-- Description:
-- 1. Fixes coach_profiles RLS so athletes and public can view coach dossiers.
-- 2. Fixes profiles RLS so coach public profile and avatar are readable by athletes.
-- 3. Enables coach_athlete_relationships RLS policies allowing athletes to connect
--    and coaches to view their active roster.
-- 4. Ensures athlete_profiles can be viewed by their active connected coaches.
-- 5. Ensures workout_sessions and sleep_records are accessible by connected coaches.
-- ==============================================================================

-- 1. COACH PROFILES: Allow reading coach profiles by any authenticated or public user
ALTER TABLE IF EXISTS public.coach_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Public view coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches manage own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coach_profiles;

CREATE POLICY "Public can view coach profiles" ON public.coach_profiles
    FOR SELECT USING (true);

CREATE POLICY "Coaches can insert own profile" ON public.coach_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile" ON public.coach_profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. PROFILES: Allow reading public coach profiles and connected athlete profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (
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
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. COACH ATHLETE RELATIONSHIPS: Allow athletes to connect and coaches to view roster
ALTER TABLE IF EXISTS public.coach_athlete_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches and athletes view relationships" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Athletes can connect to coaches" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Coaches and athletes can update relationships" ON public.coach_athlete_relationships;

CREATE POLICY "Coaches and athletes view relationships" ON public.coach_athlete_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            WHERE cp.id = public.coach_athlete_relationships.coach_id
            AND cp.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.coach_athlete_relationships.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

CREATE POLICY "Athletes can connect to coaches" ON public.coach_athlete_relationships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.coach_athlete_relationships.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches and athletes can update relationships" ON public.coach_athlete_relationships
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.coach_profiles cp
            WHERE cp.id = public.coach_athlete_relationships.coach_id
            AND cp.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.coach_athlete_relationships.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

-- 4. ATHLETE PROFILES: Allow athlete to manage and connected coaches to view
ALTER TABLE IF EXISTS public.athlete_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes view own profile" ON public.athlete_profiles;
DROP POLICY IF EXISTS "Athletes manage own profile" ON public.athlete_profiles;

CREATE POLICY "Athletes manage own profile" ON public.athlete_profiles
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Connected coaches view athlete profiles" ON public.athlete_profiles;
CREATE POLICY "Connected coaches view athlete profiles" ON public.athlete_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.athlete_profiles.id
            AND car.status = 'active'
        )
    );

-- 5. WORKOUT SESSIONS: Athlete manages own sessions; connected coaches can view
ALTER TABLE IF EXISTS public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes manage own sessions" ON public.workout_sessions;
CREATE POLICY "Athletes manage own sessions" ON public.workout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workout_sessions.athlete_id
            AND ap.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.workout_sessions.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Connected coaches view athlete sessions" ON public.workout_sessions;
CREATE POLICY "Connected coaches view athlete sessions" ON public.workout_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.workout_sessions.athlete_id
            AND car.status = 'active'
        )
    );

-- 6. SLEEP RECORDS: Athlete manages own sleep; connected coaches can view
ALTER TABLE IF EXISTS public.sleep_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes manage sleep" ON public.sleep_records;
CREATE POLICY "Athletes manage sleep" ON public.sleep_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.sleep_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.athlete_profiles ap
            WHERE ap.id = public.sleep_records.athlete_id
            AND ap.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Connected coaches view athlete sleep" ON public.sleep_records;
CREATE POLICY "Connected coaches view athlete sleep" ON public.sleep_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athlete_relationships car
            JOIN public.coach_profiles cp ON car.coach_id = cp.id
            WHERE cp.user_id = auth.uid()
            AND car.athlete_id = public.sleep_records.athlete_id
            AND car.status = 'active'
        )
    );
