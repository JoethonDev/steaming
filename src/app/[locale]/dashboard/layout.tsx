import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import DashboardLayoutClient from "./DashboardLayoutClient";
import type { Locale } from "@/i18n/config";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function DashboardLayout({
  children,
  params
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const { locale } = await params;
  const validLocale = (locale === 'ar' || locale === 'en') ? locale as Locale : 'ar';
  
  // Get dictionary
  const dictionary = await getDictionary(validLocale);

  return (
    <I18nProvider dictionary={dictionary} locale={validLocale}>
      <DashboardLayoutClient session={session} locale={validLocale}>
        {children}
      </DashboardLayoutClient>
    </I18nProvider>
  );
}