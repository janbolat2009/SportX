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
  email?: string;
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
  /**
   * Fetch complete message conversation between two users
   */
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
          // Merge with local storage fallback if any offline messages exist
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

  /**
   * Send a direct message and persist to Supabase
   */
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessage> {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error("Message content cannot be empty");
    }

    const newMsg: DirectMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      sender_id: String(senderId),
      receiver_id: String(receiverId),
      content: trimmed,
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
            content: trimmed,
            is_read: false,
            created_at: newMsg.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          // Save a copy locally as cache
          const locals = getLocalMessages();
          locals.push(data);
          saveLocalMessages(locals);
          return data;
        } else if (error) {
          console.warn("Supabase chat send error:", error.message);
        }
      } catch (e) {
        console.warn("Supabase chat send exception:", e);
      }
    }

    // Persist to local fallback
    const locals = getLocalMessages();
    locals.push(newMsg);
    saveLocalMessages(locals);
    return newMsg;
  },

  /**
   * Mark all messages in a conversation sent to current user as read
   */
  async markAsRead(currentUserId: string, otherUserId: string): Promise<void> {
    if (!currentUserId || !otherUserId) return;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("receiver_id", currentUserId)
          .eq("sender_id", otherUserId)
          .eq("is_read", false);
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

  /**
   * Subscribe to Supabase Realtime channel for instant bidirectional message delivery
   */
  subscribeToMessages(
    currentUserId: string,
    onNewMessage: (msg: DirectMessage) => void,
    onMessageUpdated?: (msg: DirectMessage) => void
  ) {
    if (!isSupabaseConfigured() || !currentUserId) {
      return () => {};
    }

    try {
      const channelId = `chat_channel_${currentUserId}_${Date.now()}`;
      const channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
          },
          (payload) => {
            const row = payload.new as DirectMessage;
            if (row && (row.receiver_id === currentUserId || row.sender_id === currentUserId)) {
              onNewMessage(row);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "direct_messages",
          },
          (payload) => {
            const row = payload.new as DirectMessage;
            if (row && (row.receiver_id === currentUserId || row.sender_id === currentUserId)) {
              if (onMessageUpdated) {
                onMessageUpdated(row);
              }
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

  /**
   * Get total unread count for current user
   */
  async getUnreadCount(currentUserId: string): Promise<number> {
    if (!currentUserId) return 0;

    if (isSupabaseConfigured()) {
      try {
        const { count, error } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", currentUserId)
          .eq("is_read", false);

        if (!error && typeof count === "number") {
          return count;
        }
      } catch (e) {
        console.warn("Error getting unread count:", e);
      }
    }

    // Local fallback
    return getLocalMessages().filter((m) => m.receiver_id === currentUserId && !m.is_read).length;
  },

  /**
   * Fetch contacts list for current user from real Supabase users & profiles
   */
  async getContactsForUser(currentUser: any): Promise<ChatContact[]> {
    if (!currentUser?.id) return [];
    const currentUserId = String(currentUser.id);
    const isTrainer = currentUser?.role === "coach" || currentUser?.role === "trainer";

    if (isSupabaseConfigured()) {
      try {
        // 1. Fetch all other registered user profiles from Supabase
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, avatar_url")
          .neq("id", currentUserId);

        // 2. Fetch athlete & coach extra details for richer bio/sport display
        const [{ data: athletes }, { data: coaches }] = await Promise.all([
          supabase.from("athlete_profiles").select("user_id, sport, training_level"),
          supabase.from("coach_profiles").select("user_id, specialization"),
        ]);

        const athleteMap = new Map<string, { sport?: string; training_level?: string }>();
        if (athletes) {
          athletes.forEach((a: any) => athleteMap.set(String(a.user_id), a));
        }

        const coachMap = new Map<string, { specialization?: string }>();
        if (coaches) {
          coaches.forEach((c: any) => coachMap.set(String(c.user_id), c));
        }

        // 3. Fetch recent direct messages for the current user to compute last messages & unread counts
        const { data: messages } = await supabase
          .from("direct_messages")
          .select("id, sender_id, receiver_id, content, is_read, created_at")
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order("created_at", { ascending: false });

        // Map messages by contact user id
        const lastMsgMap = new Map<string, { text: string; time: string; timestamp: number }>();
        const unreadCountMap = new Map<string, number>();

        if (messages && messages.length > 0) {
          for (const msg of messages) {
            const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            
            // First time we encounter this partner in desc order -> this is the latest message
            if (!lastMsgMap.has(partnerId)) {
              const date = new Date(msg.created_at);
              const isToday = date.toDateString() === new Date().toDateString();
              const formattedTime = isToday
                ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : date.toLocaleDateString([], { month: "short", day: "numeric" });

              lastMsgMap.set(partnerId, {
                text: msg.content,
                time: formattedTime,
                timestamp: date.getTime(),
              });
            }

            // Calculate unread count for messages sent TO current user
            if (msg.receiver_id === currentUserId && !msg.is_read) {
              unreadCountMap.set(partnerId, (unreadCountMap.get(partnerId) || 0) + 1);
            }
          }
        }

        // 4. Transform profiles into ChatContact items
        if (profiles && profiles.length > 0) {
          const contactList: ChatContact[] = profiles.map((p) => {
            const pId = String(p.id);
            const athInfo = athleteMap.get(pId);
            const coachInfo = coachMap.get(pId);
            const msgInfo = lastMsgMap.get(pId);
            const unread = unreadCountMap.get(pId) || 0;

            let role: "athlete" | "coach" | "trainer" = "athlete";
            if (p.role === "coach" || p.role === "trainer") {
              role = "coach";
            }

            let sportOrSpec = "";
            if (role === "coach") {
              sportOrSpec = coachInfo?.specialization || "Biomechanics Coach";
            } else {
              sportOrSpec = athInfo?.sport || "General Fitness";
            }

            return {
              id: pId,
              user_id: pId,
              full_name: p.full_name || (role === "coach" ? "Coach" : "Athlete"),
              email: p.email,
              role: role,
              sport: sportOrSpec,
              avatar_url: p.avatar_url,
              last_message: msgInfo?.text,
              last_message_time: msgInfo?.time,
              unread_count: unread,
            };
          });

          // Sort contacts:
          // 1. Users with recent conversations (by timestamp desc)
          // 2. Targeted role matches (coaches first for athletes, athletes first for coaches)
          // 3. Alphabetically
          return contactList.sort((a, b) => {
            const timeA = lastMsgMap.get(a.user_id)?.timestamp || 0;
            const timeB = lastMsgMap.get(b.user_id)?.timestamp || 0;
            if (timeA !== timeB) return timeB - timeA;

            // Prioritize opposite roles for easy discovery
            const aIsTargetRole = isTrainer ? a.role === "athlete" : (a.role === "coach" || a.role === "trainer");
            const bIsTargetRole = isTrainer ? b.role === "athlete" : (b.role === "coach" || b.role === "trainer");
            if (aIsTargetRole && !bIsTargetRole) return -1;
            if (!aIsTargetRole && bIsTargetRole) return 1;

            return a.full_name.localeCompare(b.full_name);
          });
        }
      } catch (err) {
        console.warn("Supabase contacts fetch notice:", err);
      }
    }

    // Fallback: check local storage message history if database is not reachable
    const localMsgs = getLocalMessages();
    const partnerIds = new Set<string>();
    localMsgs.forEach((m) => {
      if (m.sender_id === currentUserId) partnerIds.add(m.receiver_id);
      if (m.receiver_id === currentUserId) partnerIds.add(m.sender_id);
    });

    if (partnerIds.size > 0) {
      return Array.from(partnerIds).map((pId) => {
        const relevant = localMsgs.filter(
          (m) => (m.sender_id === currentUserId && m.receiver_id === pId) || (m.sender_id === pId && m.receiver_id === currentUserId)
        );
        const last = relevant[relevant.length - 1];
        return {
          id: pId,
          user_id: pId,
          full_name: `Contact (${pId.substring(0, 8)})`,
          role: isTrainer ? "athlete" : "coach",
          sport: "Connected User",
          last_message: last?.content,
          last_message_time: last?.created_at ? new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
        };
      });
    }

    return [];
  },
};

