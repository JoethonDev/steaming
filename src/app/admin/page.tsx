import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Users,
  Activity,
  Database,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

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

  return {
    userCount,
    seriesCount,
    adminCount,
    recentActivity,
  };
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

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [stats, health] = await Promise.all([
    getSystemStats(),
    getSystemHealth(),
  ]);

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-red-400">
            System Overview
          </h1>
          <p className="text-slate-400">
            Monitor and manage your Stream Master Pro instance.
          </p>
        </header>

        {/* System Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600/20 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <Link
                href="/admin/users"
                className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors"
              >
                MANAGE →
              </Link>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {stats.userCount}
            </h3>
            <p className="text-sm text-slate-400">Total Users</p>
            <p className="text-xs text-slate-500 mt-2">
              {stats.adminCount} Administrators
            </p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-600/20 p-3 rounded-xl">
                <Database className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs font-bold text-slate-500">
                CATALOG
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {stats.seriesCount}
            </h3>
            <p className="text-sm text-slate-400">Series Analyzed</p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs font-bold text-slate-500">
                7 DAYS
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {stats.recentActivity}
            </h3>
            <p className="text-sm text-slate-400">Episodes Viewed</p>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-600/20 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <Link
                href="/admin/system"
                className="text-xs font-bold text-slate-500 hover:text-orange-400 transition-colors"
              >
                VIEW →
              </Link>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {health.database === "online" && health.watchitApi === "online" ? "100%" : "Degraded"}
            </h3>
            <p className="text-sm text-slate-400">System Health</p>
          </div>
        </div>

        {/* System Health Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1116] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Service Status
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Real-time system component health
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health.database === "online" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-bold text-white">Database</span>
                </div>
                {health.database === "online" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health.watchitApi === "online" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-bold text-white">Watchit API</span>
                </div>
                {health.watchitApi === "online" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health.brightcove === "online" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-bold text-white">Brightcove</span>
                </div>
                {health.brightcove === "online" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>

              <div className="text-xs text-slate-500 text-center mt-4">
                Last checked: {health.lastChecked.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="bg-[#0f1116] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Quick Actions
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Administrative tools and shortcuts
              </p>
            </div>
            <div className="p-6 space-y-4">
              <Link
                href="/admin/users"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="bg-blue-600/20 p-3 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    Manage Users
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add, edit, or remove user accounts
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/system"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-green-500/30 transition-all group"
              >
                <div className="bg-green-600/20 p-3 rounded-xl">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-green-400 transition-colors">
                    System Health
                  </h4>
                  <p className="text-xs text-slate-500">
                    Monitor API status and performance
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-600/10 border border-orange-500/20">
                <div className="bg-orange-600/20 p-3 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-300">
                    Database Backup
                  </h4>
                  <p className="text-xs text-orange-500">
                    Automated backups are recommended
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}