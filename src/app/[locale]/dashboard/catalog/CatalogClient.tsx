"use client";

import React from "react";
import { useTranslation } from "@/i18n/client";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { Play, Info, Calendar } from "lucide-react";
import Link from "next/link";
import type { CatalogSeries } from "@/types";
import type { Locale } from "@/i18n/config";

interface CatalogClientProps {
  series: CatalogSeries[];
  locale: Locale;
}

export default function CatalogClient({ series, locale }: CatalogClientProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            {t('global_catalog')}
          </h1>
          <p className="text-slate-400">
            {t('all_analyzed_series')}
          </p>
        </header>

        {series.length === 0 ? (
          <div className="bg-[#0f1116] border border-dashed border-white/10 rounded-[40px] p-20 text-center">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="text-slate-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('catalog_empty')}</h3>
            <p className="text-slate-500 mb-8">
              {t('catalog_empty_desc')}
            </p>
            <Link
              href={`/${locale}/dashboard`}
              className="bg-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all"
            >
              {t('analyze_now')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {series.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}/player/${item.id}`}
                className="group relative bg-[#0f1116] rounded-[32px] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all hover:-translate-y-2 shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {item.posterUrl ? (
                    <img
                      src={getProxiedImageUrl(item.posterUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                      <Play className="text-white/30" size={64} />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-indigo-600 p-4 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                      <Play className="fill-white text-white" size={24} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {item.year || "N/A"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Play size={12} />
                      {item._count?.episodes || 0} episodes
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}