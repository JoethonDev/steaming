import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

async function getSystemInfo() {
  // Get system environment info
  const nodeVersion = process.version;
  const platform = process.platform;
  const nodeEnv = process.env.NODE_ENV;
  
  // Check API status
  const apiStatus = {
    watchit: !!process.env.WATCHIT_API_TOKEN,
    fastly: !!process.env.WATCHIT_FASTLY_TOKEN,
    nextauth: !!process.env.NEXTAUTH_SECRET,
    database: !!process.env.DATABASE_URL,
  };

  // Get database stats
  const dbStats = await Promise.all([
    db.user.count(),
    db.series.count(),
    db.recentSeries.count(),
    db.recentEpisode.count(),
  ]);

  return {
    environment: {
      nodeVersion,
      platform,
      nodeEnv,
    },
    apiStatus,
    database: {
      users: dbStats[0],
      series: dbStats[1],
      recentSeries: dbStats[2],
      recentEpisodes: dbStats[3],
    },
  };
}

export default async function SystemPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const systemInfo = await getSystemInfo();

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-red-400">
            System Information
          </h1>
          <p className="text-slate-400">
            Detailed system status and configuration information.
          </p>
        </header>

        {/* Environment Info */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Environment</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Node Version</p>
              <p className="text-white font-mono">{systemInfo.environment.nodeVersion}</p>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Platform</p>
              <p className="text-white font-mono capitalize">{systemInfo.environment.platform}</p>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Environment</p>
              <p className="text-white font-mono uppercase">{systemInfo.environment.nodeEnv}</p>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Wifi className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">API Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(systemInfo.apiStatus).map(([key, status]) => (
              <div key={key} className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                {status ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className={`text-sm ${status ? 'text-green-400' : 'text-red-400'}`}>
                    {status ? 'Configured' : 'Missing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <HardDrive className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Database Statistics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-2xl font-black text-white mb-1">{systemInfo.database.users}</p>
              <p className="text-slate-400 text-sm">Users</p>
            </div>
            <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-2xl font-black text-white mb-1">{systemInfo.database.series}</p>
              <p className="text-slate-400 text-sm">Series</p>
            </div>
            <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-2xl font-black text-white mb-1">{systemInfo.database.recentSeries}</p>
              <p className="text-slate-400 text-sm">Recent Series</p>
            </div>
            <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <p className="text-2xl font-black text-white mb-1">{systemInfo.database.recentEpisodes}</p>
              <p className="text-slate-400 text-sm">Recent Episodes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}