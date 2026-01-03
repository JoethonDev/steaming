"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import {
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { DownloadProgress, DownloadRequest } from "@/types";

interface DownloadManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DownloadManager({
  isVisible,
  onClose,
}: DownloadManagerProps) {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);
  const [ffmpegLoaded, setFFmpegLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Initialize FFmpeg.wasm
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoaded || isLoading) return;

    setIsLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      // Set up progress logging
      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      ffmpeg.on("progress", ({ progress }) => {
        console.log(`[FFmpeg] Progress: ${Math.round(progress * 100)}%`);
        // Update progress for current conversion
        setDownloads(prev => 
          prev.map(d => 
            d.status === "converting" 
              ? { ...d, progress: Math.round(progress * 100) }
              : d
          )
        );
      });

      // Load FFmpeg with CDN URLs
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setFFmpegLoaded(true);
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ffmpegLoaded, isLoading]);

  // Download HLS segments and convert to MP4
  const downloadAndConvert = useCallback(async (request: DownloadRequest) => {
    if (!ffmpegLoaded) {
      await loadFFmpeg();
    }

    const downloadId = `download_${Date.now()}`;
    const newDownload: DownloadProgress = {
      id: downloadId,
      filename: request.filename,
      progress: 0,
      status: "queued",
    };

    setDownloads(prev => [...prev, newDownload]);

    try {
      // Update status to downloading
      setDownloads(prev => 
        prev.map(d => d.id === downloadId ? { ...d, status: "downloading" } : d)
      );

      // Fetch the HLS manifest
      const response = await fetch(request.manifestUrl);
      if (!response.ok) throw new Error("Failed to fetch manifest");

      const manifestText = await response.text();
      const segmentUrls = parseM3U8(manifestText, request.manifestUrl);

      // Download segments with progress tracking
      const segmentData: Uint8Array[] = [];
      for (let i = 0; i < segmentUrls.length; i++) {
        const segmentResponse = await fetch(segmentUrls[i]);
        if (!segmentResponse.ok) throw new Error(`Failed to fetch segment ${i + 1}`);

        const arrayBuffer = await segmentResponse.arrayBuffer();
        segmentData.push(new Uint8Array(arrayBuffer));

        // Update download progress
        const progress = Math.round(((i + 1) / segmentUrls.length) * 100);
        setDownloads(prev => 
          prev.map(d => d.id === downloadId ? { ...d, progress } : d)
        );
      }

      // Combine segments and convert to MP4
      setDownloads(prev => 
        prev.map(d => d.id === downloadId ? { ...d, status: "converting", progress: 0 } : d)
      );

      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error("FFmpeg not loaded");

      // Write segments to FFmpeg file system
      let concatenatedData = new Uint8Array(
        segmentData.reduce((total, segment) => total + segment.length, 0)
      );
      let offset = 0;
      for (const segment of segmentData) {
        concatenatedData.set(segment, offset);
        offset += segment.length;
      }

      await ffmpeg.writeFile("input.ts", concatenatedData);

      // Convert TS to MP4 using FFmpeg
      await ffmpeg.exec([
        "-i", "input.ts",
        "-c", "copy", // Copy streams without re-encoding for speed
        "-bsf:a", "aac_adtstoasc", // Fix AAC stream
        "-movflags", "faststart", // Optimize for web playback
        "output.mp4"
      ]);

      // Read the output file
      const outputData = await ffmpeg.readFile("output.mp4");
      // Create a new Uint8Array from the data to ensure proper ArrayBuffer type
      const blob = new Blob([new Uint8Array([...outputData as Uint8Array])], { type: "video/mp4" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = request.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clean up FFmpeg files
      await ffmpeg.deleteFile("input.ts");
      await ffmpeg.deleteFile("output.mp4");

      // Update status to completed
      setDownloads(prev => 
        prev.map(d => 
          d.id === downloadId 
            ? { ...d, status: "completed", progress: 100 } 
            : d
        )
      );

    } catch (error) {
      console.error("[Download] Error:", error);
      setDownloads(prev => 
        prev.map(d => 
          d.id === downloadId 
            ? { 
                ...d, 
                status: "error", 
                error: error instanceof Error ? error.message : "Unknown error" 
              } 
            : d
        )
      );
    }
  }, [ffmpegLoaded, loadFFmpeg]);

  // Parse M3U8 manifest to extract segment URLs
  const parseM3U8 = (manifestText: string, baseUrl: string): string[] => {
    const lines = manifestText.split("\n");
    const segmentUrls: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    baseUrlObj.pathname = baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf("/") + 1);

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        // Resolve relative URLs
        const segmentUrl = trimmedLine.startsWith("http") 
          ? trimmedLine 
          : new URL(trimmedLine, baseUrlObj.toString()).toString();
        segmentUrls.push(segmentUrl);
      }
    }

    return segmentUrls;
  };

  // Remove download from list
  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  // Clear all completed downloads
  const clearCompleted = () => {
    setDownloads(prev => prev.filter(d => d.status !== "completed"));
  };

  // Expose the download function for external use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).streamMasterDownload = downloadAndConvert;
    }
  }, [downloadAndConvert]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1116] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Download Manager
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Convert HLS streams to MP4 using your browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* FFmpeg Status */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-slate-300">Loading FFmpeg.wasm...</span>
              </>
            ) : ffmpegLoaded ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">FFmpeg ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-slate-300">FFmpeg not loaded</span>
                <button
                  onClick={loadFFmpeg}
                  className="ml-auto px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Load FFmpeg
                </button>
              </>
            )}
          </div>
        </div>

        {/* Downloads List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No downloads yet</p>
              <p className="text-slate-600 text-sm mt-1">
                Downloads will appear here when you start converting videos
              </p>
            </div>
          ) : (
            downloads.map((download) => (
              <div
                key={download.id}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white truncate">
                    {download.filename}
                  </h4>
                  <div className="flex items-center gap-2">
                    {download.status === "completed" && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {download.status === "error" && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    {(download.status === "downloading" || download.status === "converting") && (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                    <button
                      onClick={() => removeDownload(download.id)}
                      className="text-slate-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">
                      {download.status === "converting" ? "Converting..." : 
                       download.status === "downloading" ? "Downloading..." :
                       download.status === "queued" ? "Queued" :
                       download.status === "completed" ? "Completed" : "Error"}
                    </span>
                    <span className="text-slate-300 font-mono">
                      {download.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        download.status === "error" 
                          ? "bg-red-500" 
                          : download.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>

                  {download.error && (
                    <p className="text-red-400 text-xs mt-2">
                      Error: {download.error}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {downloads.length > 0 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {downloads.filter(d => d.status === "completed").length} completed
            </div>
            <button
              onClick={clearCompleted}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-all"
            >
              Clear Completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}