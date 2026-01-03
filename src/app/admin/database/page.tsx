import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Database,
  Table,
  Users,
  Activity,
  Trash2,
  RefreshCw,
} from "lucide-react";

async function getDatabaseInfo() {
  // Get table counts
  const tableCounts = await Promise.all([
    db.user.count(),
    db.series.count(),
    db.recentSeries.count(),
    db.recentEpisode.count(),
  ]);

  // Get recent activity (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivity = await Promise.all([
    db.user.count({
      where: { createdAt: { gte: yesterday } }
    }),
    db.recentSeries.count({
      where: { viewedAt: { gte: yesterday } }
    }),
    db.recentEpisode.count({
      where: { viewedAt: { gte: yesterday } }
    }),
  ]);

  return {
    tables: {
      users: tableCounts[0],
      series: tableCounts[1],
      recentSeries: tableCounts[2],
      recentEpisodes: tableCounts[3],
    },
    activity: {
      newUsers: recentActivity[0],
      seriesViews: recentActivity[1],
      episodeViews: recentActivity[2],
    },
  };
}

export default async function DatabasePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const dbInfo = await getDatabaseInfo();

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-red-400">
            Database Management
          </h1>
          <p className="text-slate-400">
            Monitor and manage your database tables and data.
          </p>
        </header>

        {/* Database Overview */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Table Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-black text-white mb-1">{dbInfo.tables.users}</p>
              <p className="text-slate-400 text-sm">Users</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
              <Table className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <p className="text-3xl font-black text-white mb-1">{dbInfo.tables.series}</p>
              <p className="text-slate-400 text-sm">Series</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
              <Activity className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <p className="text-3xl font-black text-white mb-1">{dbInfo.tables.recentSeries}</p>
              <p className="text-slate-400 text-sm">Recent Series</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 text-center">
              <Activity className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <p className="text-3xl font-black text-white mb-1">{dbInfo.tables.recentEpisodes}</p>
              <p className="text-slate-400 text-sm">Recent Episodes</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">24-Hour Activity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-slate-300 font-medium">New Users</p>
              </div>
              <p className="text-2xl font-black text-white">{dbInfo.activity.newUsers}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-slate-300 font-medium">Series Views</p>
              </div>
              <p className="text-2xl font-black text-white">{dbInfo.activity.seriesViews}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <p className="text-slate-300 font-medium">Episode Views</p>
              </div>
              <p className="text-2xl font-black text-white">{dbInfo.activity.episodeViews}</p>
            </div>
          </div>
        </div>

        {/* Database Actions */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Database Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-300 hover:bg-blue-600/30 transition-all">
              <RefreshCw className="w-5 h-5" />
              <div className="text-left">
                <p className="font-bold">Refresh Stats</p>
                <p className="text-xs text-blue-400">Update table counts</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-500/30 rounded-xl text-green-300 hover:bg-green-600/30 transition-all">
              <Database className="w-5 h-5" />
              <div className="text-left">
                <p className="font-bold">Backup Database</p>
                <p className="text-xs text-green-400">Create backup file</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-600/30 transition-all">
              <Trash2 className="w-5 h-5" />
              <div className="text-left">
                <p className="font-bold">Clean History</p>
                <p className="text-xs text-red-400">Remove old entries</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}