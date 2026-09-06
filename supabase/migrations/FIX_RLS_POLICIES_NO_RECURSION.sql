-- ==============================================================================
-- SPORTX: ИСПРАВЛЕНИЕ RLS ПОЛИТИК (БЕЗ УДАЛЕНИЯ ТАБЛИЦ И ДАННЫХ)
-- Запусти в Supabase Dashboard → SQL Editor → Run
-- Этот скрипт устраняет бесконечную рекурсию (error 42P17)
-- ==============================================================================

-- 1. SECURITY DEFINER ФУНКЦИИ (выполняются в привилегированном контексте, предотвращая рекурсию)
CREATE OR REPLACE FUNCTION public.get_current_athlete_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.athlete_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_coach_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.coach_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_view_user_profile(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    -- Свой профиль
    auth.uid() = target_user_id
    -- Профили тренеров публичны (для предпросмотра при сканировании QR)
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = target_user_id AND role IN ('coach', 'trainer')
    )
    -- Тренер видит профили своих подключенных атлетов
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      JOIN public.athlete_profiles ap ON car.athlete_id = ap.id
      WHERE cp.user_id = auth.uid() AND ap.user_id = target_user_id AND car.status = 'active'
    )
    -- Атлет видит профиль своего тренера
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      JOIN public.athlete_profiles ap ON car.athlete_id = ap.id
      WHERE ap.user_id = auth.uid() AND cp.user_id = target_user_id AND car.status = 'active'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_athlete_telemetry(target_athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    -- Сам атлет
    EXISTS (
      SELECT 1 FROM public.athlete_profiles WHERE id = target_athlete_id AND user_id = auth.uid()
    )
    -- Активный тренер этого атлета
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      WHERE car.athlete_id = target_athlete_id AND cp.user_id = auth.uid() AND car.status = 'active'
    )
  );
$$;

-- 2. ОБНОВЛЯЕМ ПОЛИТИКИ PROFILES
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (public.can_view_user_profile(id));

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. ОБНОВЛЯЕМ ПОЛИТИКИ COACH_PROFILES
DROP POLICY IF EXISTS "public_read_coach_profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Public can view coach profiles" ON public.coach_profiles;
CREATE POLICY "public_read_coach_profiles" ON public.coach_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "coach_insert_own" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
CREATE POLICY "coach_insert_own" ON public.coach_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach_update_own" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coach_profiles;
CREATE POLICY "coach_update_own" ON public.coach_profiles FOR UPDATE USING (auth.uid() = user_id);

-- 4. ОБНОВЛЯЕМ ПОЛИТИКИ ATHLETE_PROFILES
DROP POLICY IF EXISTS "athlete_manage_own" ON public.athlete_profiles;
DROP POLICY IF EXISTS "Athletes manage own profile" ON public.athlete_profiles;
DROP POLICY IF EXISTS "coach_view_athletes" ON public.athlete_profiles;
DROP POLICY IF EXISTS "Coaches view connected athletes" ON public.athlete_profiles;
DROP POLICY IF EXISTS "athlete_profiles_select_policy" ON public.athlete_profiles;
CREATE POLICY "athlete_profiles_select_policy" ON public.athlete_profiles FOR SELECT USING (public.can_access_athlete_telemetry(id));

DROP POLICY IF EXISTS "athlete_profiles_modify_policy" ON public.athlete_profiles;
CREATE POLICY "athlete_profiles_modify_policy" ON public.athlete_profiles FOR ALL USING (auth.uid() = user_id);

-- 5. ОБНОВЛЯЕМ ПОЛИТИКИ COACH_ATHLETE_RELATIONSHIPS
DROP POLICY IF EXISTS "rel_select" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Coaches and athletes view relationships" ON public.coach_athlete_relationships;
CREATE POLICY "rel_select" ON public.coach_athlete_relationships FOR SELECT USING (
    coach_id = public.get_current_coach_id()
    OR athlete_id = public.get_current_athlete_id()
);

DROP POLICY IF EXISTS "rel_insert" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Athletes can connect to coaches" ON public.coach_athlete_relationships;
CREATE POLICY "rel_insert" ON public.coach_athlete_relationships FOR INSERT WITH CHECK (
    athlete_id = public.get_current_athlete_id()
    OR coach_id = public.get_current_coach_id()
);

DROP POLICY IF EXISTS "rel_update" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Coaches and athletes can update relationships" ON public.coach_athlete_relationships;
CREATE POLICY "rel_update" ON public.coach_athlete_relationships FOR UPDATE USING (
    coach_id = public.get_current_coach_id()
    OR athlete_id = public.get_current_athlete_id()
);

-- 6. WORKOUT SESSIONS
DROP POLICY IF EXISTS "athlete_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Athletes manage own sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "coach_view_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Coaches view athlete sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "workout_sessions_select_policy" ON public.workout_sessions;
CREATE POLICY "workout_sessions_select_policy" ON public.workout_sessions FOR SELECT USING (
    public.can_access_athlete_telemetry(athlete_id)
);

DROP POLICY IF EXISTS "workout_sessions_modify_policy" ON public.workout_sessions;
CREATE POLICY "workout_sessions_modify_policy" ON public.workout_sessions FOR ALL USING (
    athlete_id = public.get_current_athlete_id()
);

-- 7. REPETITIONS
DROP POLICY IF EXISTS "athlete_repetitions" ON public.repetitions;
DROP POLICY IF EXISTS "Athletes manage repetitions" ON public.repetitions;
DROP POLICY IF EXISTS "repetitions_select_policy" ON public.repetitions;
CREATE POLICY "repetitions_select_policy" ON public.repetitions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = repetitions.session_id
          AND public.can_access_athlete_telemetry(ws.athlete_id)
    )
);

DROP POLICY IF EXISTS "repetitions_modify_policy" ON public.repetitions;
CREATE POLICY "repetitions_modify_policy" ON public.repetitions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = repetitions.session_id
          AND ws.athlete_id = public.get_current_athlete_id()
    )
);

-- 8. TECHNIQUE ISSUES
DROP POLICY IF EXISTS "technique_issues_policy" ON public.technique_issues;
CREATE POLICY "technique_issues_policy" ON public.technique_issues FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws
        WHERE ws.id = technique_issues.session_id
          AND public.can_access_athlete_telemetry(ws.athlete_id)
    )
);

-- 9. SLEEP RECORDS
DROP POLICY IF EXISTS "athlete_sleep" ON public.sleep_records;
DROP POLICY IF EXISTS "Athletes manage sleep" ON public.sleep_records;
DROP POLICY IF EXISTS "sleep_records_select_policy" ON public.sleep_records;
CREATE POLICY "sleep_records_select_policy" ON public.sleep_records FOR SELECT USING (
    public.can_access_athlete_telemetry(athlete_id)
);

DROP POLICY IF EXISTS "sleep_records_modify_policy" ON public.sleep_records;
CREATE POLICY "sleep_records_modify_policy" ON public.sleep_records FOR ALL USING (
    athlete_id = public.get_current_athlete_id()
);

-- 10. NUTRITION RECORDS
DROP POLICY IF EXISTS "athlete_nutrition" ON public.nutrition_records;
DROP POLICY IF EXISTS "Athletes manage nutrition" ON public.nutrition_records;
DROP POLICY IF EXISTS "nutrition_records_select_policy" ON public.nutrition_records;
CREATE POLICY "nutrition_records_select_policy" ON public.nutrition_records FOR SELECT USING (
    public.can_access_athlete_telemetry(athlete_id)
);

DROP POLICY IF EXISTS "nutrition_records_modify_policy" ON public.nutrition_records;
CREATE POLICY "nutrition_records_modify_policy" ON public.nutrition_records FOR ALL USING (
    athlete_id = public.get_current_athlete_id()
);

-- 11. RECOVERY RECORDS
DROP POLICY IF EXISTS "athlete_recovery" ON public.recovery_records;
DROP POLICY IF EXISTS "Athletes manage recovery" ON public.recovery_records;
DROP POLICY IF EXISTS "recovery_records_select_policy" ON public.recovery_records;
CREATE POLICY "recovery_records_select_policy" ON public.recovery_records FOR SELECT USING (
    public.can_access_athlete_telemetry(athlete_id)
);

DROP POLICY IF EXISTS "recovery_records_modify_policy" ON public.recovery_records;
CREATE POLICY "recovery_records_modify_policy" ON public.recovery_records FOR ALL USING (
    athlete_id = public.get_current_athlete_id()
);

-- 12. GOALS
DROP POLICY IF EXISTS "athlete_goals" ON public.goals;
DROP POLICY IF EXISTS "Athletes manage goals" ON public.goals;
CREATE POLICY "athlete_goals" ON public.goals FOR ALL USING (
    athlete_id = public.get_current_athlete_id()
);
