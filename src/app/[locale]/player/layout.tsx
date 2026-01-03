import { ReactNode, PropsWithChildren } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import PlayerLayoutClient from "./PlayerLayoutClient";
import type { Locale } from "@/i18n/config";

interface PlayerLayoutProps extends PropsWithChildren {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PlayerLayout({
  children,
  params
}: PlayerLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { locale } = await params;
  const validLocale = (locale === 'ar' || locale === 'en') ? locale as Locale : 'ar';
  
  const dictionary = await getDictionary(validLocale);

  return (
    <I18nProvider dictionary={dictionary} locale={validLocale}>
      <PlayerLayoutClient session={session} locale={validLocale}>
        {children}
      </PlayerLayoutClient>
    </I18nProvider>
  );
}