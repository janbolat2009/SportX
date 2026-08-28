import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Bot, Send, User as UserIcon, Sparkles, Loader2,
  Dumbbell, Apple, Moon, ShieldAlert, Trash2, ArrowRight
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
          ? 'Привет! Я спортивный ИИ-ассистент SportX. Могу ответить на вопросы по технике упражнений, питанию, сну и тренировочным программам. Чем я могу помочь?'
          : language === 'kk'
          ? 'Сәлем! Мен SportX жасанды интеллект бапкерімін. Жаттығу техникасы, тамақтану, ұйқы және қалпына келу бойынша сұрақтарыңызға жауап бере аламын. Не көмек керек?'
          : 'Hello! I am your SportX AI Fitness Assistant. I can help evaluate your exercise technique, design training routines, or optimize your nutrition and sleep. How can I help today?',
      created_at: new Date().toISOString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (isSupabaseConfigured() && activeConvId) {
      try {
        await supabase.from('ai_messages').insert({
          conversation_id: activeConvId,
          role: 'user',
          content: userMsg.content,
          created_at: userMsg.created_at,
        });
      } catch {}
    }

    // Get response from backend or local knowledge engine
    try {
      const response = await fetch('/api/v1/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        assistantContent = generateClientKnowledgeResponse(textToSend, language);
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Supabase
      if (isSupabaseConfigured() && activeConvId) {
        try {
          await supabase.from('ai_messages').insert({
            conversation_id: activeConvId,
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
        content: 'Conversation history cleared. How can I help you today?',
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
          'How to improve squat depth?',
          'What to eat post-workout?',
          'How to avoid elbow flare in push-ups?',
          'How many hours of sleep for muscle recovery?'
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1 active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-3xl bg-zinc-900/60 border border-zinc-800">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[78%] whitespace-pre-wrap ${
                  isUser
                    ? 'bg-brand-500 text-black font-semibold rounded-tr-none'
                    : 'bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 border border-zinc-700">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span>SportX AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 pt-1 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything about technique, sets, nutrition, sleep..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Non-medical Disclaimer */}
      <p className="text-[10px] text-zinc-500 text-center shrink-0">
        SportX AI provides athletic technique and fitness training information. Not intended for clinical or medical diagnosis.
      </p>

    </div>
  );
};

function generateClientKnowledgeResponse(query: string, lang: string): string {
  const q = query.toLowerCase();

  if (q.includes('squat') || q.includes('присед') || q.includes('отырып')) {
    return lang === 'ru'
      ? 'Для правильной биомеханики приседания:\n\n1. **Ширина стойки**: Ноги на ширине плеч, носки развернуты на 15–30 градусов.\n2. **Глубина (ROM)**: Опускайтесь до параллели или чуть ниже (угол в колене 90–105°).\n3. **Колени**: Должны двигаться строго по направлению носков, не заваливаясь внутрь (вальгус).\n4. **Корпус**: Держите спину прямой, упирайтесь всей стопой в пол.'
      : 'Squat biomechanics guidelines:\n\n1. **Footing**: Shoulder-width stance with toes flared 15-30 degrees.\n2. **Depth**: Lower until hips reach parallel or sub-parallel (~95-105° knee angle).\n3. **Knees**: Track in line with toes, preventing inward knee collapse.\n4. **Torso**: Maintain braced neutral spine and drive through midfoot.';
  }

  if (q.includes('push') || q.includes('отжиман') || q.includes('бүгу')) {
    return lang === 'ru'
      ? 'Ключевые моменты для отжиманий:\n\n1. **Угол локтей**: Держите локти под углом ~45° к корпусу, не расставляйте их широко (90° создает лишнюю нагрузку на плечевые суставы).\n2. **Линия тела**: Напрягите пресс и ягодицы, удерживая прямую линию от плеч до стоп без провисания таза.\n3. **Глубина**: Опускайтесь до касания грудью 5-7 см от пола.'
      : 'Push-up biomechanics cues:\n\n1. **Elbow Angle**: Tuck elbows to ~45 degrees from torso (avoid 90-degree flaring).\n2. **Plank Neutrality**: Keep core and glutes engaged to prevent lumbar sagging.\n3. **Full Lockout**: Extend elbows at top without shrugging shoulders.';
  }

  if (q.includes('protein') || q.includes('eat') || q.includes('питани') || q.includes('тамақ')) {
    return lang === 'ru'
      ? 'Рекомендации по питанию:\n\n• **Белок**: 1.6–2.2г на кг веса в день для восстановления мышечных волокон (куриная грудка, яйца, творог, рыба).\n• **Углеводы**: Употребляйте сложные углеводы (гречка, рис, овсянка) за 2 часа до тренировки для восполнения запасов гликогена.\n• **Водный баланс**: Выпивайте 30-40 мл воды на 1 кг веса тела ежедневно.'
      : 'Nutrition principles for athletic recovery:\n\n• **Protein**: 1.6-2.2g per kg bodyweight daily for muscle protein synthesis.\n• **Carbohydrates**: Complex carbs (rice, oats, potatoes) to replenish glycogen.\n• **Hydration**: 30-40ml of water per kg daily to support cellular recovery.';
  }

  if (q.includes('sleep') || q.includes('сон') || q.includes('ұйқы')) {
    return lang === 'ru'
      ? 'Оптимальный сон для атлетов:\n\n• **Длительность**: 7.5–9 часов непрерывного сна.\n• **Фазы**: Глубокий сон необходим для выработки соматотропина (гормона роста).\n• **Гигиена сна**: Прохладная комната (18–20°C), темнота и отсутствие синего света за 45 минут до сна.'
      : 'Sleep and athletic performance:\n\n• **Duration**: 7.5-9 hours for complete nervous system recovery.\n• **Deep Sleep**: Essential for growth hormone secretion and tissue repair.\n• **Consistency**: Regular bedtime within a 30-minute window daily.';
  }

  return lang === 'ru'
    ? 'Я готов помочь вам с анализом техники, подбором упражнений, планом питания и рекомендациями по сну. Задайте конкретный вопрос о вашей тренировке!'
    : 'I am ready to help optimize your movement kinematics, workout programming, nutrition tracking, and sleep recovery. Ask any specific question to get started!';
}
