// Internationalization configuration
export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

// Dictionary type
export type Dictionary = {
  [key: string]: string;
};

// Get dictionary for a specific locale
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  try {
    const dict = await import(`../../locales/${locale}/common.json`);
    return dict.default;
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fallback to default locale
    const defaultDict = await import(`../../locales/${i18n.defaultLocale}/common.json`);
    return defaultDict.default;
  }
}

// Utility to validate locale
export function isValidLocale(locale: string): locale is Locale {
  return i18n.locales.includes(locale as Locale);
}

// Get direction for a locale
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

// Get language attribute for HTML
export function getLanguage(locale: Locale): string {
  const languageMap = {
    ar: 'ar-SA',
    en: 'en-US',
  };
  return languageMap[locale];
}