import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Settings,
  Key,
  Shield,
  Globe,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from "lucide-react";

async function getConfiguration() {
  // Get environment configuration (safely without exposing secrets)
  const config = {
    watchit: {
      hasToken: !!process.env.WATCHIT_API_TOKEN,
      hasDeviceId: !!process.env.WATCHIT_DEVICE_ID,
      hasFastlyToken: !!process.env.WATCHIT_FASTLY_TOKEN,
      hasDgst: !!process.env.WATCHIT_DGST,
    },
    nextauth: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    },
    database: {
      url: process.env.DATABASE_URL || "Not configured",
      type: process.env.DATABASE_URL?.includes("sqlite") ? "SQLite" : 
            process.env.DATABASE_URL?.includes("postgres") ? "PostgreSQL" : "Unknown",
    },
    app: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || "3000",
    },
  };

  return config;
}

export default async function ConfigPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const config = await getConfiguration();

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-red-400">
            Configuration
          </h1>
          <p className="text-slate-400">
            View and manage system configuration and environment variables.
          </p>
        </header>

        {/* Watchit API Configuration */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Watchit API</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">API Token</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  config.watchit.hasToken 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {config.watchit.hasToken ? 'Configured' : 'Missing'}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">Device ID</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  config.watchit.hasDeviceId 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {config.watchit.hasDeviceId ? 'Configured' : 'Missing'}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">Fastly Token</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  config.watchit.hasFastlyToken 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {config.watchit.hasFastlyToken ? 'Configured' : 'Missing'}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">DGST</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  config.watchit.hasDgst 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {config.watchit.hasDgst ? 'Configured' : 'Missing'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Configuration */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Authentication (NextAuth.js)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">NextAuth Secret</label>
              <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  config.nextauth.hasSecret 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {config.nextauth.hasSecret ? 'Configured' : 'Missing'}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">NextAuth URL</label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white font-mono text-sm">{config.nextauth.url}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Configuration */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Database</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">Database Type</label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white font-mono">{config.database.type}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">Connection URL</label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white font-mono text-sm truncate">
                  {config.database.url.replace(/\/\/.*@/, '//***:***@')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Configuration */}
        <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Application</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">Environment</label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white font-mono uppercase">{config.app.nodeEnv}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">Port</label>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-white font-mono">{config.app.port}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all">
            <RefreshCw className="w-5 h-5" />
            Refresh Config
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all">
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}