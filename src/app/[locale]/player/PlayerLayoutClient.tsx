"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import {
  Play,
  Home,
  Layout,
  Settings,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import type { Session } from "next-auth";
import type { Locale } from "@/i18n/config";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface PlayerLayoutClientProps {
  children: ReactNode;
  session: Session;
  locale: Locale;
}

function NavItem({ icon, label, href, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </Link>
  );
}

export default function PlayerLayoutClient({ 
  children, 
  session, 
  locale 
}: PlayerLayoutClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-[#030406] text-white overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-white/10 flex flex-col bg-[#08090c] transition-all">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Play className="fill-white w-5 h-5 ml-0.5" />
          </div>
          <span className="font-extrabold tracking-tighter text-xl hidden lg:block">
            S.MASTER
          </span>
        </div>

        <nav className="flex-grow px-3 space-y-2 mt-4">
          <NavItem
            icon={<ArrowLeft size={22} />}
            label={locale === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            href={`/${locale}/dashboard`}
          />
          <NavItem
            icon={<Home size={22} />}
            label={t('home')}
            href={`/${locale}/dashboard`}
          />
          <NavItem
            icon={<Layout size={22} />}
            label={t('catalog')}
            href={`/${locale}/dashboard/catalog`}
          />
          {(session.user as any).role === "ADMIN" && (
            <NavItem
              icon={<Settings size={22} />}
              label={t('admin')}
              href={`/${locale}/admin`}
            />
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <UserIcon size={16} />
            </div>
            <div className="hidden lg:block text-sm">
              <p className="font-bold">{session.user?.email}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {(session.user as any)?.role || "USER"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">{children}</main>
    </div>
  );
}