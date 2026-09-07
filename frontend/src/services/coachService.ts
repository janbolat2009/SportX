import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from './api';
import type { Tables, InsertTables } from '../types/database';
import { CoachRosterAthlete, NotificationItem } from '../types';

export const coachService = {
  async getSupervisedAthletes(coachUserId: string): Promise<CoachRosterAthlete[]> {
    if (!isSupabaseConfigured() || !coachUserId) {
      return [];
    }

    try {
      // 1. Resolve coach_profiles id for this user
      let coachProfId: string | null = null;
      const { data: coach } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', coachUserId)
        .maybeSingle();

      if (coach) {
        coachProfId = coach.id;
      }

      // 2. Query active relationships for this coach (check both coach_profiles.id and user_id)
      let rels: any[] = [];
      if (coachProfId) {
        const { data: r1 } = await supabase
          .from('coach_athlete_relationships')
          .select('id, athlete_id, coach_id, status, created_at')
          .eq('coach_id', coachProfId)
          .eq('status', 'active');
        if (r1 && r1.length > 0) rels = r1;
      }

      // If nothing found by coach_profiles.id, check by coachUserId (in case QR encoded user_id)
      if (rels.length === 0 && coachUserId) {
        const { data: r2 } = await supabase
          .from('coach_athlete_relationships')
          .select('id, athlete_id, coach_id, status, created_at')
          .eq('coach_id', coachUserId)
          .eq('status', 'active');
        if (r2 && r2.length > 0) rels = r2;
      }

      // Also check local storage relationships for instant optimistic reactivity
      try {
        const rawLocals = localStorage.getItem('sportx_coach_athlete_relationships');
        if (rawLocals) {
          const localRels = JSON.parse(rawLocals);
          for (const lr of localRels) {
            if (
              (lr.coach_id === coachProfId || lr.coach_id === coachUserId) &&
              lr.status === 'active' &&
              !rels.some((r) => r.athlete_id === lr.athlete_id)
            ) {
              rels.push(lr);
            }
          }
        }
      } catch {}

      if (rels.length === 0) {
        return [];
      }

      // 3. For each active relationship, fetch real athlete profile, user profile, and real workout sessions
      const roster: CoachRosterAthlete[] = [];

      for (const rel of rels) {
        const athleteId = String(rel.athlete_id);

        // Fetch athlete_profiles
        let ap: any = null;
        const { data: apData } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('id', athleteId)
          .maybeSingle();

        if (apData) {
          ap = apData;
        } else {
          // Check by user_id
          const { data: apByUser } = await supabase
            .from('athlete_profiles')
            .select('*')
            .eq('user_id', athleteId)
            .maybeSingle();
          if (apByUser) ap = apByUser;
        }

        const athleteProfileId = ap?.id || athleteId;
        const athleteUserId = ap?.user_id || athleteId;

        // Fetch user profile from profiles table
        let userProf: any = null;
        if (athleteUserId) {
          const { data: upData } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', athleteUserId)
            .maybeSingle();
          userProf = upData;
        }

        // Fetch real workout sessions for this athlete
        const { data: sessionsData } = await supabase
          .from('workout_sessions')
          .select(`
            id,
            overall_score,
            created_at,
            exercises:exercise_id (name)
          `)
          .eq('athlete_id', athleteProfileId)
          .order('created_at', { ascending: false });

        const sessions = sessionsData || [];
        const latestSession = sessions[0];
        const avgScore =
          sessions.length > 0
            ? Math.round(
                sessions.reduce((acc: number, curr: any) => acc + (Number(curr.overall_score) || 0), 0) /
                  sessions.length
              )
            : 0;

        roster.push({
          athlete_id: athleteProfileId,
          user_id: athleteUserId,
          full_name: userProf?.full_name || 'Athlete',
          email: userProf?.email || '',
          sport: ap?.sport || 'General Fitness',
          training_level: ap?.training_level || 'Intermediate',
          anonymized_subject_id: ap?.anonymized_subject_id || `ATH-${athleteProfileId.slice(0, 6)}`,
          total_sessions: sessions.length,
          recent_average_score: avgScore,
          average_technique_score: avgScore,
          latest_session_exercise: (latestSession as any)?.exercises?.name || '',
          latest_session_score: latestSession?.overall_score ?? null,
          latest_session_date: latestSession?.created_at || rel.created_at || new Date().toISOString(),
          pending_assignments: 0,
          status: rel.status || 'active',
        });
      }

      return roster;
    } catch (e) {
      console.error('Error in getSupervisedAthletes:', e);
      return [];
    }
  },

  async getAthleteFullDossier(athleteIdOrUserId: string | number) {
    const queryId = String(athleteIdOrUserId);
    if (!isSupabaseConfigured() || !queryId) {
      return null;
    }

    try {
      // 1. Resolve athlete_profiles record
      let athleteProfile: any = null;
      const { data: apById } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', queryId)
        .maybeSingle();

      if (apById) {
        athleteProfile = apById;
      } else {
        const { data: apByUser } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', queryId)
          .maybeSingle();
        if (apByUser) athleteProfile = apByUser;
      }

      if (!athleteProfile) {
        return null;
      }

      const athleteId = athleteProfile.id;
      const userId = athleteProfile.user_id;

      // 2. Fetch athlete's user profile (profiles table)
      let userProfile: any = null;
      if (userId) {
        const { data: uProf } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, role')
          .eq('id', userId)
          .maybeSingle();
        userProfile = uProf;
      }

      // 3. Fetch all workout sessions for this athlete (check both athleteProfile.id and user_id)
      let sessionsData: any[] = [];
      const { data: sData } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:exercise_id (name, slug),
          technique_issues (*)
        `)
        .or(`athlete_id.eq.${athleteId},athlete_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (sData && sData.length > 0) {
        sessionsData = sData;
      } else {
        // Fallback: check by athleteId alone
        const { data: sById } = await supabase
          .from('workout_sessions')
          .select(`
            *,
            exercises:exercise_id (name, slug),
            technique_issues (*)
          `)
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false });
        if (sById) sessionsData = sById;
      }

      const sessions = sessionsData || [];

      // 4. Fetch sleep records for this athlete (check both athlete_id and user_id, plus local storage fallback)
      let sleepRecords: any[] = [];
      const { data: sleepData } = await supabase
        .from('sleep_records')
        .select('*')
        .or(`athlete_id.eq.${athleteId},athlete_id.eq.${userId}`)
        .order('sleep_date', { ascending: false })
        .limit(14);

      if (sleepData && sleepData.length > 0) {
        sleepRecords = sleepData;
      } else {
        // Check local storage for instant sync if logged on this device
        try {
          const rawSleep = localStorage.getItem(`sportx_sleep_records_${userId}`);
          if (rawSleep) sleepRecords = JSON.parse(rawSleep);
        } catch {}
      }

      // 5. Fetch nutrition records AND meal_logs for this athlete
      let mergedNutrition: any[] = [];

      // 5a. Query nutrition_records
      const { data: nrData } = await supabase
        .from('nutrition_records')
        .select('*')
        .or(`athlete_id.eq.${athleteId},athlete_id.eq.${userId}`)
        .order('date', { ascending: false })
        .limit(14);

      if (nrData && nrData.length > 0) {
        mergedNutrition.push(...nrData);
      }

      // 5b. Query meal_logs (populated by NutritionView)
      if (userId) {
        const { data: mlData } = await supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(14);

        if (mlData && mlData.length > 0) {
          for (const ml of mlData) {
            const mlDate = ml.created_at ? ml.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            if (!mergedNutrition.some((n) => n.id === ml.id || (n.meal_description === ml.description && n.date === mlDate))) {
              mergedNutrition.push({
                id: ml.id,
                athlete_id: athleteId,
                date: mlDate,
                meal_type: ml.meal_type || 'MEAL',
                meal_description: ml.food_name || ml.description || 'Meal',
                calories: Math.round(Number(ml.calories) || 0),
                protein_g: Number(ml.protein) || 0,
                carbs_g: Number(ml.carbohydrates) || 0,
                fats_g: Number(ml.fat) || 0,
                water_ml: 250,
                created_at: ml.created_at,
              });
            }
          }
        } else {
          // Local storage fallback for meals logged on this device
          try {
            const rawMeals = localStorage.getItem(`sportx_meals_${userId}`);
            if (rawMeals) {
              const localMeals = JSON.parse(rawMeals);
              for (const lm of localMeals) {
                const lmDate = lm.created_at ? lm.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
                mergedNutrition.push({
                  id: lm.id,
                  athlete_id: athleteId,
                  date: lmDate,
                  meal_type: lm.meal_type,
                  meal_description: lm.food_name || lm.description,
                  calories: lm.calories,
                  protein_g: lm.protein,
                  carbs_g: lm.carbs,
                  fats_g: lm.fat,
                  water_ml: 250,
                  created_at: lm.created_at,
                });
              }
            }
          } catch {}
        }
      }

      // Sort merged nutrition by date descending
      mergedNutrition.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
      const nutritionRecords = mergedNutrition;

      // 6. Fetch recovery records for this athlete
      const { data: recoveryData } = await supabase
        .from('recovery_records')
        .select('*')
        .or(`athlete_id.eq.${athleteId},athlete_id.eq.${userId}`)
        .order('log_date', { ascending: false })
        .limit(7);

      const recoveryRecords = recoveryData || [];

      // 7. Calculate real aggregated metrics
      const totalSessions = sessions.length;
      let avgScore: number | null = null;
      let avgSymmetry: number | null = null;
      let totalReps = 0;
      let totalDurationMinutes = 0;
      const issueCounts: Record<string, number> = {};

      if (totalSessions > 0) {
        const totalScoreSum = sessions.reduce((acc: number, s: any) => acc + (Number(s.overall_score) || 0), 0);
        avgScore = Math.round(totalScoreSum / totalSessions);

        const symSessions = sessions.filter((s: any) => s.symmetry_score != null && Number(s.symmetry_score) > 0);
        if (symSessions.length > 0) {
          avgSymmetry = Math.round(symSessions.reduce((acc: number, s: any) => acc + Number(s.symmetry_score), 0) / symSessions.length);
        }

        totalReps = sessions.reduce((acc: number, s: any) => acc + (Number(s.total_reps) || 0), 0);
        totalDurationMinutes = Math.round(sessions.reduce((acc: number, s: any) => acc + (Number(s.duration_seconds) || 0), 0) / 60);

        // Aggregate real technique issues
        for (const sess of sessions) {
          const issues = sess.technique_issues || [];
          for (const iss of issues) {
            const name = iss.error_name || iss.error_code || 'Technique Deviation';
            issueCounts[name] = (issueCounts[name] || 0) + 1;
          }
        }
      }

      // Real sleep average
      let avgSleepHours: number | null = null;
      if (sleepRecords.length > 0) {
        const totalMinutes = sleepRecords.reduce((acc: number, r: any) => acc + (Number(r.duration_minutes) || Number(r.total_sleep_minutes) || 0), 0);
        avgSleepHours = Number((totalMinutes / sleepRecords.length / 60).toFixed(1));
      }

      // Real recent calories
      let recentCalories: number | null = null;
      if (nutritionRecords.length > 0) {
        recentCalories = nutritionRecords[0].calories || null;
      }

      // 8. Generate or extract intelligent AI feedback
      const latestSession = sessions[0];
      let latestFeedback = latestSession?.feedback_summary || null;

      // If no feedback or just a default short string, generate comprehensive AI biomechanical & holistic analysis
      if (!latestFeedback || latestFeedback.length < 25) {
        if (totalSessions > 0) {
          const exName = (latestSession as any)?.exercises?.name || 'Workout';
          const feedbackParts: string[] = [];

          if (avgScore && avgScore >= 85) {
            feedbackParts.push(`Отличный уровень биомеханики (${avgScore}%). Кинематическая цепь стабильна, траектория движения близка к эталонной.`);
          } else if (avgScore && avgScore >= 70) {
            feedbackParts.push(`Хороший базовый уровень техники (${avgScore}%). Рекомендуется удерживать стабильный темп и контролировать нижнюю точку траектории.`);
          } else if (avgScore) {
            feedbackParts.push(`Техника требует внимания (${avgScore}%). Выявлены систематические отклонения под нагрузкой, требующие коррекции тренера.`);
          }

          if (avgSymmetry != null && avgSymmetry > 0) {
            if (avgSymmetry >= 88) {
              feedbackParts.push(`Симметрия движения сбалансирована (${avgSymmetry}%). Нагрузка равномерно распределяется между левой и правой сторонами.`);
            } else {
              feedbackParts.push(`Зафиксирована боковая асимметрия (${avgSymmetry}%). Обратите внимание на компенсаторный перенос веса.`);
            }
          }

          const topIssues = Object.entries(issueCounts);
          if (topIssues.length > 0) {
            const issueList = topIssues.map(([name, count]) => `${name} (${count}x)`).join(', ');
            feedbackParts.push(`Точки внимания: ${issueList}.`);
          } else {
            feedbackParts.push(`Критических нарушений углов в суставах не выявлено.`);
          }

          if (avgSleepHours != null && avgSleepHours > 0) {
            if (avgSleepHours < 7.0) {
              feedbackParts.push(`Сон атлета (${avgSleepHours}ч) ниже нормы: утомление может ухудшать контроль техники.`);
            } else {
              feedbackParts.push(`Восстановление: сон атлета в норме (${avgSleepHours}ч).`);
            }
          }

          latestFeedback = feedbackParts.join(' ');
        }
      }

      return {
        athlete_id: athleteId,
        user_id: userId,
        full_name: userProfile?.full_name || 'Athlete',
        email: userProfile?.email || '',
        avatar_url: userProfile?.avatar_url,
        sport: athleteProfile.sport || 'General Fitness',
        training_level: athleteProfile.training_level || 'Intermediate',
        anonymized_subject_id: athleteProfile.anonymized_subject_id || `ATH-${athleteId.slice(0, 6)}`,
        height_cm: athleteProfile.height_cm || null,
        weight_kg: athleteProfile.weight_kg || null,
        date_of_birth: athleteProfile.date_of_birth || null,
        gender: athleteProfile.gender || null,
        fitness_goals: athleteProfile.fitness_goals || null,
        total_sessions: totalSessions,
        average_technique_score: avgScore,
        average_symmetry: avgSymmetry,
        total_reps: totalReps,
        total_duration_minutes: totalDurationMinutes,
        average_sleep_hours: avgSleepHours,
        recent_calories: recentCalories,
        readiness_score: recoveryRecords[0]?.calculated_readiness_score || null,
        issue_distribution: issueCounts,
        latest_session_feedback: latestFeedback,
        sessions: sessions.map((s: any) => ({
          id: s.id,
          exercise_id: s.exercise_id,
          exercise_name: s.exercises?.name || 'Workout',
          exercise_slug: s.exercises?.slug || 'squat',
          session_type: s.session_type || 'LIVE_CAMERA',
          duration_seconds: s.duration_seconds || 0,
          total_reps: s.total_reps || 0,
          valid_reps: s.valid_reps || 0,
          overall_score: s.overall_score || 0,
          alignment_score: s.alignment_score,
          rom_score: s.rom_score,
          symmetry_score: s.symmetry_score,
          tempo_score: s.tempo_score,
          stability_score: s.stability_score,
          feedback_summary: s.feedback_summary,
          created_at: s.created_at,
          issues_count: (s.technique_issues || []).length,
        })),
        sleep_records: sleepRecords,
        nutrition_records: nutritionRecords,
        recovery_records: recoveryRecords,
      };
    } catch (err) {
      console.error('Error in getAthleteFullDossier:', err);
      return null;
    }
  },

  async getCoachAlerts(coachUserId: string): Promise<NotificationItem[]> {
    if (isSupabaseConfigured() && coachUserId) {
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', coachUserId)
        .order('created_at', { ascending: false });

      if (!error && notifs && notifs.length > 0) {
        return notifs.map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          severity: n.severity as any,
          is_read: n.is_read || n.read || false,
          category: n.category || 'TECHNIQUE',
          created_at: n.created_at,
        }));
      }
    }

    return api.getCoachAlerts();
  },

  async addCoachComment(commentData: InsertTables<'coach_comments'>): Promise<Tables<'coach_comments'> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('coach_comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Trainer Feedback, Notes & Recommendations
  async addTrainerFeedback(payload: {
    trainer_id: string;
    athlete_id: string;
    trainer_name?: string;
    athlete_name?: string;
    session_id?: string | number | null;
    exercise_name?: string | null;
    type: 'feedback' | 'note' | 'recommendation';
    title?: string;
    content: string;
  }) {
    const newFeedback = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fb-${Date.now()}`,
      trainer_id: payload.trainer_id,
      athlete_id: payload.athlete_id,
      trainer_name: payload.trainer_name || 'Coach',
      athlete_name: payload.athlete_name || 'Athlete',
      session_id: payload.session_id || null,
      exercise_name: payload.exercise_name || null,
      type: payload.type,
      title: payload.title || (payload.type === 'feedback' ? 'Technique Feedback' : payload.type === 'note' ? 'Trainer Note' : 'Recommendation'),
      content: payload.content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .insert({
            trainer_id: payload.trainer_id,
            athlete_id: payload.athlete_id,
            session_id: payload.session_id ? String(payload.session_id) : null,
            type: payload.type,
            title: newFeedback.title,
            content: payload.content,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            ...newFeedback,
            id: data.id,
            created_at: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Notice saving feedback to Supabase, saving to resilient store:', err);
      }
    }

    // Resilient local storage fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        localStorage.setItem('sportx_trainer_feedback', JSON.stringify([newFeedback, ...existing]));
      } catch {}
    }

    return newFeedback;
  },

  async getAthleteTrainerFeedback(athleteId: string) {
    if (isSupabaseConfigured() && athleteId) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .select('*')
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            trainer_id: d.trainer_id,
            athlete_id: d.athlete_id,
            session_id: d.session_id,
            type: d.type || 'feedback',
            title: d.title || (d.type === 'note' ? 'Trainer Note' : 'Technique Recommendation'),
            content: d.content,
            created_at: d.created_at,
            is_read: d.is_read || false,
          }));
        }
      } catch (err) {
        console.warn('Notice fetching trainer feedback from Supabase:', err);
      }
    }

    // Local fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        return existing.filter((item: any) => String(item.athlete_id) === String(athleteId) || !item.athlete_id);
      } catch {}
    }

    return [];
  },

  async getTrainerAthleteFeedback(trainerId: string, athleteId: string) {
    if (isSupabaseConfigured() && trainerId && athleteId) {
      try {
        const { data, error } = await supabase
          .from('trainer_feedback')
          .select('*')
          .eq('trainer_id', trainerId)
          .eq('athlete_id', athleteId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Notice fetching trainer authored feedback from Supabase:', err);
      }
    }

    // Local fallback
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('sportx_trainer_feedback') || '[]');
        return existing.filter(
          (item: any) =>
            (String(item.trainer_id) === String(trainerId) || !item.trainer_id) &&
            (String(item.athlete_id) === String(athleteId) || !item.athlete_id)
        );
      } catch {}
    }

    return [];
  },
};
