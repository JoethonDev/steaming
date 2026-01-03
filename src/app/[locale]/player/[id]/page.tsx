"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Layers, Play, Loader2 } from "lucide-react";
import VideoPlayer from "@/components/player/VideoPlayer";
import DownloadButton from "@/components/download/DownloadButton";
import { trackEpisodeView } from "@/lib/actions/series";
import { useTranslation } from "@/i18n/client";
import { Episode, Season, SeriesResponse } from "@/types";

interface SeriesMetadata {
  id: string;
  name: string;
  description?: string;
  posterUrl?: string;
  seasons: Season[];
}

export default function PlayerPage() {
  const { id: seriesId } = useParams();
  const { t } = useTranslation();
  const [metadata, setMetadata] = useState<SeriesMetadata | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Initial Metadata Load
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/series/${seriesId}`);
        const data = await res.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          return;
        }
        
        const series = data.series;
        if (!series) {
          console.error('No series data received');
          return;
        }
        
        setMetadata(series);
        const seasonList = series.seasons || [];
        setSeasons(seasonList);
        
        // Only fetch episodes after seasons are set and verified
        if (seasonList.length > 0 && seasonList[0]?.id) {
          // Use setTimeout to ensure state is updated
          setTimeout(() => {
            fetchEpisodes(0, seasonList);
          }, 0);
        }
      } catch (error) {
        console.error('Failed to load series:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (seriesId) {
      init();
    }
  }, [seriesId]);

  // 2. Fetch Episodes for Season
  async function fetchEpisodes(index: number, seasonsArray?: Season[]) {
    setCurrentSeasonIndex(index);
    setEpisodes([]);
    
    try {
      // Use provided seasons array or fall back to state
      const currentSeasons = seasonsArray || seasons;
      
      // Check if seasons exist and index is valid
      if (!currentSeasons || currentSeasons.length === 0 || !currentSeasons[index]) {
        console.error('Invalid season data or index:', { currentSeasons, index });
        return;
      }
      
      const season = currentSeasons[index];
      if (!season.id) {
        console.error('Season missing id property:', season);
        return;
      }
      
      const seasonId = season.id;
      const res = await fetch(`/api/episodes?seriesId=${seriesId}&seasonId=${seasonId}`);
      const data = await res.json();
      
      if (data.error) {
        console.error('Episodes API error:', data.error);
        return;
      }
      
      setEpisodes(data);
      if (data.length > 0) {
        selectEpisode(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch episodes:', err);
    }
  }

  // 3. Resolve Stream & Track History
  async function selectEpisode(ep: Episode) {
    setActiveEpisode(ep);
    setStreamUrl("");
    try {
      const res = await fetch("/api/stream/resolve", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: ep.asset_id }),
      });
      const data = await res.json();
      setStreamUrl(data.url);
      
      // Background history tracking
      await trackEpisodeView({
        episodeId: String(ep.id),
        assetId: ep.asset_id,
        name: ep.name
      });
    } catch (err) {
      console.error('Stream resolution failed:', err);
    }
  }



  if (loading) return (
    <div className="flex-grow flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  return (
    <div className="flex-grow flex flex-col lg:flex-row overflow-hidden h-full">
      {/* Video Content */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-10 min-h-0">
        <div className="max-w-5xl mx-auto space-y-8">
          <VideoPlayer manifestUrl={streamUrl} episode={activeEpisode} />

          <div>
            <div className="flex items-start justify-between gap-6 mb-6">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-black">{activeEpisode?.name || metadata?.name}</h1>
                <p className="text-slate-400 leading-relaxed text-sm lg:text-base">
                  {activeEpisode?.description || metadata?.description}
                </p>
              </div>
              <DownloadButton 
                episode={activeEpisode}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Queue */}
      <aside className="w-full lg:w-[400px] lg:max-h-screen border-l border-white/10 bg-[#08090c] flex flex-col">
        <div className="p-6 border-bottom border-white/5 flex-shrink-0">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2 mb-6">
            <Layers size={14} /> Content Queue
          </h2>

          <div className="flex flex-wrap gap-2">
            {seasons.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => fetchEpisodes(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentSeasonIndex === idx ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                S{s.season_number || s.seasonNumber || idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => selectEpisode(ep)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                activeEpisode?.id === ep.id 
                  ? "bg-indigo-600/10 border-indigo-500/30" 
                  : "bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                activeEpisode?.id === ep.id ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500"
              }`}>
                {ep.episode_number || ep.episodeNumber}
              </div>
              <div className="text-left overflow-hidden">
                <p className={`text-sm font-bold truncate ${activeEpisode?.id === ep.id ? "text-white" : "text-slate-300"}`}>
                  {ep.name}
                </p>
                <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">
                  Asset: {ep.asset_id}
                </p>
              </div>
              <Play size={16} className={`ml-auto ${activeEpisode?.id === ep.id ? "text-indigo-400" : "text-slate-800"}`} />
            </button>
          ))}

          {episodes.length === 0 && (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No episodes available</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}