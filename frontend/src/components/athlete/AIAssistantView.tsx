import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Bot, Send, User as UserIcon, Loader2,
  AlertTriangle, Trash2, Info, RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
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

export const AIAssistantView: React.FC = () => {
  const { user, athleteProfile } = useAuth();
  const { language, t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set default localized greeting on mount or language change if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('ai.defaultGreeting'),
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [language]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, errorMessage]);

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
            setMessages(
              dbMsgs.map((m: any) => ({
                ...m,
                content: m.role === 'assistant' ? cleanAIMessageContent(m.content) : m.content,
              }))
            );
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
      } catch (err) {
        console.warn('Supabase conversation creation error:', err);
      }
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
      } catch (err) {
        console.warn('Supabase user message save notice:', err);
      }
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
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: cleanAIMessageContent(m.content) })),
          user_context: {
            sport: athleteProfile?.sport || 'General Fitness',
            training_level: athleteProfile?.training_level || 'Intermediate',
            fitness_goal: athleteProfile?.fitness_goal || 'Strength & Technique',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantContent = cleanAIMessageContent(data.content || '');

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
          } catch (err) {
            console.warn('Supabase assistant message save notice:', err);
          }
        }
      } else {
        let errJson: any = null;
        try {
          errJson = await response.json();
        } catch {}
        
        let errMsg = errJson?.error;
        if (!errMsg) {
          if (response.status === 401) {
            errMsg = t('ai.errorApiKey');
          } else if (response.status === 429) {
            errMsg = t('ai.errorRateLimit', 'AI rate limit reached. Please wait a few moments and try again.');
          } else {
            errMsg = `AI service returned error ${response.status}.`;
          }
        }
        setErrorMessage(errMsg);
      }
    } catch (netErr) {
      console.error('AI chat network error:', netErr);
      setErrorMessage(t('ai.errorNetwork'));
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
        content: t('ai.defaultGreeting'),
        created_at: new Date().toISOString(),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-4 animate-in fade-in flex flex-col h-[calc(100vh-100px)] min-h-[580px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600 dark:text-brand-400" />
            <span>{t('ai.title')}</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            {t('ai.subtitle')}
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
          title={t('ai.clearChat')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {[
          language === 'ru' ? 'Как делать приседания?' : language === 'kk' ? 'Отырып-тұруды қалай дұрыс жасау керек?' : 'How to improve squat depth?',
          language === 'ru' ? 'Техника отжиманий' : language === 'kk' ? 'Еденнен сығылу техникасы' : 'Push-up biomechanics & elbow path',
          language === 'ru' ? 'Питание после тренировки' : language === 'kk' ? 'Жаттығудан кейінгі тамақтану' : 'Post-workout protein timing',
          language === 'ru' ? 'Советы по сну и восстановлению' : language === 'kk' ? 'Ұйқы және қалпына келу' : 'Optimal sleep for recovery',
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-xl bg-surface-card hover:bg-surface-cardHover border border-surface-border text-[11px] font-medium text-stone-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-white transition-colors"
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
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isAssistant
                    ? 'bg-surface-card border border-surface-border text-stone-800 dark:text-zinc-200'
                    : 'bg-emerald-600 text-white font-medium shadow-emerald-600/10'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.created_at && (
                  <div
                    className={`text-[9px] font-mono mt-1 text-right ${
                      isAssistant ? 'text-stone-400 dark:text-zinc-500' : 'text-emerald-100'
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
                <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 flex items-center justify-center text-stone-700 dark:text-zinc-300 shrink-0 mt-0.5 font-bold text-xs">
                  {user?.full_name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-2 text-stone-500 dark:text-zinc-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-brand-400" />
              <span>{language === 'ru' ? 'ИИ думает...' : language === 'kk' ? 'ЖИ талдауда...' : 'SportX AI is thinking...'}</span>
            </div>
          </div>
        )}

        {/* Real Error Feedback Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-status-deviation/10 border border-status-deviation/30 flex items-start gap-3 text-status-deviation animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold">{language === 'ru' ? 'Ошибка ответа ИИ' : language === 'kk' ? 'ЖИ қатесі' : 'AI Request Notice'}</p>
              <p className="mt-0.5 text-stone-700 dark:text-zinc-300">{errorMessage}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Off-Topic Notice */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] text-stone-500 dark:text-zinc-500">
        <Info className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400 shrink-0" />
        <span>{t('ai.offTopicNotice')}</span>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="pt-2 border-t border-surface-border shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('ai.placeholder')}
          className="flex-1 bg-surface-card border border-surface-border rounded-2xl px-4 py-3 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-brand-500 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </form>

    </div>
  );
};

