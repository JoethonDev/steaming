import { db } from "@/lib/db";
import { getProxiedImageUrl } from "@/lib/utils/image";
import { Play, Info, Calendar } from "lucide-react";
import Link from "next/link";
import type { CatalogSeries } from "@/types";

export default async function CatalogPage() {
  const series: CatalogSeries[] = await db.series.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            GLOBAL CATALOG
          </h1>
          <p className="text-slate-400">
            All analyzed series available for immediate streaming.
          </p>
        </header>

        {series.length === 0 ? (
          <div className="bg-[#0f1116] border border-dashed border-white/10 rounded-[40px] p-20 text-center">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info className="text-slate-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Catalog is Empty</h3>
            <p className="text-slate-500 mb-8">
              Go to the Command Center to analyze your first series.
            </p>
            <Link
              href="/dashboard"
              className="bg-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all"
            >
              Analyze Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {series.map((item) => (
              <Link
                key={item.id}
                href={`/player/${item.id}`}
                className="group relative bg-[#0f1116] rounded-[32px] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all hover:-translate-y-2 shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {item.posterUrl ? (
                    <img
                      src={getProxiedImageUrl(item.posterUrl) || ''}
                      alt={item.name}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/20 to-black flex items-center justify-center">
                      <Play className="text-indigo-500/20" size={64} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-black text-lg leading-tight mb-1 group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <Calendar size={12} className="text-indigo-500" />
                      Added {new Date(item.createdAt).toLocaleDateString()}
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
