import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDictionary } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import AdminPageClient from "./AdminPageClient";
import type { Locale } from "@/i18n/config";

async function getSystemStats() {
  const [userCount, seriesCount, adminCount, recentActivity] = await Promise.all([
    db.user.count(),
    db.series.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.recentEpisode.count({
      where: {
        viewedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  return { userCount, seriesCount, adminCount, recentActivity };
}

async function getSystemHealth() {
  // Check API connectivity (simplified)
  const watchitStatus = process.env.WATCHIT_API_TOKEN ? "online" : "offline";
  const brightcoveStatus = process.env.WATCHIT_FASTLY_TOKEN ? "online" : "offline";
  
  // Check database connectivity
  let databaseStatus = "online";
  try {
    await db.user.findFirst();
  } catch (error) {
    databaseStatus = "offline";
  }

  return {
    watchitApi: watchitStatus,
    brightcove: brightcoveStatus,
    database: databaseStatus,
    lastChecked: new Date(),
  };
}

interface AdminPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== "ADMIN") {
    const { locale } = await params;
    redirect(`/${locale}/dashboard`);
  }

  const { locale } = await params;
  const validLocale = (locale === 'ar' || locale === 'en') ? locale as Locale : 'ar';
  
  const [dictionary, stats, health] = await Promise.all([
    getDictionary(validLocale),
    getSystemStats(),
    getSystemHealth()
  ]);

  return (
    <I18nProvider dictionary={dictionary} locale={validLocale}>
      <AdminPageClient stats={stats} health={health} locale={validLocale} />
    </I18nProvider>
  );
}