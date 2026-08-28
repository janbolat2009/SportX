import React from 'react';
import { Moon, Sparkles, X, ArrowRight, Shield } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSleep?: () => void;
}

export const NightlightModal: React.FC<Props> = ({ isOpen, onClose, onNavigateToSleep }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-950/95 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-5 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Moon className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Nightlight Recovery
              </span>
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </div>

            <h4 className="text-sm font-bold text-white leading-tight">
              Prepare for Rest & Muscle Recovery
            </h4>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Evening is peak time for cellular tissue regeneration. Log your sleep window to evaluate tomorrow's readiness.
            </p>

            <div className="pt-2 flex items-center gap-2">
              {onNavigateToSleep && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSleep();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Log Sleep</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
