-- ============================================================
-- SPORTX: ИСПРАВЛЕНИЕ RLS ДЛЯ QR-ПОДКЛЮЧЕНИЯ
-- Выполни этот скрипт в Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. COACH_PROFILES: разрешить читать всем (публичный справочник тренеров)
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Public view coach profiles" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches manage own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coach_profiles;

CREATE POLICY "Public can view coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (true);

CREATE POLICY "Coaches can insert own profile"
  ON public.coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile"
  ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. PROFILES: разрешить читать профили тренеров (role = coach/trainer) всем
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
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
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. COACH_ATHLETE_RELATIONSHIPS: атлет может подключаться, тренер видит своих атлетов
ALTER TABLE public.coach_athlete_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches and athletes view relationships" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Athletes can connect to coaches" ON public.coach_athlete_relationships;
DROP POLICY IF EXISTS "Coaches and athletes can update relationships" ON public.coach_athlete_relationships;

CREATE POLICY "Coaches and athletes view relationships"
  ON public.coach_athlete_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_athlete_relationships.coach_id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.athlete_profiles ap
      WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can connect to coaches"
  ON public.coach_athlete_relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.athlete_profiles ap
      WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches and athletes can update relationships"
  ON public.coach_athlete_relationships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_profiles cp
      WHERE cp.id = coach_athlete_relationships.coach_id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.athlete_profiles ap
      WHERE ap.id = coach_athlete_relationships.athlete_id AND ap.user_id = auth.uid()
    )
  );

-- 4. ATHLETE_PROFILES: тренер видит своих атлетов
DROP POLICY IF EXISTS "Athletes view own profile" ON public.athlete_profiles;
DROP POLICY IF EXISTS "Coaches view connected athletes" ON public.athlete_profiles;

CREATE POLICY "Athletes view own profile"
  ON public.athlete_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches view connected athletes"
  ON public.athlete_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_relationships car
      JOIN public.coach_profiles cp ON car.coach_id = cp.id
      WHERE car.athlete_id = public.athlete_profiles.id
        AND cp.user_id = auth.uid()
        AND car.status = 'active'
    )
  );
