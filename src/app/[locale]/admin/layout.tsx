import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import AdminLayoutClient from "./AdminLayoutClient";
import type { Locale } from "@/i18n/config";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminLayout({
  children,
  params
}: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "ADMIN") {
    const { locale } = await params;
    redirect(`/${locale}/dashboard`);
  }

  const { locale } = await params;
  const validLocale = (locale === 'ar' || locale === 'en') ? locale as Locale : 'ar';
  
  const dictionary = await getDictionary(validLocale);

  return (
    <I18nProvider dictionary={dictionary} locale={validLocale}>
      <AdminLayoutClient session={session} locale={validLocale}>
        {children}
      </AdminLayoutClient>
    </I18nProvider>
  );
}