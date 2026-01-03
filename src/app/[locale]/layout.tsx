import { PropsWithChildren } from "react";
import { getDictionary, isValidLocale, getDirection, getLanguage, i18n } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";

interface LocaleLayoutProps extends PropsWithChildren {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;
  // Validate locale
  const validLocale = isValidLocale(locale) ? locale : i18n.defaultLocale;
  
  // Get dictionary and direction
  const dictionary = await getDictionary(validLocale);
  const direction = getDirection(validLocale);
  const lang = getLanguage(validLocale);
  
  return (
    <html lang={lang} dir={direction}>
      <body>
        <I18nProvider dictionary={dictionary} locale={validLocale}>
          <div className="min-h-screen">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}