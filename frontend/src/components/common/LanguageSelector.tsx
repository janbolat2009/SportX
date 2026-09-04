import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; shortLabel: string }[] = [
    { code: 'ru', label: 'Русский', shortLabel: 'RU' },
    { code: 'kk', label: 'Қазақша', shortLabel: 'KK' },
    { code: 'en', label: 'English', shortLabel: 'EN' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-300 transition-all shadow-xs"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Language / Тіл / Язык"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-brand-400" />
        <span className="font-bold text-xs uppercase text-stone-800 dark:text-zinc-200">
          {compact ? currentLang.shortLabel : currentLang.label}
        </span>
        <ChevronDown className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLanguage(item.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                language === item.code
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-brand-400 font-bold'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400 font-bold">{item.shortLabel}</span>
                <span>{item.label}</span>
              </div>
              {language === item.code && <Check className="w-3.5 h-3.5 text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
