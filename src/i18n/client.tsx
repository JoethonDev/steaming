'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Dictionary } from './config';

interface I18nContextType {
  dictionary: Dictionary;
  locale: string;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  dictionary: Dictionary;
  locale: string;
}

export function I18nProvider({ children, dictionary, locale }: I18nProviderProps) {
  const t = (key: string, fallback?: string): string => {
    return dictionary[key] || fallback || key;
  };

  const value = {
    dictionary,
    locale,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Translation hook shortcut
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}