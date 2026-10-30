'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Translations } from './translations';
import { Language } from '@/types';

interface I18nContextType {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: Translations;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Language>('bn'); // Default to Bangla as per spec

  useEffect(() => {
    const saved = localStorage.getItem('khagan_lang') as Language;
    if (saved && (saved === 'bn' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (lang: Language) => {
    setLocaleState(lang);
    localStorage.setItem('khagan_lang', lang);
  };

  const toggleLocale = () => {
    const next = locale === 'bn' ? 'en' : 'bn';
    setLocale(next);
  };

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

