import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<Props> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await api.getCoachAlerts();
        setNotifications(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Alerts & Notifications</h3>
        </div>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">
          Close
        </button>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5">
        {loading ? (
          <p className="text-xs text-slate-500 text-center py-4">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-xs">No active technique alerts.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs transition-colors ${
                item.severity === 'ALERT'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : item.severity === 'WARNING'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {item.severity === 'ALERT' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : item.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-slate-300 leading-relaxed">{item.message}</p>
                  <span className="mt-1.5 inline-block text-[10px] text-slate-400 font-mono">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
