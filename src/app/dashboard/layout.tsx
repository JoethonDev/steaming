import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Play,
  Home,
  Layout,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import type { DashboardLayoutProps, NavItemProps } from "@/types";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-[#030406] text-white overflow-hidden">
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
            icon={<Home size={22} />}
            label="Home"
            href="/dashboard"
            active
          />
          <NavItem
            icon={<Layout size={22} />}
            label="Catalog"
            href="/dashboard/catalog"
          />
          {(session.user as any)?.role === "ADMIN" && (
            <NavItem
              icon={<Settings size={22} />}
              label="Admin"
              href="/admin"
            />
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
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

function NavItem({ icon, label, href, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        active
          ? "bg-indigo-600/10 text-indigo-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={
          active
            ? "text-indigo-400"
            : "group-hover:text-white transition-colors"
        }
      >
        {icon}
      </span>
      <span className="font-bold text-sm hidden lg:block">{label}</span>
    </Link>
  );
}
