"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Shield,
  Users,
  Settings,
  Activity,
  BarChart3,
  Database,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import type { Session } from "next-auth";
import type { Locale } from "@/i18n/config";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: Session;
  locale: Locale;
}

function AdminNavItem({ icon, label, href, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        active
          ? "bg-red-600/10 text-red-400 border border-red-500/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={
          active
            ? "text-red-400"
            : "group-hover:text-white transition-colors"
        }
      >
        {icon}
      </span>
      <span className="font-bold text-sm hidden lg:block">{label}</span>
    </Link>
  );
}

export default function AdminLayoutClient({ 
  children, 
  session, 
  locale 
}: AdminLayoutClientProps) {
  const { t } = useTranslation();
  const { needsRefresh } = useSessionRefresh();
  const router = useRouter();
  const pathname = usePathname();

  // Show refresh indicator if session needs update
  useEffect(() => {
    if (needsRefresh) {
      console.log("Admin session needs refresh due to user data changes");
    }
  }, [needsRefresh]);

  return (
    <div className="flex h-screen bg-[#030406] text-white overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-red-500/20 bg-[#0a0507] flex flex-col transition-all">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tighter text-xl hidden lg:block text-red-400">
            {locale === 'ar' ? 'لوحة الإدارة' : 'ADMIN PANEL'}
          </span>
        </div>

        <nav className="flex-grow px-3 space-y-2 mt-4">
          <AdminNavItem
            icon={<ArrowLeft size={22} />}
            label={locale === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            href={`/${locale}/dashboard`}
          />
          
          <div className="h-px bg-white/10 mx-2 my-4"></div>
          
          <AdminNavItem
            icon={<BarChart3 size={22} />}
            label={locale === 'ar' ? 'نظرة عامة' : 'Overview'}
            href={`/${locale}/admin`}
            active={pathname === `/${locale}/admin`}
          />
          <AdminNavItem
            icon={<Users size={22} />}
            label={locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
            href={`/${locale}/admin/users`}
            active={pathname === `/${locale}/admin/users`}
          />
          <AdminNavItem
            icon={<Activity size={22} />}
            label={locale === 'ar' ? 'صحة النظام' : 'System Health'}
            href={`/${locale}/admin/system`}
            active={pathname === `/${locale}/admin/system`}
          />
          <AdminNavItem
            icon={<Database size={22} />}
            label={locale === 'ar' ? 'قاعدة البيانات' : 'Database'}
            href={`/${locale}/admin/database`}
            active={pathname === `/${locale}/admin/database`}
          />
          <AdminNavItem
            icon={<Settings size={22} />}
            label={locale === 'ar' ? 'التكوين' : 'Configuration'}
            href={`/${locale}/admin/config`}
            active={pathname === `/${locale}/admin/config`}
          />
        </nav>

        <div className="p-4 border-t border-red-500/20">
          <div className="flex items-center gap-3 px-3 py-4 bg-red-600/10 rounded-2xl border border-red-500/20">
            <div className="bg-red-600/20 text-red-400 p-2 rounded-lg">
              <Shield size={20} />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-xs font-bold truncate text-red-300">
                {session.user?.email}
              </p>
              <p className="text-[10px] text-red-500 uppercase tracking-widest font-black">
                {locale === 'ar' ? 'مدير النظام' : 'ADMINISTRATOR'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="bg-red-950/20 border-b border-red-500/20 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-red-400">
              {locale === 'ar' ? 'مركز التحكم الإداري' : 'ADMIN CONTROL CENTER'}
            </h1>
            <div className="flex items-center gap-4">
              {needsRefresh && (
                <div className="flex items-center gap-2 bg-yellow-600/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-yellow-400">
                    {locale === 'ar' ? 'تحديث الجلسة' : 'SESSION UPDATING'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-red-600/10 px-3 py-1 rounded-lg border border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-red-400">
                  {locale === 'ar' ? 'وصول متقدم' : 'PRIVILEGED ACCESS'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}