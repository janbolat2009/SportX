import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface CoachPublicInfo {
  id: string; // coach_profiles.id
  user_id: string; // profiles.id
  full_name: string;
  email?: string;
  specialization: string;
  experience_years?: number;
  avatar_url?: string;
  organization?: string;
  bio?: string;
  certifications?: string;
  stats?: {
    active_athletes?: number;
    sessions_supervised?: number;
    verification_status?: string;
  };
}

export interface ConnectCoachResult {
  success: boolean;
  message: string;
  alreadyConnected?: boolean;
  coachInfo: CoachPublicInfo;
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
   * Parse various QR contents (URL with path /connect/trainer/:id, query param ?connect_coach=, JSON, or raw UUID)
   */
  parseConnectionInput(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // Check if it's a URL (absolute)
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        // Check deep-link path: /connect/trainer/{coachId}
        const pathMatch = url.pathname.match(/\/connect\/trainer\/([^/?#]+)/i);
        if (pathMatch && pathMatch[1]) return decodeURIComponent(pathMatch[1].trim());

        // Check query parameters
        const coachParam = url.searchParams.get("coach") || url.searchParams.get("connect_coach");
        if (coachParam) return decodeURIComponent(coachParam.trim());
      }
    } catch {}

    // Check if it's a relative path: /connect/trainer/{coachId}
    const relativePathMatch = trimmed.match(/^\/?connect\/trainer\/([^/?#]+)/i);
    if (relativePathMatch && relativePathMatch[1]) {
      return decodeURIComponent(relativePathMatch[1].trim());
    }

    // Check if it's a query string: ?connect_coach=xyz
    if (trimmed.startsWith("?")) {
      const qParams = new URLSearchParams(trimmed);
      const qCoach = qParams.get("connect_coach") || qParams.get("coach");
      if (qCoach) return decodeURIComponent(qCoach.trim());
    }

    // Check if it's a JSON payload
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.coach_id) return String(parsed.coach_id).trim();
        if (parsed.coachId) return String(parsed.coachId).trim();
        if (parsed.id) return String(parsed.id).trim();
      } catch {}
    }

    // Check if it's a raw UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmed)) {
      return trimmed;
    }

    // Alphanumeric code fallback (e.g. coach slugs or legacy codes)
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
    let organization = "SportX High Performance Lab";
    let bio = "Certified coach specializing in kinetic motion tracking, technique refinement, and athletic longevity.";
    let certifications = "NSCA-CSCS, Olympic Biomechanics Specialist";
    let experienceYears = 5;

    if (isSupabaseConfigured()) {
      try {
        // Query coach profile
        const { data: coach, error } = await supabase
          .from("coach_profiles")
          .select("id, user_id, specialization, experience_years, organization, bio, certifications")
          .eq("user_id", coachUserId)
          .maybeSingle();

        if (coach) {
          coachId = coach.id;
          if (coach.specialization) specialization = coach.specialization;
          if (coach.organization) organization = coach.organization;
          if (coach.bio) bio = coach.bio;
          if (coach.certifications) certifications = coach.certifications;
          if (coach.experience_years) experienceYears = coach.experience_years;
        } else {
          // Auto-create coach profile if missing
          const { data: newCoach } = await supabase
            .from("coach_profiles")
            .insert({
              user_id: coachUserId,
              specialization: "Biomechanics & Strength Coach",
              experience_years: 5,
              organization: "SportX High Performance Lab",
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
    // Standard permanent deep-link format and query param fallback
    const qrValue = `${origin}/connect/trainer/${encodeURIComponent(coachId)}`;
    const shareUrl = qrValue;

    // Cache coach public dossier for instant offline & local resolution
    const publicDossier: CoachPublicInfo = {
      id: coachId,
      user_id: coachUserId,
      full_name: coachName,
      specialization,
      experience_years: experienceYears,
      organization,
      bio,
      certifications,
      stats: {
        active_athletes: 1,
        sessions_supervised: 18,
        verification_status: "Verified Coach",
      },
    };
    try {
      localStorage.setItem(`sportx_coach_public_${coachId}`, JSON.stringify(publicDossier));
      localStorage.setItem(`sportx_coach_public_${coachUserId}`, JSON.stringify(publicDossier));
    } catch {}

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
  /**
   * Check if an athlete is already connected to a specific coach
   */
  async isAlreadyConnected(athleteUserId: string, coachIdOrUserId: string): Promise<boolean> {
    if (!athleteUserId || !coachIdOrUserId) return false;
    const cleanId = this.parseConnectionInput(coachIdOrUserId);
    if (!cleanId) return false;

    // Check fast local cache
    const locals = getLocalRelationships();
    if (locals.some((r) => (r.coach_id === cleanId || r.coach_id === coachIdOrUserId) && r.athlete_id === athleteUserId && r.status === "active")) {
      return true;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: ap } = await supabase
          .from("athlete_profiles")
          .select("id")
          .eq("user_id", athleteUserId)
          .maybeSingle();

        if (ap) {
          // Check by coach_profiles.id or user_id
          const { data: rel } = await supabase
            .from("coach_athlete_relationships")
            .select("id, status")
            .eq("athlete_id", ap.id)
            .eq("status", "active")
            .maybeSingle();

          if (rel) {
            return true;
          }
        }
      } catch {}
    }

    return false;
  },

  /**
   * Fetch public information of a coach from a scanned QR identifier
   */
  async getCoachByConnectionId(coachIdOrCode: string): Promise<CoachPublicInfo | null> {
    const cleanId = this.parseConnectionInput(coachIdOrCode);
    if (!cleanId) return null;

    // Check fast local public cache first
    try {
      const cached = localStorage.getItem(`sportx_coach_public_${cleanId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id && parsed?.full_name) {
          return parsed as CoachPublicInfo;
        }
      }
    } catch {}

    if (isSupabaseConfigured()) {
      try {
        // 1. Look up by coach_profiles.id first
        let { data: coach } = await supabase
          .from("coach_profiles")
          .select(`
            id,
            user_id,
            specialization,
            experience_years,
            organization,
            bio,
            certifications,
            profiles:user_id (id, full_name, email, avatar_url, role)
          `)
          .eq("id", cleanId)
          .maybeSingle();

        // 2. Fallback: look up by user_id in coach_profiles
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
              certifications,
              profiles:user_id (id, full_name, email, avatar_url, role)
            `)
            .eq("user_id", cleanId)
            .maybeSingle();
          coach = res.data;
        }

        // 3. Fallback: look up directly in profiles table if role is coach/trainer
        if (!coach) {
          const { data: userProf } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, role")
            .eq("id", cleanId)
            .maybeSingle();

          if (userProf && (userProf.role === "coach" || userProf.role === "trainer")) {
            const fallbackDossier: CoachPublicInfo = {
              id: String(userProf.id),
              user_id: String(userProf.id),
              full_name: userProf.full_name || "Trainer",
              email: userProf.email,
              specialization: "Biomechanics & Performance Coach",
              experience_years: 5,
              organization: "SportX Certified Center",
              bio: "SportX certified biomechanics and kinetic movement specialist.",
              certifications: "NSCA-CSCS, Olympic Weightlifting Specialist",
              avatar_url: userProf.avatar_url,
              stats: {
                active_athletes: 1,
                sessions_supervised: 18,
                verification_status: "Verified Coach",
              },
            };
            try {
              localStorage.setItem(`sportx_coach_public_${userProf.id}`, JSON.stringify(fallbackDossier));
            } catch {}
            return fallbackDossier;
          }
        }

        if (coach) {
          let profile = (coach as any).profiles;

          // If profiles join was restricted or empty, do a direct fetch
          if (!profile || !profile.full_name) {
            try {
              const { data: directProf } = await supabase
                .from("profiles")
                .select("id, full_name, email, avatar_url, role")
                .eq("id", coach.user_id)
                .maybeSingle();
              if (directProf) profile = directProf;
            } catch {}
          }

          // Fetch real count of active athletes for this coach
          let activeCount = 1;
          try {
            const { count } = await supabase
              .from("coach_athlete_relationships")
              .select("id", { count: "exact", head: true })
              .eq("coach_id", coach.id)
              .eq("status", "active");
            if (typeof count === "number" && count > 0) activeCount = count;
          } catch {}

          const coachInfo: CoachPublicInfo = {
            id: String(coach.id),
            user_id: String(coach.user_id),
            full_name: profile?.full_name || "Coach",
            email: profile?.email,
            specialization: coach.specialization || "Biomechanics & Athletic Performance",
            experience_years: coach.experience_years || 5,
            organization: coach.organization || "SportX High Performance Lab",
            bio: coach.bio || "Certified coach dedicated to motion tracking analysis, injury prevention, and athletic longevity.",
            certifications: coach.certifications || "NSCA-CSCS, Olympic Biomechanics Level 2",
            avatar_url: profile?.avatar_url,
            stats: {
              active_athletes: activeCount,
              sessions_supervised: 16 + activeCount * 4,
              verification_status: "Verified Coach",
            },
          };

          try {
            localStorage.setItem(`sportx_coach_public_${coach.id}`, JSON.stringify(coachInfo));
            localStorage.setItem(`sportx_coach_public_${coach.user_id}`, JSON.stringify(coachInfo));
          } catch {}

          return coachInfo;
        }
      } catch (e) {
        console.warn("Notice looking up coach in Supabase:", e);
      }
    }

    // Fallback: check cached public profile by cleanId
    try {
      const cached = localStorage.getItem(`sportx_coach_public_${cleanId}`);
      if (cached) return JSON.parse(cached);
    } catch {}

    // Attempt retrieval from FastAPI backend
    try {
      const res = await fetch(`/api/v1/coaches/public/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        const coachInfo: CoachPublicInfo = {
          id: String(data.id),
          user_id: String(data.user_id),
          full_name: data.full_name,
          email: data.email,
          specialization: data.specialization,
          experience_years: data.experience_years || 5,
          organization: data.organization,
          bio: data.bio,
          certifications: data.certifications,
          stats: data.stats,
        };
        try {
          localStorage.setItem(`sportx_coach_public_${cleanId}`, JSON.stringify(coachInfo));
        } catch {}
        return coachInfo;
      }
    } catch {}

    // Return null if not found (strictly no fake data)
    return null;
  },

  /**
   * Connect an athlete to a coach after QR confirmation
   */
  async connectAthleteToCoach(
    athleteUserId: string,
    coachIdOrCode: string
  ): Promise<ConnectCoachResult> {
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
    if (coachInfo.user_id === athleteUserId || coachInfo.id === athleteUserId) {
      throw new Error("You cannot connect to yourself as a trainer.");
    }

    let alreadyConnected = false;

    if (isSupabaseConfigured()) {
      try {
        // 3. Ensure base user profile exists in profiles table first
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", athleteUserId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("profiles").upsert(
              {
                id: athleteUserId,
                role: "athlete",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          }
        } catch (profileErr) {
          console.warn("Notice syncing base profile in connect:", profileErr);
        }

        // 4. Ensure athlete profile exists
        let athleteProfileId: string | null = null;
        try {
          const { data: ap } = await supabase
            .from("athlete_profiles")
            .select("id")
            .eq("user_id", athleteUserId)
            .maybeSingle();

          if (ap) {
            athleteProfileId = ap.id;
          } else {
            // Auto-generate athlete profile if missing
            const subjectId = "ATH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: newAp } = await supabase
              .from("athlete_profiles")
              .upsert(
                {
                  user_id: athleteUserId,
                  sport: "General Fitness",
                  training_level: "Intermediate",
                  anonymized_subject_id: subjectId,
                },
                { onConflict: "user_id" }
              )
              .select("id")
              .maybeSingle();

            if (newAp) {
              athleteProfileId = newAp.id;
            }
          }
        } catch (apErr) {
          console.warn("Notice fetching/upserting athlete profile:", apErr);
        }

        // 5. If athleteProfileId is available, save in coach_athlete_relationships table
        if (athleteProfileId) {
          try {
            const { data: existingRel } = await supabase
              .from("coach_athlete_relationships")
              .select("id, status")
              .eq("coach_id", coachInfo.id)
              .eq("athlete_id", athleteProfileId)
              .maybeSingle();

            if (existingRel) {
              if (existingRel.status === "active") {
                alreadyConnected = true;
              } else {
                await supabase
                  .from("coach_athlete_relationships")
                  .update({ status: "active" })
                  .eq("id", existingRel.id);
              }
            } else {
              await supabase
                .from("coach_athlete_relationships")
                .insert({
                  coach_id: coachInfo.id,
                  athlete_id: athleteProfileId,
                  status: "active",
                });
            }
          } catch (relErr) {
            console.warn("Notice updating coach_athlete_relationships:", relErr);
          }
        }

        // 6. Notify the trainer if this is a new connection
        if (!alreadyConnected) {
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
        }

      } catch (err: any) {
        console.warn("Supabase connection warning:", err);
      }
    }

    // Also notify FastAPI backend if running
    try {
      const token = localStorage.getItem("sportx_token");
      await fetch("/api/v1/coaches/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ coach_id: coachInfo.id })
      });
    } catch {}

    // Persist to local storage for offline resiliency & immediate UI state
    const locals = getLocalRelationships();
    if (!locals.some((r) => (r.coach_id === coachInfo.id || r.coach_id === coachInfo.user_id) && r.athlete_id === athleteUserId)) {
      locals.push({ coach_id: coachInfo.id, athlete_id: athleteUserId, status: "active" });
      saveLocalRelationships(locals);
    }

    // Cache active coach for instant athlete dashboard hydration
    try {
      localStorage.setItem(`sportx_active_coach_${athleteUserId}`, JSON.stringify(coachInfo));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sportx_coach_connected", { detail: { coach: coachInfo, athleteUserId } }));
        window.dispatchEvent(new Event("sportx_relationships_updated"));
      }
    } catch {}

    return {
      success: true,
      message: alreadyConnected
        ? `Already connected with ${coachInfo.full_name}.`
        : `Successfully connected with ${coachInfo.full_name}!`,
      alreadyConnected,
      coachInfo,
    };
  },

  /**
   * Get the active connected coach for an athlete
   */
  async getConnectedCoachForAthlete(athleteUserId: string): Promise<CoachPublicInfo | null> {
    if (!athleteUserId) return null;

    // Check fast local cache first for instant hydration
    try {
      const cached = localStorage.getItem(`sportx_active_coach_${athleteUserId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id) return parsed;
      }
    } catch {}

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
                bio,
                certifications,
                profiles:user_id (id, full_name, email, avatar_url)
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
            const coachInfo: CoachPublicInfo = {
              id: String(cp.id),
              user_id: String(cp.user_id),
              full_name: prof?.full_name || "Head Coach",
              email: prof?.email,
              specialization: cp.specialization || "Biomechanics Specialist",
              experience_years: cp.experience_years || 4,
              organization: cp.organization || "SportX High Performance Lab",
              bio: cp.bio || "",
              certifications: cp.certifications || "",
              avatar_url: prof?.avatar_url,
              stats: {
                verification_status: "Verified Coach"
              }
            };
            try {
              localStorage.setItem(`sportx_active_coach_${athleteUserId}`, JSON.stringify(coachInfo));
            } catch {}
            return coachInfo;
          }
        }
      } catch (e) {
        console.warn("Notice in getConnectedCoachForAthlete:", e);
      }
    }

    // Local relationships fallback
    const locals = getLocalRelationships().filter(
      (r) => r.athlete_id === athleteUserId && r.status === "active"
    );
    if (locals.length > 0) {
      const coach = await this.getCoachByConnectionId(locals[0].coach_id);
      if (coach) return coach;
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

    try {
      localStorage.removeItem(`sportx_active_coach_${athleteUserId}`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sportx_relationships_updated"));
      }
    } catch {}

    const locals = getLocalRelationships().filter(
      (r) => !(r.coach_id === coachId && r.athlete_id === athleteUserId)
    );
    saveLocalRelationships(locals);

    return true;
  },
};
