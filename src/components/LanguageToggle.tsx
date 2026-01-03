'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { i18n, type Locale } from '@/i18n/config';

interface LanguageToggleProps {
  currentLocale: Locale;
  className?: string;
}

export default function LanguageToggle({ 
  currentLocale, 
  className = "" 
}: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
    
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  const getLanguageLabel = (locale: Locale) => {
    return locale === 'ar' ? 'العربية' : 'English';
  };

  const getNextLanguageLabel = (locale: Locale) => {
    return locale === 'ar' ? 'English' : 'العربية';
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium ${className}`}
      title={`Switch to ${getNextLanguageLabel(currentLocale)}`}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">
        {getLanguageLabel(currentLocale)}
      </span>
    </button>
  );
}