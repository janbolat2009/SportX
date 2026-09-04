import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatContact {
  id: string;
  user_id: string;
  full_name: string;
  role: "athlete" | "coach" | "trainer";
  sport?: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const LOCAL_STORAGE_KEY = "sportx_chat_messages";

function getLocalMessages(): DirectMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: DirectMessage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
}

export const chatService = {
  async getConversation(currentUserId: string, otherUserId: string): Promise<DirectMessage[]> {
    if (!currentUserId || !otherUserId) return [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
          )
          .order("created_at", { ascending: true });

        if (!error && data) {
          // Merge with local storage
          const localMsgs = getLocalMessages().filter(
            (m) =>
              (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
              (m.sender_id === otherUserId && m.receiver_id === currentUserId)
          );
          const allIds = new Set(data.map((m) => m.id));
          const missingLocals = localMsgs.filter((m) => !allIds.has(m.id));
          return [...data, ...missingLocals].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      } catch (e) {
        console.warn("Supabase chat fetch notice:", e);
      }
    }

    // Fallback to local storage
    return getLocalMessages()
      .filter(
        (m) =>
          (m.sender_id === currentUserId && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === currentUserId)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
    const newMsg: DirectMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      sender_id: String(senderId),
      receiver_id: String(receiverId),
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            content: content.trim(),
            is_read: false,
            created_at: newMsg.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn("Supabase chat send notice:", e);
      }
    }

    // Persist to local fallback
    const locals = getLocalMessages();
    locals.push(newMsg);
    saveLocalMessages(locals);
    return newMsg;
  },

  async markAsRead(currentUserId: string, otherUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("receiver_id", currentUserId)
          .eq("sender_id", otherUserId);
      } catch (e) {
        console.warn("Supabase chat markRead notice:", e);
      }
    }

    // Update local storage
    const locals = getLocalMessages().map((m) => {
      if (m.receiver_id === currentUserId && m.sender_id === otherUserId) {
        return { ...m, is_read: true };
      }
      return m;
    });
    saveLocalMessages(locals);
  },

  subscribeToMessages(currentUserId: string, onNewMessage: (msg: DirectMessage) => void) {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel("public:direct_messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `receiver_id=eq.${currentUserId}`,
          },
          (payload) => {
            if (payload.new) {
              onNewMessage(payload.new as DirectMessage);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },

  async getContactsForUser(currentUser: any): Promise<ChatContact[]> {
    const isTrainer = currentUser?.role === "coach" || currentUser?.role === "trainer";

    if (isSupabaseConfigured()) {
      try {
        if (isTrainer) {
          // Fetch coach profile id first
          const { data: cp } = await supabase
            .from("coach_profiles")
            .select("id")
            .eq("user_id", String(currentUser.id))
            .maybeSingle();

          if (cp) {
            const { data: rels } = await supabase
              .from("coach_athlete_relationships")
              .select("athlete_id, athlete_profiles(id, user_id, sport, user:users(id, full_name, avatar_url))")
              .eq("coach_id", cp.id)
              .eq("status", "active");

            if (rels && rels.length > 0) {
              return rels
                .filter((r: any) => r.athlete_profiles)
                .map((r: any) => ({
                  id: String(r.athlete_profiles.id),
                  user_id: String(r.athlete_profiles.user_id || r.athlete_profiles.user?.id),
                  full_name: r.athlete_profiles.user?.full_name || "Athlete #" + r.athlete_profiles.id,
                  role: "athlete" as const,
                  sport: r.athlete_profiles.sport || "Track & Field",
                  avatar_url: r.athlete_profiles.user?.avatar_url,
                }));
            }
          }
        } else {
          // Athlete searching for connected trainers
          const { data: ap } = await supabase
            .from("athlete_profiles")
            .select("id")
            .eq("user_id", String(currentUser.id))
            .maybeSingle();

          if (ap) {
            const { data: rels } = await supabase
              .from("coach_athlete_relationships")
              .select("coach_id, coach_profiles(id, user_id, user:users(id, full_name, avatar_url))")
              .eq("athlete_id", ap.id)
              .eq("status", "active");

            if (rels && rels.length > 0) {
              return rels
                .filter((r: any) => r.coach_profiles)
                .map((r: any) => ({
                  id: String(r.coach_profiles.id),
                  user_id: String(r.coach_profiles.user_id || r.coach_profiles.user?.id),
                  full_name: r.coach_profiles.user?.full_name || "Coach / Trainer",
                  role: "trainer" as const,
                  sport: "Master Strength Coach",
                  avatar_url: r.coach_profiles.user?.avatar_url,
                }));
            }
          }
        }
      } catch (err) {
        console.warn("Supabase contacts fetch notice:", err);
      }
    }

    // Default connected contacts fallback
    if (isTrainer) {
      return [
        {
          id: "ath_1",
          user_id: "user_ath_1",
          full_name: "Arman Kazbek",
          role: "athlete",
          sport: "Sprint & Hurdles",
          last_message: "Coach, check my latest squat video form!",
          last_message_time: "10:24 AM",
        },
        {
          id: "ath_2",
          user_id: "user_ath_2",
          full_name: "Elena Rostova",
          role: "athlete",
          sport: "Olympic Weightlifting",
          last_message: "Completed 5 sets of pushups today.",
          last_message_time: "Yesterday",
        },
      ];
    } else {
      return [
        {
          id: "coach_1",
          user_id: "user_coach_1",
          full_name: "Alexey Volkov (Head Coach)",
          role: "trainer",
          sport: "Olympic Biomechanics Expert",
          last_message: "Keep your knees tracked out over your toes during squats.",
          last_message_time: "09:15 AM",
        },
      ];
    }
  },
};
