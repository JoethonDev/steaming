"use client";

import { useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import DownloadManager from "./DownloadManager";
import type { DownloadRequest } from "@/types";

interface DownloadButtonProps {
  episode?: {
    id: string | number;
    name: string;
    asset_id: string;
  };
  streamUrl?: string;
  className?: string;
}

export default function DownloadButton({
  episode,
  streamUrl,
  className = "",
}: DownloadButtonProps) {
  const [showManager, setShowManager] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!episode && !streamUrl) {
      setError("No episode or stream URL provided");
      return;
    }

    setError("");
    setIsResolving(true);

    try {
      let manifestUrl = streamUrl;

      // If no streamUrl provided, resolve it using the episode's asset_id
      if (!manifestUrl && episode) {
        const response = await fetch("/api/stream/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assetId: episode.asset_id }),
        });

        if (!response.ok) {
          throw new Error("Failed to resolve stream URL");
        }

        const data = await response.json();
        manifestUrl = data.url;
      }

      if (!manifestUrl) {
        throw new Error("Could not obtain stream URL");
      }

      // Generate filename
      const filename = episode 
        ? `${episode.name.replace(/[^a-zA-Z0-9\s-_]/g, "").replace(/\s+/g, "_")}.mp4`
        : `stream_${Date.now()}.mp4`;

      // Create download request
      const downloadRequest: DownloadRequest = {
        episodeId: episode?.id ? String(episode.id) : `stream_${Date.now()}`,
        assetId: episode?.asset_id || "",
        manifestUrl,
        filename,
      };

      // Check if download manager is available
      if (typeof window !== "undefined" && (window as any).streamMasterDownload) {
        (window as any).streamMasterDownload(downloadRequest);
        setShowManager(true);
      } else {
        setError("Download manager not available. Please refresh the page.");
      }

    } catch (error) {
      console.error("Download error:", error);
      setError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isResolving}
        className={`flex items-center gap-2 font-bold transition-all ${
          isResolving
            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
            : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
        } ${className}`}
        title={episode ? `Download ${episode.name}` : "Download video"}
      >
        {isResolving ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Download size={20} />
        )}
        <span>
          {isResolving ? "Preparing..." : "Download"}
        </span>
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Download Manager Modal */}
      <DownloadManager
        isVisible={showManager}
        onClose={() => setShowManager(false)}
      />
    </>
  );
}