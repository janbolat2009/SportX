import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface CoachPublicInfo {
  id: string; // coach_profiles.id
  user_id: string; // profiles.id
  full_name: string;
  specialization: string;
  experience_years?: number;
  avatar_url?: string;
  organization?: string;
  bio?: string;
}

export interface CoachConnectionPayload {
  coachId: string;
  coachUserId: string;
  coachName: string;
  specialization: string;
  qrValue: string;
  shareUrl: string;
}

const LOCAL_RELATIONSHIPS_KEY = "sportx_coach_athlete_relationships";

function getLocalRelationships(): Array<{ coach_id: string; athlete_id: string; status: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_RELATIONSHIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRelationships(rels: Array<{ coach_id: string; athlete_id: string; status: string }>) {
  try {
    localStorage.setItem(LOCAL_RELATIONSHIPS_KEY, JSON.stringify(rels));
  } catch {}
}

export const trainerConnectionService = {
  /**
   * Parse various QR contents (URL with query param, JSON, or raw UUID)
   */
  parseConnectionInput(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // Check if it's a URL with coach parameter
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const coachParam = url.searchParams.get("coach") || url.searchParams.get("connect_coach");
        if (coachParam) return coachParam.trim();
      }
    } catch {}

    // Check if it's a JSON payload
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.coach_id) return String(parsed.coach_id).trim();
        if (parsed.id) return String(parsed.id).trim();
      } catch {}
    }

    // Check if it's a raw UUID or string ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmed)) {
      return trimmed;
    }

    // Alphanumeric code fallback
    if (/^[0-9a-zA-Z_-]{4,64}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  },

  /**
   * Get or generate the permanent QR connection payload for a trainer
   */
  async getCoachConnectionPayload(
    coachUserId: string,
    fallbackName = "Coach"
  ): Promise<CoachConnectionPayload | null> {
    if (!coachUserId) return null;

    let coachId = coachUserId;
    let coachName = fallbackName;
    let specialization = "Biomechanics & Strength Coach";

    if (isSupabaseConfigured()) {
      try {
        // Query coach profile
        const { data: coach, error } = await supabase
          .from("coach_profiles")
          .select("id, user_id, specialization")
          .eq("user_id", coachUserId)
          .maybeSingle();

        if (coach) {
          coachId = coach.id;
          if (coach.specialization) specialization = coach.specialization;
        } else {
          // Auto-create coach profile if missing
          const { data: newCoach } = await supabase
            .from("coach_profiles")
            .insert({
              user_id: coachUserId,
              specialization: "Biomechanics & Strength Coach",
              experience_years: 3,
            })
            .select("id, specialization")
            .maybeSingle();

          if (newCoach) {
            coachId = newCoach.id;
          }
        }

        // Fetch name from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", coachUserId)
          .maybeSingle();

        if (profile?.full_name) {
          coachName = profile.full_name;
        }
      } catch (err) {
        console.warn("Notice in getCoachConnectionPayload:", err);
      }
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "https://sportx.app";
    // Permanent connection link encoded in QR code
    const qrValue = `${origin}/?connect_coach=${encodeURIComponent(coachId)}`;
    const shareUrl = qrValue;

    return {
      coachId,
      coachUserId,
      coachName,
      specialization,
      qrValue,
      shareUrl,
    };
  },

  /**
   * Fetch public information of a coach from a scanned QR identifier
   */
  async getCoachByConnectionId(coachIdOrCode: string): Promise<CoachPublicInfo | null> {
    const cleanId = this.parseConnectionInput(coachIdOrCode);
    if (!cleanId) return null;

    if (isSupabaseConfigured()) {
      try {
        // Look up by coach_profiles.id first
        let { data: coach } = await supabase
          .from("coach_profiles")
          .select(`
            id,
            user_id,
            specialization,
            experience_years,
            organization,
            bio,
            profiles:user_id (id, full_name, avatar_url, role)
          `)
          .eq("id", cleanId)
          .maybeSingle();

        // Fallback: look up by user_id
        if (!coach) {
          const res = await supabase
            .from("coach_profiles")
            .select(`
              id,
              user_id,
              specialization,
              experience_years,
              organization,
              bio,
              profiles:user_id (id, full_name, avatar_url, role)
            `)
            .eq("user_id", cleanId)
            .maybeSingle();
          coach = res.data;
        }

        if (coach) {
          const profile = (coach as any).profiles;
          return {
            id: String(coach.id),
            user_id: String(coach.user_id),
            full_name: profile?.full_name || "Coach",
            specialization: coach.specialization || "Biomechanics Coach",
            experience_years: coach.experience_years || 1,
            organization: coach.organization || "SportX High Performance",
            bio: coach.bio || "",
            avatar_url: profile?.avatar_url,
          };
        }
      } catch (e) {
        console.warn("Notice looking up coach by ID:", e);
      }
    }

    // Local fallback
    return {
      id: cleanId,
      user_id: cleanId,
      full_name: "Coach (SportX Trainer)",
      specialization: "Olympic Biomechanics & Conditioning",
      experience_years: 5,
      organization: "SportX Certified Center",
    };
  },

  /**
   * Connect an athlete to a coach after QR confirmation
   */
  async connectAthleteToCoach(
    athleteUserId: string,
    coachIdOrCode: string
  ): Promise<{ success: boolean; message: string; coachInfo: CoachPublicInfo }> {
    if (!athleteUserId) {
      throw new Error("You must be logged in to connect with a trainer.");
    }

    const cleanCoachId = this.parseConnectionInput(coachIdOrCode);
    if (!cleanCoachId) {
      throw new Error("Invalid trainer QR code. Please scan a valid SportX trainer code.");
    }

    // 1. Fetch coach details
    const coachInfo = await this.getCoachByConnectionId(cleanCoachId);
    if (!coachInfo) {
      throw new Error("Trainer profile not found. The QR code may be invalid or obsolete.");
    }

    // 2. Prevent connecting to yourself
    if (coachInfo.user_id === athleteUserId) {
      throw new Error("You cannot connect to yourself as a trainer.");
    }

    if (isSupabaseConfigured()) {
      try {
        // 3. Ensure athlete profile exists
        let athleteProfileId: string | null = null;
        const { data: ap } = await supabase
          .from("athlete_profiles")
          .select("id")
          .eq("user_id", athleteUserId)
          .maybeSingle();

        if (ap) {
          athleteProfileId = ap.id;
        } else {
          // Auto-generate athlete profile if missing
          const { data: newAp, error: apErr } = await supabase
            .from("athlete_profiles")
            .insert({
              user_id: athleteUserId,
              sport: "General Fitness",
              training_level: "Intermediate",
              anonymized_subject_id: "ATH-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            })
            .select("id")
            .single();

          if (!apErr && newAp) {
            athleteProfileId = newAp.id;
          }
        }

        if (!athleteProfileId) {
          throw new Error("Failed to initialize athlete profile for connection.");
        }

        // 4. Check existing relationship to prevent duplicate connections
        const { data: existingRel } = await supabase
          .from("coach_athlete_relationships")
          .select("id, status")
          .eq("coach_id", coachInfo.id)
          .eq("athlete_id", athleteProfileId)
          .maybeSingle();

        if (existingRel) {
          if (existingRel.status === "active") {
            return {
              success: true,
              message: `You are already actively connected with ${coachInfo.full_name}.`,
              coachInfo,
            };
          } else {
            // Reactivate relationship
            await supabase
              .from("coach_athlete_relationships")
              .update({ status: "active" })
              .eq("id", existingRel.id);
          }
        } else {
          // 5. Insert new relationship
          const { error: insErr } = await supabase
            .from("coach_athlete_relationships")
            .insert({
              coach_id: coachInfo.id,
              athlete_id: athleteProfileId,
              status: "active",
            });

          if (insErr) {
            console.warn("Relationship insert error:", insErr.message);
          }
        }

        // 6. Notify the trainer
        try {
          const { data: athleteUserData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", athleteUserId)
            .maybeSingle();

          const athleteName = athleteUserData?.full_name || "An athlete";

          await supabase.from("notifications").insert({
            user_id: coachInfo.user_id,
            title: "New Athlete Connected",
            message: `${athleteName} scanned your QR code and joined your roster!`,
            category: "TECHNIQUE",
            severity: "low",
            is_read: false,
          });
        } catch {}

      } catch (err: any) {
        if (err.message && !err.message.includes("does not exist")) {
          throw err;
        }
      }
    }

    // Persist to local storage for offline resiliency
    const locals = getLocalRelationships();
    if (!locals.some((r) => r.coach_id === coachInfo.id && r.athlete_id === athleteUserId)) {
      locals.push({ coach_id: coachInfo.id, athlete_id: athleteUserId, status: "active" });
      saveLocalRelationships(locals);
    }

    return {
      success: true,
      message: `Successfully connected with ${coachInfo.full_name}!`,
      coachInfo,
    };
  },

  /**
   * Get the active connected coach for an athlete
   */
  async getConnectedCoachForAthlete(athleteUserId: string): Promise<CoachPublicInfo | null> {
    if (!athleteUserId) return null;

    if (isSupabaseConfigured()) {
      try {
        const { data: ap } = await supabase
          .from("athlete_profiles")
          .select("id")
          .eq("user_id", athleteUserId)
          .maybeSingle();

        if (ap) {
          const { data: rel } = await supabase
            .from("coach_athlete_relationships")
            .select(`
              coach_id,
              status,
              coach_profiles:coach_id (
                id,
                user_id,
                specialization,
                experience_years,
                organization,
                profiles:user_id (id, full_name, avatar_url)
              )
            `)
            .eq("athlete_id", ap.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (rel && (rel as any).coach_profiles) {
            const cp = (rel as any).coach_profiles;
            const prof = cp.profiles;
            return {
              id: String(cp.id),
              user_id: String(cp.user_id),
              full_name: prof?.full_name || "Head Coach",
              specialization: cp.specialization || "Biomechanics Specialist",
              experience_years: cp.experience_years || 2,
              organization: cp.organization,
              avatar_url: prof?.avatar_url,
            };
          }
        }
      } catch (e) {
        console.warn("Notice in getConnectedCoachForAthlete:", e);
      }
    }

    return null;
  },

  /**
   * Disconnect an athlete from a coach
   */
  async disconnectCoach(athleteUserId: string, coachId: string): Promise<boolean> {
    if (!athleteUserId || !coachId) return false;

    if (isSupabaseConfigured()) {
      try {
        const { data: ap } = await supabase
          .from("athlete_profiles")
          .select("id")
          .eq("user_id", athleteUserId)
          .maybeSingle();

        if (ap) {
          await supabase
            .from("coach_athlete_relationships")
            .update({ status: "archived" })
            .eq("coach_id", coachId)
            .eq("athlete_id", ap.id);
        }
      } catch (e) {
        console.warn("Notice disconnecting coach:", e);
      }
    }

    const locals = getLocalRelationships().filter(
      (r) => !(r.coach_id === coachId && r.athlete_id === athleteUserId)
    );
    saveLocalRelationships(locals);

    return true;
  },
};
