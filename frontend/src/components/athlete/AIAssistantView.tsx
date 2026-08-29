import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Bot, Send, User as UserIcon, Sparkles, Loader2,
  Dumbbell, Apple, Moon, ShieldAlert, Trash2, ArrowRight, CheckCircle2
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export const AIAssistantView: React.FC = () => {
  const { user, athleteProfile } = useAuth();
  const { language, t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        language === 'ru'
          ? 'Привет! Я спортивный ИИ-ассистент SportX. Могу ответить на вопросы по технике упражнений, тренировочным программам, питанию и восстановлению. Чем я могу помочь?'
          : language === 'kk'
          ? 'Сәлем! Мен SportX жасанды интеллект бапкерімін. Жаттығу техникасы, тамақтану, ұйқы және қалпына келу бойынша сұрақтарыңызға жауап бере аламын. Не көмек керек?'
          : 'Hello! I am your SportX AI Fitness Assistant. I can help evaluate your exercise technique, design training routines, or optimize your nutrition and sleep. How can I help today?',
      created_at: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load active conversation from Supabase
  useEffect(() => {
    async function loadChat() {
      if (!isSupabaseConfigured() || !user?.id) return;
      try {
        const { data: conv } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('user_id', String(user.id))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conv) {
          setConversationId(conv.id);
          const { data: dbMsgs } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          if (dbMsgs && dbMsgs.length > 0) {
            setMessages(dbMsgs as any);
          }
        }
      } catch (err) {
        console.warn('Notice loading AI conversation:', err);
      }
    }
    loadChat();
  }, [user]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    let activeConvId = conversationId;

    // Create conversation in Supabase if not present
    if (isSupabaseConfigured() && user?.id && !activeConvId) {
      try {
        const { data: newConv } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: String(user.id),
            title: textToSend.slice(0, 40),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (newConv) {
          activeConvId = newConv.id;
          setConversationId(newConv.id);
        }
      } catch {}
    }

    // Save user message to Supabase
    if (isSupabaseConfigured() && activeConvId && user?.id) {
      try {
        await supabase.from('ai_messages').insert({
          conversation_id: activeConvId,
          user_id: String(user.id),
          role: 'user',
          content: userMsg.content,
          created_at: userMsg.created_at,
        });
      } catch {}
    }

    // Get Auth token if available
    let authToken = '';
    if (isSupabaseConfigured()) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token || '';
      } catch {}
    }

    // Call secure backend endpoint
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationId: activeConvId,
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          user_context: {
            sport: athleteProfile?.sport || 'General Fitness',
            training_level: athleteProfile?.training_level || 'Intermediate',
            fitness_goal: athleteProfile?.fitness_goal || 'Strength & Technique',
          },
        }),
      });

      let assistantContent = '';
      if (response.ok) {
        const data = await response.json();
        assistantContent = data.content;
      } else {
        const fallbackContent = generateClientKnowledgeResponse(textToSend, language);
        assistantContent = fallbackContent;
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Supabase
      if (isSupabaseConfigured() && activeConvId && user?.id) {
        try {
          await supabase.from('ai_messages').insert({
            conversation_id: activeConvId,
            user_id: String(user.id),
            role: 'assistant',
            content: assistantMsg.content,
            created_at: assistantMsg.created_at,
          });
        } catch {}
      }
    } catch {
      const fallbackContent = generateClientKnowledgeResponse(textToSend, language);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: fallbackContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (conversationId && isSupabaseConfigured()) {
      try {
        await supabase.from('ai_messages').delete().eq('conversation_id', conversationId);
      } catch {}
    }
    setMessages([
      {
        role: 'assistant',
        content:
          language === 'ru'
            ? 'История сообщений очищена. Чем я могу помочь по вашим тренировкам сегодня?'
            : language === 'kk'
            ? 'Хабарламалар тарихы тазартылды. Жаттығуларыңыз бойынша қалай көмектесе аламын?'
            : 'Conversation history cleared. How can I help with your training today?',
        created_at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-4 animate-in fade-in flex flex-col h-[calc(100vh-100px)] min-h-[580px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-400" />
            <span>{t('assistant.title', 'SportX AI Assistant')}</span>
          </h1>
          <p className="text-xs text-zinc-400">
            {t('assistant.subtitle', 'Biomechanical analysis, training advice, and recovery guidance.')}
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {[
          language === 'ru' ? 'Как делать приседания?' : language === 'kk' ? 'Отырып-тұруды қалай дұрыс жасау керек?' : 'How to improve squat depth?',
          language === 'ru' ? 'Техника отжиманий' : language === 'kk' ? 'Еденнен сығылу техникасы' : 'Push-up biomechanics & elbow path',
          language === 'ru' ? 'Питание после тренировки' : language === 'kk' ? 'Жаттығудан кейінгі тамақтану' : 'Post-workout protein intake',
          language === 'ru' ? 'Советы по сну и восстановлению' : language === 'kk' ? 'Ұйқы және қалпына келу' : 'Optimal sleep for recovery',
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isAssistant ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isAssistant
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    : 'bg-brand-500 text-black font-semibold shadow-brand-500/10'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.created_at && (
                  <div
                    className={`text-[9px] font-mono mt-1 text-right ${
                      isAssistant ? 'text-zinc-500' : 'text-zinc-800'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5 font-bold text-xs">
                  {user?.full_name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-zinc-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>{t('assistant.analyzing', 'SportX AI is thinking...')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 border-t border-zinc-800 shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('assistant.placeholder', 'Ask about squat form, push-up depth, protein timing, or recovery...')}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black transition-all shadow-md shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </form>

    </div>
  );
};

function generateClientKnowledgeResponse(query: string, lang: string): string {
  const q = query.toLowerCase();

  // Strict off-topic refusal
  const offTopics = ['python', 'code', 'javascript', 'math', 'calc', 'history', 'movie', 'game', 'president', 'war', 'crypto'];
  if (offTopics.some((t) => q.includes(t))) {
    return 'I can only help with exercise technique, training, workouts, and fitness-related questions.';
  }

  if (q.includes('squat') || q.includes('присед') || q.includes('отырып')) {
    if (lang === 'ru') {
      return 'Для идеальной техники приседаний:\n1. Поставьте стопы на ширине плеч, носки разверните на 15–30 градусов.\n2. На вдохе напрягите мышцы кора и начинайте движение с одновременного сгибания таза и коленей.\n3. Опускайтесь до параллели бедер с полом (угол в коленях ~90-100°).\n4. Направляйте колени строго по линии носков, не допуская завала внутрь.\n5. Толкайтесь всей поверхностью стопы при подъеме.';
    } else if (lang === 'kk') {
      return 'Отырып-тұрудың дұрыс техникасы:\n1. Аяқты иық еніне қойып, башайларды 15–30 градусқа сыртқа бұрыңыз.\n2. Терең дем алып, іш бұлшықеттерін қатайтып, жамбас пен тізені бірге бүгіңіз.\n3. Жамбас тізе деңгейіне дейін түсуі керек (~90-100°).\n4. Тізелерді ішке құлатпай, сыртқа қарай бағыттаңыз.\n5. Көтерілген кезде толық табанмен итеріліңіз.';
    }
    return 'Squat Technique Guidelines:\n1. Set feet shoulder-width apart with toes flared 15-30 degrees.\n2. Inhale, brace core, and initiate by hinging hips back and bending knees.\n3. Descend until thighs are parallel with floor (~90-100° knee angle).\n4. Track knees in line with second and third toes to prevent inward collapse.\n5. Drive through midfoot and heels to full standing lockout.';
  }

  if (q.includes('push') || q.includes('отжиман') || q.includes('сығылу')) {
    if (lang === 'ru') {
      return 'Техника идеальных отжиманий:\n1. Руки чуть шире плеч, пальцы направлены вперед.\n2. Локти держите под углом 45° к корпусу, избегая разведения в стороны.\n3. Держите тело в одной прямой линии от макушки до пяток, напрягая пресс и ягодицы.\n4. Опускайтесь до расстояния 5-7 см от пола, затем мощно выжимайте себя вверх.';
    } else if (lang === 'kk') {
      return 'Еденнен сығылу техникасы:\n1. Қолдарды иықтан сәл кеңірек қойыңыз.\n2. Шынтақты денеге 45° бұрышта ұстаңыз, жан-жаққа жаймаңыз.\n3. Денені бастан өкшеге дейін түзу тақтайдай ұстаңыз.\n4. Кеудені еденге 5-7 см қалғанша түсіріп, күшпен жоғары итеріңіз.';
    }
    return 'Push-up Biomechanics:\n1. Hands slightly wider than shoulder-width.\n2. Angle elbows at ~45° to your torso (avoid 90° flaring).\n3. Squeeze glutes and core to keep a rigid straight plank line.\n4. Lower until chest is 2-3 inches from floor, then press to full extension.';
  }

  if (lang === 'ru') {
    return 'Я могу проанализировать вашу технику упражнений, подобрать количество повторений и подходов, а также рассчитать питание и рекомендации по сну. Какой вопрос вас интересует?';
  } else if (lang === 'kk') {
    return 'Мен жаттығу техникасын талдап, қайталау мен тәсілдер санын есептеп, тамақтану мен ұйқы бойынша кеңес бере аламын. Сізді қандай сұрақ қызықтырады?';
  }
  return 'I can analyze your movement biomechanics, suggest sets and repetitions, and provide science-backed nutrition and recovery recommendations. How can I assist your workout today?';
}
