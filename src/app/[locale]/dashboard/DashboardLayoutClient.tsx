"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { usePathname } from "next/navigation";
import {
  Play,
  Home,
  Layout,
  Settings,
  User as UserIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Session } from "next-auth";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session;
  locale: Locale;
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="font-bold hidden lg:block">{label}</span>
    </Link>
  );
}

export default function DashboardLayoutClient({ 
  children, 
  session, 
  locale 
}: DashboardLayoutClientProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Determine active route
  const isHomeActive = pathname === `/${locale}/dashboard`;
  const isCatalogActive = pathname.includes('/catalog');
  const isAdminActive = pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-[#030406] text-white flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-[#0a0b0f] border-r border-white/10 flex flex-col">
        {/* Logo */}
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
            icon={<Home size={22} />}
            label={t('home')}
            href={`/${locale}/dashboard`}
            active={isHomeActive}
          />
          <NavItem
            icon={<Layout size={22} />}
            label={t('catalog')}
            href={`/${locale}/dashboard/catalog`}
            active={isCatalogActive}
          />
          {(session.user as any)?.role === "ADMIN" && (
            <NavItem
              icon={<Settings size={22} />}
              label={t('admin')}
              href={`/${locale}/admin`}
              active={isAdminActive}
            />
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-4 bg-white/5 rounded-2xl">
            <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">
              <UserIcon size={20} />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-xs font-bold truncate">{session.user?.email}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {(session.user as any)?.role || "USER"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}