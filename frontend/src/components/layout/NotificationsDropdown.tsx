import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, X, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await api.getCoachAlerts();
        setNotifications(data || []);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-[380px] rounded-3xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-stone-200/90 dark:border-zinc-800/90 shadow-2xl p-4 sm:p-5 z-[100] animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/90 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                {t('notifications.title', 'Alerts & Notifications')}
              </h3>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-brand-400 border border-emerald-500/20">
                  {notifications.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-500 dark:text-zinc-400 line-clamp-1">
              {t('notifications.subtitle', 'Real-time biomechanical analysis & alerts')}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-900 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
          aria-label={t('notifications.close', 'Close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Stream */}
      <div className="mt-3.5 max-h-80 overflow-y-auto space-y-2.5 pr-0.5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-stone-400 dark:text-zinc-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-brand-400" />
            <span>{t('notifications.loading', 'Loading notifications...')}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-7 px-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 mx-auto mb-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-stone-900 dark:text-white">
              {t('notifications.emptyTitle', 'All metrics on track')}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
              {t('notifications.emptySubtitle', 'No critical technique deviations or active warnings detected.')}
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isAlert = item.severity === 'ALERT';
            const isWarning = item.severity === 'WARNING';

            const cardClasses = isAlert
              ? 'bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/15 border-rose-500/25'
              : isWarning
              ? 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 border-amber-500/25'
              : 'bg-stone-50/80 hover:bg-stone-100/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/90 border-stone-200/80 dark:border-zinc-800/80';

            const iconBadgeClasses = isAlert
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${cardClasses}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-xl border shrink-0 mt-0.5 ${iconBadgeClasses}`}>
                    {isAlert ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-stone-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 shrink-0">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-stone-600 dark:text-zinc-300 leading-relaxed text-[11px]">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
