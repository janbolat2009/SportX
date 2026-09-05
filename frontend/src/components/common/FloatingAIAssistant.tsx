import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../i18n/LanguageContext";
import {
  Bot, Sparkles, X, Send, Loader2, ArrowRight, Activity,
  ChevronDown, RefreshCw, MessageSquare
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

function cleanAIMessageContent(raw: string): string {
  if (!raw) return '';
  let text = String(raw).trim();
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/```thought[\s\S]*?```/gi, '');
  const scratchpadEndRegex = /^[\s\S]*?(?:Language:\s*(?:Russian|Kazakh|English|RU|KK|EN)[\.\s]*|Check against constraints[^\n]*[\.\s]*|Ensure tone is[^\n]*[\.\s]*)(?=[А-ЯӘІҢҒҮҰҚӨҺA-Z0-9#\n])/i;
  if (scratchpadEndRegex.test(text)) {
    text = text.replace(scratchpadEndRegex, '');
  }
  text = text.replace(/^(?:\s*[\*\-]\s*(?:User says:|Topic:|Target Persona:|Greeting:|Key Biomechanical|Setup:|Grip:|Bar Path:|Execution:|Safety:|Common Mistakes:|Closing:|Introduction:)[^\n]*\n*)+/gim, '');
  text = text.replace(/^[^\n]*\([A-Za-z\s,!'\?]+\)\.\s*\n+/i, '');
  return text.trim();
}

interface Props {
  initialContextQuery?: string;
  onClearInitialContext?: () => void;
}

export const FloatingAIAssistant: React.FC<Props> = ({
  initialContextQuery,
  onClearInitialContext,
}) => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    language === "ru"
      ? "Как улучшить глубину приседа?"
      : language === "kk"
      ? "Отыру тереңдігін қалай жақсартуға болады?"
      : "How can I improve my squat depth?",
    language === "ru"
      ? "Почему колени заваливаются внутрь?"
      : language === "kk"
      ? "Неге тізелер ішке қарай бүгіледі?"
      : "Why do my knees cave inward during squats?",
    language === "ru"
      ? "Сколько подходов и повторений делать?"
      : language === "kk"
      ? "Қанша тәсіл мен қайталау жасау керек?"
      : "How many sets and reps should I do?",
    language === "ru"
      ? "Как исправить технику отжиманий?"
      : language === "kk"
      ? "Еденнен сығылу техникасын қалай түзетуге болады?"
      : "How to fix my push-up technique?",
  ];

  // Open with initial contextual query if provided
  useEffect(() => {
    if (initialContextQuery) {
      setIsOpen(true);
      handleSendMessage(initialContextQuery);
      if (onClearInitialContext) onClearInitialContext();
    }
  }, [initialContextQuery]);

  // Set initial greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = language === "ru"
        ? "Привет! Я ваш персональный AI-тренер SportX по биомеханике и технике упражнений. Задайте любой вопрос о технике приседаний, отжиманий, тренировочной программе или восстановлении."
        : language === "kk"
        ? "Сәлем! Мен сіздің жаттығу техникасы мен биомеханика бойынша SportX AI-бапкеріңізбін. Жаттығу техникасы, бағдарламасы немесе қалпына келу туралы сұрақ қойыңыз."
        : "Hello! I am your SportX AI Biomechanics Coach. Ask me any question regarding exercise technique, rep ranges, tempo, mobility, or recovery.";

      setMessages([
        {
          role: "assistant",
          content: greeting,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || inputQuery;
    if (!textToSend.trim() || loading) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      role: "user",
      content: textToSend.trim(),
      time: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: cleanAIMessageContent(m.content) })),
          user_context: {
            user_name: user?.full_name || "Athlete",
            role: user?.role || "athlete",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantText = cleanAIMessageContent(data.content || "");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error("Assistant response error");
      }
    } catch (err) {
      const fallback = language === "ru"
        ? "Я могу помочь с техникой упражнений, тренировками и спортивным восстановлением. Пожалуйста, задайте вопрос, связанный с фитнесом или выполнением упражнений."
        : language === "kk"
        ? "Мен жаттығу техникасы, жаттығулар және спорттық қалпына келу бойынша көмектесе аламын. Фитнес немесе жаттығуға қатысты сұрақ қойыңыз."
        : "I can assist you with exercise technique, workout programming, and recovery. Please ask a fitness or training-related question.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallback,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Floating Circular Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-all duration-200 active:scale-95 group focus:outline-none"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-600 animate-pulse" />
        </div>
      </button>

      {/* 2. Sleek Assistant Drawer / Bottom-Sheet Interface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          
          {/* Dismiss Area */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Modal / Sheet Container */}
          <div className="relative w-full sm:w-[420px] h-[85vh] sm:h-[600px] max-h-[85vh] bg-[#fcfbf9] dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom-5 duration-250 ease-out">
            
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-stone-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span>SportX AI Coach</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                    Biomechanics & Technique Expert
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-emerald-600 text-white rounded-br-xs font-medium"
                          : "bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-200 rounded-bl-xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-stone-400 dark:text-zinc-500 font-mono px-1">
                      {msg.time}
                    </span>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-xs text-stone-500 dark:text-zinc-400 w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Analyzing biomechanics...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions Chips */}
            <div className="px-3 py-2 border-t border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/50 dark:bg-zinc-900/40 shrink-0">
              <span className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider block mb-1 px-1">
                Suggested Questions
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-[11px] font-medium text-stone-700 dark:text-zinc-300 hover:border-emerald-500 transition-all shrink-0 active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about technique, sets, or form..."
                className="flex-1 bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-40 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
