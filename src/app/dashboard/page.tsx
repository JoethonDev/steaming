"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default locale dashboard
    router.replace("/ar/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030406]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<UserHistoryResponse | null>(null);
  // Search state
  const [searchMode, setSearchMode] = useState<'name' | 'id'>("name");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  // Legacy analyze by ID
  const [seriesId, setSeriesId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      getUserHistory().then(setHistory).catch(console.error);
    }
  }, [session]);

  // Search API integration
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    if (searchMode === "name" && searchInput.trim().length < 4) {
      setSearchError("Series name must be at least 4 characters.");
      return;
    }
    if (!searchInput.trim()) {
      setSearchError("Please enter a value to search.");
      return;
    }
    setIsSearching(true);
    try {
      const keyword = searchInput.trim();
      
      if (searchMode === "id") {
        // Search by Series ID using existing series/[id] route
        const res = await fetch(`/api/series/${encodeURIComponent(keyword)}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Series not found");
        }
        // Navigate directly to player for single series
        router.push(`/player/${keyword}`);
        return;
      } else {
        // Search by name - navigate to search results page with just the query
        router.push(`/dashboard/search?q=${encodeURIComponent(keyword)}`);
        return;
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to search. Try again.");
      setIsSearching(false);
    }
  };

  // Legacy: Analyze by Series ID
  const handleAnalyzeSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeMessage("");
    try {
      await analyzeSeries(seriesId.trim());
      setAnalyzeMessage("Series analyzed successfully!");
      setSeriesId("");
      // Refresh history
      const newHistory = await getUserHistory();
      setHistory(newHistory);
    } catch (error: any) {
      setAnalyzeMessage(error.message || "Failed to analyze series");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!session || !history) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Welcome back, {session?.user?.email?.split("@")[0]}!
            </h1>
            <p className="text-slate-400">
              Your streaming command center awaits.
            </p>
          </div>
          {(session?.user as any)?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Admin Panel
            </Link>
          )}
        </header>

        {/* Search & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/catalog"
            className="group bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1"
          >
            <Film className="w-8 h-8 mb-4 text-white" />
            <h3 className="text-xl font-bold text-white mb-2">
              Browse Catalog
            </h3>
            <p className="text-indigo-100 text-sm mb-4">
              Explore all analyzed series ready for streaming
            </p>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* New Search UI */}
          <div className="bg-[#0f1116] border border-white/10 p-8 rounded-3xl">
            <Search className="w-8 h-8 mb-4 text-slate-400" />
            <h3 className="text-xl font-bold text-white mb-2">
              Search Series
            </h3>
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded-xl font-bold transition-all ${searchMode === "name" ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400"}`}
                onClick={() => setSearchMode("name")}
                type="button"
              >
                By Name
              </button>
              <button
                className={`px-3 py-1 rounded-xl font-bold transition-all ${searchMode === "id" ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400"}`}
                onClick={() => setSearchMode("id")}
                type="button"
              >
                By Series ID
              </button>
            </div>
            <form id="series-search-form" onSubmit={handleSearch} className="space-y-3">
              <input
                type={searchMode === "id" ? "number" : "text"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchMode === "name" ? "Series name..." : "Series ID..."}
                disabled={isSearching}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim() || (searchMode === "name" && searchInput.trim().length < 4)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </button>
              {searchError && (
                <p className="text-sm text-red-400">{searchError}</p>
              )}
            </form>
            {/* Status */}
            {isSearching && (
              <div className="mt-4 flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-slate-400">Searching...</span>
              </div>
            )}
          </div>

          {/* Legacy: Analyze by Series ID */}
          <div className="bg-[#0f1116] border border-white/10 p-8 rounded-3xl">
            <TrendingUp className="w-8 h-8 mb-4 text-green-400" />
            <h3 className="text-xl font-bold text-white mb-2">
              System Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Watchit API</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Brightcove</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Database</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Series */}
          <div className="bg-[#0f1116] border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Recent Series
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Last {history?.recentSeries?.length || 0} analyzed series
              </p>
            </div>
            <div className="p-6 space-y-3">
              {history?.recentSeries && history.recentSeries.length > 0 ? (
                history.recentSeries.map((item) => (
                  <Link
                    key={item.id}
                    href={`/player/${item.id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.posterUrl ? (
                        <img 
                          src={getProxiedImageUrl(item.posterUrl) || ''} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {item.name || 'Unknown Series'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {new Date(item.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No recent series</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Episodes */}
          <div className="bg-[#0f1116] border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Recent Episodes
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Last {history?.recentEpisodes?.length || 0} watched episodes
              </p>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {history?.recentEpisodes && history.recentEpisodes.length > 0 ? (
                history.recentEpisodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-xs font-bold text-green-400">
                      #{episode.id?.slice(-2) || '??'}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">
                        {episode.name || 'Unknown Episode'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {new Date(episode.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Play className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No recent episodes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}