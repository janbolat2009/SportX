import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getTranslation } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sportx_lang') as Language;
      if (saved && (saved === 'en' || saved === 'ru' || saved === 'kk')) {
        return saved;
      }
      // Auto-detect Russian or Kazakh from navigator
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('kk') || navLang.startsWith('kz')) return 'kk';
      if (navLang.startsWith('ru')) return 'ru';
    }
    return 'ru'; // Default to Russian for CIS region or fallback to English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sportx_lang', lang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const translated = getTranslation(key, language);
    if (translated === key && defaultText) {
      return defaultText;
    }
    return translated;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
