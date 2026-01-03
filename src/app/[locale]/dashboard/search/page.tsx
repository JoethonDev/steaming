"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
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

interface SearchPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function SearchResultsPage({ params }: SearchPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [locale, setLocale] = React.useState<string>('ar');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  React.useEffect(() => {
    params.then(({ locale: paramLocale }) => {
      setLocale(paramLocale || 'ar');
    });
  }, [params]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    
    if (!q || !q.trim()) {
      setLoading(false);
      setError(locale === 'ar' ? "يرجى إدخال كلمة بحث" : "Please enter a search query");
      return;
    }

    performSearch(q);
  }, [searchParams, locale]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/search/series?keyword=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || (locale === 'ar' ? 'فشل في البحث' : 'Search failed'));
      }
      
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || (locale === 'ar' ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {locale === 'ar' ? 'نتائج البحث' : 'Search Results'}
            </h1>
            {query && (
              <p className="text-slate-400 mt-1">
                {locale === 'ar' ? `البحث عن: "${query}"` : `Search for: "${query}"`}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-slate-400">{t('searching')}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-2xl text-center">
            <p className="text-lg font-bold mb-2">
              {locale === 'ar' ? 'خطأ' : 'Error'}
            </p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="text-slate-600" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {locale === 'ar' ? 'لم يتم العثور على نتائج' : 'No Results Found'}
                </h3>
                <p className="text-slate-500 mb-8">
                  {locale === 'ar' 
                    ? 'جرب كلمات مختلفة أو تحقق من الإملاء' 
                    : 'Try different keywords or check your spelling'
                  }
                </p>
                <Link
                  href={`/${locale}/dashboard`}
                  className="bg-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all"
                >
                  {locale === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-6">
                  {locale === 'ar' 
                    ? `تم العثور على ${results.length} نتيجة`
                    : `Found ${results.length} results`
                  }
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {results.map((series) => {
                    const posterUrl = extractBestImageUrl(series.content_images);
                    
                    return (
                      <Link
                        key={series.id}
                        href={`/${locale}/player/${series.id}`}
                        className="group bg-[#0f1116] rounded-3xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all hover:-translate-y-2 shadow-xl hover:shadow-indigo-500/10"
                      >
                        <div className="aspect-[2/3] relative overflow-hidden">
                          {posterUrl ? (
                            <img
                              src={getProxiedImageUrl(posterUrl)}
                              alt={series.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                              <Play className="text-white/30" size={48} />
                            </div>
                          )}
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                            <div className="bg-indigo-600 p-3 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                              <Play className="fill-white text-white" size={20} />
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-indigo-300 transition-colors">
                            {series.name}
                          </h3>
                          {series.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {series.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}