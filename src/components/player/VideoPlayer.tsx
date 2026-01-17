"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import DownloadButton from "../download/DownloadButton";
import type { Episode, VideoPlayerProps } from "@/types";

export default function VideoPlayer({
  episode,
  streamUrl,
  manifestUrl, // Legacy prop
  onTimeUpdate,
  onEnded,
  onNext,
  onPrevious,
  autoplay = false,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [bufferedTime, setBufferedTime] = useState(0);

  // Auto-hide controls
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate buffered time
  const getBufferedTime = useCallback(() => {
    if (!videoRef.current) return 0;
    
    const video = videoRef.current;
    const currentTime = video.currentTime;
    const buffered = video.buffered;
    
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      
      if (start <= currentTime && currentTime <= end) {
        return end;
      }
    }
    
    return currentTime;
  }, []);
  
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);
  
  // Show controls when paused or cleanup on unmount
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Initialize HLS player
  const initializePlayer = useCallback(async (url: string) => {
    if (!videoRef.current) {
      console.error("Video ref not available");
      return;
    }

    console.log("Initializing player with URL:", url);
    setError("");
    setIsLoading(true);

    try {
      // Clean up existing HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Validate URL
      if (!url || !url.trim()) {
        throw new Error("Invalid or empty stream URL");
      }

      if (Hls.isSupported()) {
        console.log("HLS is supported, creating instance");
        console.log("HLS.js version:", Hls.version || "Version not available");
        
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // Disable low latency for better buffering
          backBufferLength: 90,
          maxBufferLength: 60, // Increase buffer length
          maxBufferSize: 120 * 1000 * 1000, // 120MB (increased from 60MB)
          maxBufferHole: 0.1, // Reduce acceptable buffer gaps
          highBufferWatchdogPeriod: 1, // More frequent buffer monitoring
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxLoadingDelay: 4,
          startLevel: -1, // Auto start level
          testBandwidth: true,
          debug: process.env.NODE_ENV === 'development',
        });

        hlsRef.current = hls;

        console.log("Loading HLS source:", url);
        hls.loadSource(url);
        
        console.log("Attaching media to video element");
        hls.attachMedia(videoRef.current);

        // Add more event listeners for debugging
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS: Media attached successfully");
          // Force check video properties
          setTimeout(() => {
            if (videoRef.current) {
              console.log("Post-attachment check:");
              console.log("- Duration:", videoRef.current.duration);
              console.log("- ReadyState:", videoRef.current.readyState);
              console.log("- NetworkState:", videoRef.current.networkState);
              console.log("- CurrentTime:", videoRef.current.currentTime);
            }
          }, 100);
        });

        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          console.log("HLS: Started loading manifest");
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("HLS: Manifest parsed successfully", data);
          console.log("Video duration after manifest parsed:", videoRef.current?.duration);
          console.log("Video readyState after manifest parsed:", videoRef.current?.readyState);
          setIsLoading(false);
          
          // Extract quality levels
          const levels = hls.levels.map(level => 
            `${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`
          );
          setQualities(["auto", ...levels]);
          
          // Force update duration and current time
          if (videoRef.current) {
            const duration = videoRef.current.duration;
            const currentTime = videoRef.current.currentTime;
            console.log("Forcing initial time update - duration:", duration, "currentTime:", currentTime);
            
            if (!isNaN(duration) && isFinite(duration)) {
              setDuration(duration);
            }
            if (!isNaN(currentTime) && isFinite(currentTime)) {
              setCurrentTime(currentTime);
            }
          }
          
          if (autoplay) {
            console.log("Auto-playing video");
            videoRef.current?.play();
          }
        });

        hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
          const fragmentUrl = data.frag?.url || 'unknown';
          const fragmentSize = data.frag?.duration || 0;
          console.log(`HLS: Loading fragment - URL: ${fragmentUrl.substring(fragmentUrl.lastIndexOf('/') + 1)}, Duration: ${fragmentSize}s`);
          
          // Store start time for performance measurement
          (data.frag as any)._loadStartTime = performance.now();
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          const loadEndTime = performance.now();
          const loadStartTime = (data.frag as any)._loadStartTime || loadEndTime;
          const loadDuration = (loadEndTime - loadStartTime) / 1000; // Convert to seconds
          const fragmentSize = data.payload?.byteLength || 0;
          const fragmentUrl = data.frag?.url || 'unknown';
          const fragmentDuration = data.frag?.duration || 0;
          
          // Calculate download speed
          const downloadSpeedKbps = fragmentSize > 0 && loadDuration > 0 ? (fragmentSize / 1024) / loadDuration : 0;
          const downloadSpeedMbps = downloadSpeedKbps / 1024;
          
          console.log(`HLS: Fragment loaded - ${fragmentUrl.substring(fragmentUrl.lastIndexOf('/') + 1)}`);
          console.log(`  - Size: ${(fragmentSize / 1024).toFixed(1)}KB`);
          console.log(`  - Duration: ${fragmentDuration.toFixed(1)}s`);
          console.log(`  - Load time: ${loadDuration.toFixed(2)}s`);
          console.log(`  - Speed: ${downloadSpeedKbps.toFixed(1)}KB/s (${downloadSpeedMbps.toFixed(2)}MB/s)`);
          
          // Warn about slow downloads
          if (downloadSpeedKbps > 0 && downloadSpeedKbps < 100) {
            console.warn(`⚠️ SLOW DOWNLOAD DETECTED: ${downloadSpeedKbps.toFixed(1)}KB/s is very slow!`);
            console.log('Fragment details:');
            console.log(`- URL: ${fragmentUrl}`);
            console.log(`- Expected speed should be >500KB/s for smooth playback`);
            
            // Run diagnostics on first slow download
            if (!(window as any)._diagnosticsRun) {
              (window as any)._diagnosticsRun = true;
              console.log('🔧 Running network diagnostics...');
            }
          }
          
          // Update buffer status
          const buffered = getBufferedTime();
          if (!isNaN(buffered) && isFinite(buffered)) {
            setBufferedTime(buffered);
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          console.log("HLS: Buffer appended");
          const buffered = getBufferedTime();
          if (!isNaN(buffered) && isFinite(buffered)) {
            setBufferedTime(buffered);
          }
          
          // Check for potential stalling
          if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const bufferAhead = buffered - currentTime;
            
            if (bufferAhead < 5 && !videoRef.current.paused) {
              console.warn(`⚠️ Low buffer warning: only ${bufferAhead.toFixed(2)}s ahead`);
              
              // If buffer is critically low, try to load more aggressively
              if (bufferAhead < 2) {
                console.log('📡 Requesting more buffer due to low buffer');
                hls.startLoad();
              }
            }
          }
        });

        // Monitor buffer health
        hls.on(Hls.Events.BUFFER_EOS, () => {
          console.log("HLS: End of stream reached in buffer");
        });

        // Track loading progress
        hls.on(Hls.Events.BUFFER_FLUSHING, () => {
          console.log("HLS: Buffer flushing");
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.group("🚨 HLS Error Event");
          console.log("Event:", event);
          console.log("Full Error Data:", data);
          
          // Check if data is empty
          if (!data || Object.keys(data).length === 0) {
            console.error("ERROR: Empty error data object received!");
            console.log("This suggests HLS.js version issue or event listener problem");
          } else {
            console.log("Error Type:", data.type);
            console.log("Error Details:", data.details);
            console.log("Error Fatal:", data.fatal);
            console.log("Error URL:", data.url);
            console.log("Error Response:", data.response);
            console.log("Error Network Details:", data.networkDetails);
            console.log("Error Context:", data.context);
            console.log("Error Reason:", data.reason);
            console.log("Error Level:", data.level);
          }
          console.groupEnd();
          
          // Handle specific error types
          if (data?.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT || data?.details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT) {
            console.log(`⏱️ Download timeout detected: ${data.details}`);
            console.log('URL:', data.url);
            console.log('This indicates very slow network or CDN issues');
            
            if (!data.fatal) {
              console.log('Non-fatal timeout - HLS.js will retry automatically');
              return;
            }
          }
          
          if (data?.details === Hls.ErrorDetails.FRAG_LOAD_ERROR || data?.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR) {
            console.log(`🌐 Network error detected: ${data.details}`);
            console.log('URL:', data.url);
            console.log('Response:', data.response);
            
            if (!data.fatal) {
              console.log('Non-fatal network error - HLS.js will retry automatically');
              return;
            }
          }
          
          if (data?.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            console.log('🔄 Handling buffer stall - attempting recovery');
            
            // Try to recover from buffer stall
            if (videoRef.current) {
              const currentTime = videoRef.current.currentTime;
              const buffered = videoRef.current.buffered;
              
              console.log('Buffer stall recovery info:', {
                currentTime,
                bufferedRanges: Array.from({ length: buffered.length }, (_, i) => ({
                  start: buffered.start(i),
                  end: buffered.end(i)
                }))
              });
              
              // Try nudging playback slightly forward if there's buffered content ahead
              for (let i = 0; i < buffered.length; i++) {
                const start = buffered.start(i);
                const end = buffered.end(i);
                
                if (start > currentTime && start - currentTime < 1) {
                  console.log(`Nudging playback from ${currentTime} to ${start + 0.1}`);
                  videoRef.current.currentTime = start + 0.1;
                  break;
                }
              }
            }
            
            // Force buffer reload
            setTimeout(() => {
              if (hls && videoRef.current && !videoRef.current.paused) {
                console.log('Force restarting load after stall');
                hls.startLoad();
              }
            }, 100);
            
            return; // Don't treat as fatal error
          }
          
          if (data?.fatal) {
            console.error("Fatal HLS error - attempting recovery");
            setIsLoading(false);
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error recovery attempt");
                hls.startLoad();
                setError("Network error occurred. Retrying...");
                break;
                
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error recovery attempt");
                hls.recoverMediaError();
                setError("Media error occurred. Recovering...");
                break;
                
              default:
                console.log("Unrecoverable error");
                setError(`Playback error: ${data?.details || 'Unknown error'}`);
                break;
            }
          } else {
            console.warn("Non-fatal HLS error:", data?.details || 'Unknown error');
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const level = hls.levels[data.level];
          const bandwidth = hls.bandwidthEstimate || 0;
          if (level) {
            console.log(`Quality switched to: ${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`);
            console.log(`Estimated bandwidth: ${Math.round(bandwidth / 1000)}kbps`);
            setCurrentQuality(`${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`);
            
            // Warn if bandwidth seems very low
            if (bandwidth > 0 && bandwidth < 500000) { // Less than 500kbps
              console.warn(`⚠️ LOW BANDWIDTH DETECTED: ${Math.round(bandwidth / 1000)}kbps`);
              console.log('This may cause slow downloads and buffering issues');
              console.log('Consider:');
              console.log('- Checking internet connection speed');
              console.log('- Disabling browser network throttling');
              console.log('- Closing other bandwidth-heavy applications');
            }
          }
        });

      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        videoRef.current.src = url;
        setIsLoading(false);
        if (autoplay) {
          videoRef.current.play();
        }
      } else {
        setError("HLS is not supported in this browser");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Player initialization error:", error);
      setError("Failed to initialize video player");
      setIsLoading(false);
    }
  }, [autoplay]);

  // Control functions
  const togglePlay = useCallback(async () => {
    if (!videoRef.current) {
      console.log("No video ref available");
      return;
    }
    
    console.log("togglePlay called - video paused:", videoRef.current.paused);
    console.log("Video readyState:", videoRef.current.readyState);
    console.log("Video currentTime:", videoRef.current.currentTime);
    console.log("Video duration:", videoRef.current.duration);
    
    try {
      if (videoRef.current.paused) {
        console.log("Starting playback...");
        const playPromise = videoRef.current.play();
        if (playPromise) {
          await playPromise;
          console.log("Playback started successfully");
        }
      } else {
        console.log("Pausing playback...");
        videoRef.current.pause();
        console.log("Playback paused");
      }
    } catch (error) {
      console.error("Playback error:", error);
      setError(`Playback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []); // Remove dependency on isPlaying

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) {
      console.log("Seek failed - no video element");
      return;
    }
    
    if (isNaN(time) || !isFinite(time)) {
      console.log("Seek failed - invalid time:", time);
      return;
    }
    
    // Clamp time to valid range
    const duration = videoRef.current.duration;
    if (isNaN(duration) || duration <= 0) {
      console.log("Seek failed - invalid duration:", duration);
      return;
    }
    
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    console.log("🎯 UNRESTRICTED SEEK to:", clampedTime, "from:", videoRef.current.currentTime, "duration:", duration);
    
    try {
      // Update UI immediately for responsive feedback
      setCurrentTime(clampedTime);
      
      // Set video time - NO BUFFER RESTRICTIONS
      videoRef.current.currentTime = clampedTime;
      
      // If using HLS and seeking to unbuffered position, start loading from that position
      if (hlsRef.current) {
        console.log("📡 Starting HLS load from seek position for faster playback");
        hlsRef.current.startLoad(clampedTime);
      }
      
      // Force time update callback
      if (onTimeUpdate) {
        onTimeUpdate(clampedTime, duration);
      }
    } catch (error) {
      console.error("Seek error:", error);
    }
  }, [onTimeUpdate]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current && !isNaN(newVolume) && isFinite(newVolume)) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, [isFullscreen]);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    const newTime = currentTime + seconds;
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    
    console.log(`⏭️ UNRESTRICTED SKIP ${seconds}s: ${currentTime.toFixed(2)} -> ${clampedTime.toFixed(2)}`);
    
    // Use handleSeek for consistent seeking behavior
    handleSeek(clampedTime);
  }, [handleSeek]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const changeQuality = useCallback((qualityIndex: number) => {
    if (!hlsRef.current) return;
    
    if (qualityIndex === 0) {
      // Auto quality
      hlsRef.current.currentLevel = -1;
      setCurrentQuality("auto");
    } else {
      hlsRef.current.currentLevel = qualityIndex - 1;
    }
  }, []);

  // Keyboard controls (after control functions are defined)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          event.preventDefault();
          skip(30);
          break;
        case 'KeyM':
          event.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [togglePlay, skip, toggleMute, toggleFullscreen]);

  // Load stream URL
  useEffect(() => {
    const urlToLoad = streamUrl || manifestUrl; // Support both new and legacy props
    
    if (urlToLoad) {
      console.log("Using provided URL:", urlToLoad);
      initializePlayer(urlToLoad);
    } else if (episode?.asset_id) {
      console.log("Resolving stream URL for asset_id:", episode.asset_id);
      // Resolve stream URL from asset_id
      const resolveStream = async () => {
        setIsLoading(true);
        try {
          console.log("Making request to /api/stream/resolve with asset_id:", episode.asset_id);
          const response = await fetch("/api/stream/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId: episode.asset_id }),
          });

          console.log("Stream resolve response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Stream resolve failed with:", errorText);
            throw new Error(`Failed to resolve stream: ${response.status}`);
          }

          const data = await response.json();
          console.log("Stream resolved successfully:", data);
          
          if (!data.url) {
            console.error("No URL in response data:", data);
            throw new Error("No stream URL returned from resolution");
          }
          
          initializePlayer(data.url);
        } catch (error) {
          console.error("Stream resolution error:", error);
          setError(`Failed to load video stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      };

      resolveStream();
    } else {
      console.log("No URL or asset_id provided");
      setError("No stream source available");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [episode?.asset_id, streamUrl, manifestUrl, initializePlayer]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      const buffered = getBufferedTime();
      
      // Only update if values are valid numbers
      if (!isNaN(current) && isFinite(current)) {
        setCurrentTime(current);
      }
      if (!isNaN(total) && isFinite(total)) {
        setDuration(total);
      }
      if (!isNaN(buffered) && isFinite(buffered)) {
        setBufferedTime(buffered);
      }
      
      // Debug logging every 5 seconds or when seeking
      const shouldLog = Math.floor(current) % 5 === 0 || Math.abs(current - (currentTime || 0)) > 1;
      if (shouldLog) {
        console.log("Time update - current:", current.toFixed(2), "duration:", total.toFixed(2), "buffered:", buffered.toFixed(2));
      }
      
      onTimeUpdate?.(current, total);
    };

    const handleLoadedMetadata = () => {
      console.log("Loaded metadata - duration:", video.duration);
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleLoadedData = () => {
      console.log("Loaded data - video is ready to play");
      console.log("Duration at loadeddata:", video.duration);
      console.log("Current time at loadeddata:", video.currentTime);
      
      // Force state update when video data is loaded
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      if (!isNaN(video.currentTime) && isFinite(video.currentTime)) {
        setCurrentTime(video.currentTime);
      }
    };

    const handlePlay = () => {
      console.log("Video play event fired");
      setIsPlaying(true);
      resetControlsTimeout();
    };
    
    const handlePause = () => {
      console.log("Video pause event fired");
      setIsPlaying(false);
      setShowControls(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleSeeked = () => {
      console.log("Video seeked to:", video.currentTime);
      setCurrentTime(video.currentTime);
    };

    const handleLoadStart = () => {
      console.log("Video load started");
    };

    const handleDurationChange = () => {
      console.log("Duration changed to:", video.duration);
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleProgress = () => {
      const buffered = getBufferedTime();
      if (!isNaN(buffered) && isFinite(buffered)) {
        setBufferedTime(buffered);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("volumechange", handleVolumeChange);
    
    // Additional event handlers for better state management
    video.addEventListener("waiting", () => {
      console.log("Video waiting event - buffering needed");
      setIsLoading(true);
      
      // If we have HLS and this is a stall, try to help
      if (hlsRef.current) {
        setTimeout(() => {
          if (hlsRef.current && video.readyState < 3) {
            console.log('Helping with stalled playback');
            hlsRef.current.startLoad();
          }
        }, 1000);
      }
    });
    video.addEventListener("canplay", () => {
      console.log("Video canplay event - can start playing");
      setIsLoading(false);
      
      // If playback was supposed to be playing but got stalled, resume it
      if (isPlaying && video.paused && video.readyState >= 3) {
        console.log('Resuming playback after buffer recovery');
        video.play().catch(console.error);
      }
    });
    video.addEventListener("canplaythrough", () => {
      console.log("Video canplaythrough event - can play through without stopping");
      setIsLoading(false);
      
      // Force time state update when video is fully ready
      if (!isNaN(video.duration) && isFinite(video.duration)) {
        console.log("Setting duration from canplaythrough:", video.duration);
        setDuration(video.duration);
      }
      if (!isNaN(video.currentTime) && isFinite(video.currentTime)) {
        console.log("Setting currentTime from canplaythrough:", video.currentTime);
        setCurrentTime(video.currentTime);
      }
    });
    video.addEventListener("error", (e) => {
      console.error("Video element error:", e);
      setError("Video playback error");
      setIsLoading(false);
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("waiting", () => setIsLoading(true));
      video.removeEventListener("canplay", () => setIsLoading(false));
      video.removeEventListener("canplaythrough", () => setIsLoading(false));
      video.removeEventListener("error", (e) => {
        console.error("Video element error:", e);
        setError("Video playback error");
        setIsLoading(false);
      });
    };
  }, [onTimeUpdate, onEnded, getBufferedTime]);

  // Force time updates if video events aren't firing properly
  useEffect(() => {
    if (!videoRef.current) return;
    
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      
      const current = video.currentTime;
      const total = video.duration;
      const buffered = getBufferedTime();
      const bufferAhead = buffered - current;
      
      // Force update if we have valid values but state is still 0
      if ((!currentTime || currentTime === 0) && current > 0) {
        console.log("Force updating currentTime:", current);
        setCurrentTime(current);
      }
      
      if ((!duration || duration === 0) && total > 0) {
        console.log("Force updating duration:", total);
        setDuration(total);
      }
      
      // Monitor for potential buffer stalls
      if (bufferAhead < 3 && !video.paused && hlsRef.current) {
        console.log(`⚠️ Buffer warning: ${bufferAhead.toFixed(2)}s ahead at ${current.toFixed(2)}s`);
        
        // If buffer is critically low and HLS is available, try to boost loading
        if (bufferAhead < 1) {
          console.log('🚨 Critical buffer level - boosting load');
          hlsRef.current.startLoad();
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [currentTime, duration, getBufferedTime]);
  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Format time
  const formatTime = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If no manifest URL provided, show placeholder
  const urlToLoad = streamUrl || manifestUrl;
  if (!urlToLoad && !episode?.asset_id) {
    return (
      <div className="relative bg-zinc-900 rounded-2xl aspect-video flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <Play size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select an episode to start streaming</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Loading video...</p>
            <p className="text-xs text-slate-300 mt-1">Seeking to any position is allowed</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={32} className="text-red-400" />
            </div>
            <p className="text-white text-lg mb-2">Playback Error</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          showControls || isFullscreen ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Background gradient - only shows when controls are visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div className="text-white">
            {episode && (
              <div>
                <h3 className="text-lg font-semibold mb-1">{episode.name}</h3>
                <p className="text-sm text-slate-300">
                  {episode.series} • Episode {episode.episodeNumber || episode.episode_number}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <DownloadButton 
              episode={episode}
              streamUrl={streamUrl || manifestUrl}
              className="px-3 py-2 text-sm rounded-lg"
            />
          </div>
        </div>

        {/* Center Play Button */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Center play button clicked");
                togglePlay();
              }}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <Play size={32} className="text-white ml-1" />
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-2">
              {/* Buffered progress background */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 left-0 h-1 bg-white/20 rounded-lg transition-all duration-300 pointer-events-none"
                style={{ 
                  width: duration && duration > 0 ? `${Math.min((bufferedTime / duration) * 100, 100)}%` : '0%' 
                }}
              />
              
              {/* Main progress bar */}
              <input
                type="range"
                min={0}
                max={duration && !isNaN(duration) && duration > 0 ? duration : 100}
                value={currentTime && !isNaN(currentTime) ? currentTime : 0}
                step={0.1}
                onChange={(e) => {
                  e.stopPropagation();
                  const value = Number(e.target.value);
                  const isUnbuffered = value > bufferedTime;
                  console.log("🎯 UNRESTRICTED PROGRESS BAR SEEK:", value, "duration:", duration);
                  if (isUnbuffered) {
                    console.log("⚡ Seeking to unbuffered position - will load on demand");
                  }
                  handleSeek(value);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log("Progress bar mouse down - pausing for seek");
                  if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  console.log("Progress bar mouse up - resuming if was playing");
                  if (videoRef.current && isPlaying) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
                className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider relative z-10"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Previous */}
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Previous episode"
                >
                  <SkipBack size={20} className="text-white" />
                </button>
              )}

              {/* Skip Back */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Skip back button clicked");
                  skip(-10);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Skip back 10s"
              >
                <RotateCcw size={18} className="text-white" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Play/pause button clicked");
                  togglePlay();
                }}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={24} className="text-white" />
                ) : (
                  <Play size={24} className="text-white ml-1" />
                )}
              </button>

              {/* Skip Forward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Skip forward button clicked");
                  skip(30);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Skip forward 30s"
              >
                <RotateCw size={18} className="text-white" />
              </button>

              {/* Next */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Next episode"
                >
                  <SkipForward size={20} className="text-white" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  style={{ pointerEvents: 'auto' }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} className="text-white" />
                  ) : (
                    <Volume2 size={18} className="text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(Number(e.target.value));
                  }}
                  onInput={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(Number((e.target as HTMLInputElement).value));
                  }}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings size={18} className="text-white" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-48">
                    {/* Playback Speed */}
                    <div className="mb-4">
                      <p className="text-white text-sm font-medium mb-2">Speed</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              playbackRate === rate
                                ? "bg-blue-600 text-white"
                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality */}
                    {qualities.length > 1 && (
                      <div>
                        <p className="text-white text-sm font-medium mb-2">Quality</p>
                        <div className="space-y-1">
                          {qualities.map((quality, index) => (
                            <button
                              key={index}
                              onClick={() => changeQuality(index)}
                              className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                (index === 0 && currentQuality === "auto") ||
                                (index > 0 && qualities[index] === currentQuality)
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-300 hover:bg-white/20"
                              }`}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize size={18} className="text-white" />
                ) : (
                  <Maximize size={18} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider {
          background: transparent !important;
          outline: none;
        }
        .slider::-webkit-slider-track {
          background: rgba(255, 255, 255, 0.3);
          height: 4px;
          border-radius: 2px;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }
        .slider::-moz-range-track {
          background: rgba(255, 255, 255, 0.3);
          height: 4px;
          border-radius: 2px;
          border: none;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}