"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProxiedImageUrl, extractBestImageUrl } from "@/lib/utils/image";

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  content_images?: {
    ORIGINAL?: {
      MD?: string;
      SM?: string;
    };
  };
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    
    if (!q.trim()) {
      setLoading(false);
      return;
    }

    // Fetch search results from API
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/search/series?keyword=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if (!res.ok || data.error) {
          throw new Error(data.error || "Search failed");
        }
        
        setResults(data.results || []);
      } catch (err: any) {
        setError(err.message || "Failed to load search results");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Search Results
            </h1>
            <p className="text-slate-400">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        </header>

        {/* Results Grid */}
        {error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Search Error</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((result) => {
              // Extract best image URL from content_images
              const originalImageUrl = extractBestImageUrl(
                result.content_images, 
                typeof window !== "undefined" && window.innerWidth < 640
              );
              
              // Use image proxy for all external images
              const imageUrl = getProxiedImageUrl(originalImageUrl);

              return (
                <div key={result.id} className="bg-[#0f1116] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
                  {/* Image */}
                  <div className="aspect-[3/4] bg-slate-800 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={result.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-slate-500 text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">
                        {result.name}
                      </h3>
                      {result.description && (
                        <p className="text-slate-400 text-sm mt-1 leading-relaxed overflow-hidden">
                          <span className="line-clamp-2">{result.description}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Watch Button */}
                    <Link
                      href={`/player/${result.id}`}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                      <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      Watch
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
            <p className="text-slate-400">
              Try searching with different keywords or check your spelling.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}