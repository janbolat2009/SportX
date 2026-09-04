import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import { chatService, DirectMessage, ChatContact } from "../../services/chatService";
import { AthleteDetailModal } from "../coach/AthleteDetailModal";
import {
  Send, Search, MessageSquare, User, ArrowLeft, Check,
  CheckCheck, Activity, Dumbbell, Shield, Sparkles, Loader2
} from "lucide-react";

export const MessagesView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTrainer = user?.role === "coach" || user?.role === "trainer";

  // Load contacts
  useEffect(() => {
    async function loadContacts() {
      setLoadingContacts(true);
      try {
        const list = await chatService.getContactsForUser(user);
        setContacts(list);
        if (list.length > 0 && !selectedContact && window.innerWidth >= 768) {
          setSelectedContact(list[0]);
        }
      } catch (e) {
        console.error("Contacts load error:", e);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadContacts();
  }, [user]);

  // Load conversation when selectedContact changes
  useEffect(() => {
    const contact = selectedContact;
    if (!contact || !user?.id) return;
    const currentContactUserId = contact.user_id;
    const currentUserId = String(user.id);
    let isMounted = true;

    async function loadMessages() {
      setLoading(true);
      try {
        const msgs = await chatService.getConversation(currentUserId, currentContactUserId);
        if (isMounted) {
          setMessages(msgs);
          await chatService.markAsRead(currentUserId, currentContactUserId);
        }
      } catch (e) {
        console.error("Message load error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMessages();

    // Subscribe to realtime incoming messages
    const unsubscribe = chatService.subscribeToMessages(currentUserId, (newMsg) => {
      if (newMsg.sender_id === currentContactUserId) {
        setMessages((prev) => [...prev, newMsg]);
        chatService.markAsRead(currentUserId, currentContactUserId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedContact, user]);

  // Auto-scroll
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
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.sport && c.sport.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                <span>{t("nav.messages", "Direct Messages")}</span>
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20">
                {isTrainer ? "Trainer Hub" : "Athlete Chat"}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTrainer ? "Search athletes..." : "Search trainers..."}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 dark:text-zinc-400">
                No active conversations found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-stone-900 dark:text-white"
                        : "hover:bg-stone-100 dark:hover:bg-zinc-900 border border-transparent text-stone-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shrink-0">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        contact.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate text-stone-900 dark:text-white">
                          {contact.full_name}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
                          {contact.last_message_time || "Recent"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate mt-0.5">
                        {contact.last_message || contact.sport || "Ready to connect"}
                      </p>
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

                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-brand-400 border border-stone-200 dark:border-zinc-700 shrink-0">
                  {selectedContact.avatar_url ? (
                    <img src={selectedContact.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    selectedContact.full_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>{selectedContact.full_name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                    {selectedContact.sport || (selectedContact.role === "athlete" ? "Athlete" : "Trainer")}
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
                  <span className="hidden sm:inline">View Telemetry</span>
                </button>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-stone-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-white">Start the conversation</h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-xs">
                    Send real-time feedback, workout recommendations, or ask your coach questions about technique.
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
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
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
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Check className="w-3 h-3 text-stone-400" />
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
                    ? `Message ${selectedContact.full_name} with recommendations...`
                    : `Ask ${selectedContact.full_name} about your workouts...`
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
                Select a conversation
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
                Connect directly between athlete and trainer, exchange exercise advice, and review live kinematic progress.
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
