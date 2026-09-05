import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { chatService, DirectMessage, ChatContact } from "../../services/chatService";
import { AthleteDetailModal } from "../coach/AthleteDetailModal";
import {
  Send, Search, MessageSquare, User, ArrowLeft, Check,
  CheckCheck, Activity, Dumbbell, Shield, Sparkles, Loader2,
  Users, UserCheck
} from "lucide-react";

export const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "coach" | "athlete">("all");
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  // Load contacts
  const loadContacts = useCallback(async (silent = false) => {
    if (!silent) setLoadingContacts(true);
    try {
      const list = await chatService.getContactsForUser(user);
      setContacts(list);
      
      // Auto-select first contact on desktop if none is selected
      if (list.length > 0 && !selectedContact && window.innerWidth >= 768) {
        setSelectedContact(list[0]);
      }
    } catch (e) {
      console.error("Contacts load error:", e);
    } finally {
      if (!silent) setLoadingContacts(false);
    }
  }, [user, selectedContact]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Load conversation messages
  const loadConversation = useCallback(async (contactUserId: string, silent = false) => {
    if (!user?.id || !contactUserId) return;
    const currentUserId = String(user.id);
    if (!silent) setLoading(true);

    try {
      const msgs = await chatService.getConversation(currentUserId, contactUserId);
      setMessages(msgs);
      await chatService.markAsRead(currentUserId, contactUserId);
      
      // Update contact's unread count locally
      setContacts((prev) =>
        prev.map((c) => (c.user_id === contactUserId ? { ...c, unread_count: 0 } : c))
      );
    } catch (e) {
      console.error("Message load error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  // Effect to load conversation when selectedContact changes
  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact.user_id);
    }
  }, [selectedContact, loadConversation]);

  // Realtime Supabase Subscription & Background Polling
  useEffect(() => {
    if (!user?.id) return;
    const currentUserId = String(user.id);

    // 1. Supabase Realtime channel
    const unsubscribe = chatService.subscribeToMessages(
      currentUserId,
      (newMsg) => {
        // If message is from/to the currently active chat partner
        if (
          selectedContact &&
          (newMsg.sender_id === selectedContact.user_id || newMsg.receiver_id === selectedContact.user_id)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id === selectedContact.user_id) {
            chatService.markAsRead(currentUserId, selectedContact.user_id);
          }
        }
        // Refresh contacts list to update last messages & badges
        loadContacts(true);
      },
      (updatedMsg) => {
        // Update read receipts
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m))
        );
      }
    );

    // 2. Periodic sync (every 3.5s) to guarantee real-time updates even if WebSockets reconnect
    const pollInterval = setInterval(() => {
      if (selectedContact) {
        loadConversation(selectedContact.user_id, true);
      }
      loadContacts(true);
    }, 3500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [user?.id, selectedContact, loadConversation, loadContacts]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedContact || !user?.id) return;

    const content = inputText.trim();
    setInputText("");

    try {
      const sent = await chatService.sendMessage(String(user.id), selectedContact.user_id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      // Refresh contacts to update last message preview
      loadContacts(true);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.sport && c.sport.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterRole === "coach") return c.role === "coach" || c.role === "trainer";
    if (filterRole === "athlete") return c.role === "athlete";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 h-[calc(100vh-80px)] min-h-[580px] animate-in fade-in duration-200">
      <div className="h-full bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-sm flex overflow-hidden">
        
        {/* Left Sidebar: Contacts List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-stone-200 dark:border-zinc-800 flex flex-col ${
          selectedContact ? "hidden md:flex" : "flex"
        }`}>
          {/* Header & Search */}
          <div className="p-4 border-b border-stone-200 dark:border-zinc-800/80 space-y-3 bg-stone-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-brand-400" />
                <span>{t("chat.directMessages", "Direct Messages")}</span>
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20">
                {isTrainer ? t("chat.trainerHub", "Trainer Hub") : t("chat.athleteChat", "Athlete Chat")}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isTrainer
                    ? t("chat.searchAthletes", "Search athletes...")
                    : t("chat.searchTrainers", "Search coaches...")
                }
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Role Filters */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setFilterRole("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterRole === "all"
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t("chat.allUsers", "All")}
              </button>
              <button
                onClick={() => setFilterRole("coach")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterRole === "coach"
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t("chat.coach", "Coaches")}
              </button>
              <button
                onClick={() => setFilterRole("athlete")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterRole === "athlete"
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t("chat.athlete", "Athletes")}
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>{t("chat.loadingConversations", "Loading conversations...")}</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
                  {t("chat.noConversations", "No active conversations yet")}
                </p>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 leading-relaxed">
                  {t("chat.noConversationsDesc", "Start a conversation with a coach or athlete to discuss technique and training plans.")}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                const isCoachContact = contact.role === "coach" || contact.role === "trainer";

                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-stone-900 dark:text-white shadow-xs"
                        : "hover:bg-stone-100 dark:hover:bg-zinc-900 border border-transparent text-stone-700 dark:text-zinc-300"
                    }`}
                  >
                    {/* Contact Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shrink-0 overflow-hidden">
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          contact.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
                    </div>

                    {/* Contact Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-stone-900 dark:text-white">
                          {contact.full_name}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono shrink-0">
                          {contact.last_message_time || t("chat.recent", "Recent")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                          {contact.last_message || contact.sport || t("chat.readyToConnect", "Ready to connect")}
                        </p>

                        {/* Unread Counter Badge */}
                        {contact.unread_count && contact.unread_count > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0 animate-pulse">
                            {contact.unread_count}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 font-medium shrink-0">
                            {isCoachContact ? t("chat.coach", "Coach") : t("chat.athlete", "Athlete")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Thread */}
        {selectedContact ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf8f5] dark:bg-zinc-950">
            
            {/* Thread Header */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-1.5 rounded-xl text-stone-600 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shrink-0 overflow-hidden">
                  {selectedContact.avatar_url ? (
                    <img src={selectedContact.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedContact.full_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>{selectedContact.full_name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                    {selectedContact.sport || (selectedContact.role === "athlete" ? t("chat.athlete", "Athlete") : t("chat.coach", "Coach"))}
                  </p>
                </div>
              </div>

              {/* Quick Telemetry button for Trainer */}
              {isTrainer && selectedContact.role === "athlete" && (
                <button
                  onClick={() => setShowAthleteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 shadow-xs"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("chat.viewTelemetry", "View Telemetry")}</span>
                </button>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>{t("chat.loadingConversations", "Loading messages...")}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-800">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-white">
                    {t("chat.startConversationTitle", "Start the conversation")}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-xs">
                    {t("chat.startConversationDesc", "Send real-time feedback, workout recommendations, or ask questions about technique.")}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === String(user?.id);
                  const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-xs font-medium"
                            : "bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200 rounded-bl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-stone-400 dark:text-zinc-500 font-mono px-1">
                        <span>{timeStr}</span>
                        {isMe && (
                          msg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-stone-400" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isTrainer
                    ? `${t("chat.messageAthletePlaceholder", "Message")} ${selectedContact.full_name}...`
                    : `${t("chat.messageCoachPlaceholder", "Ask")} ${selectedContact.full_name}...`
                }
                className="flex-1 bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40 active:scale-95 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8 bg-[#faf8f5] dark:bg-zinc-950">
            <div className="space-y-3 max-w-sm">
              <div className="w-14 h-14 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-emerald-600 dark:text-brand-400 mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                {t("chat.selectConversation", "Select a conversation")}
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                {t("chat.selectConversationDesc", "Connect directly between athlete and trainer, exchange exercise advice, and review live kinematic progress.")}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Athlete Detail Modal for Trainer */}
      {showAthleteModal && selectedContact && (
        <AthleteDetailModal
          athleteId={Number(selectedContact.id) || selectedContact.user_id}
          onClose={() => setShowAthleteModal(false)}
        />
      )}
    </div>
  );
};

