"use client";

import { useState, useEffect, useCallback } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { 
  Play, 
  Pause,
  Square,
  Shuffle,
  Repeat,
  SkipForward,
  SkipBack,
  List,
  Clock,
  Trash2,
  Plus,
  GripVertical
} from "lucide-react";
import type { QueueItem, RepeatMode } from "@/types";

interface EnhancedEpisodeQueueProps {
  initialQueue?: QueueItem[];
  onEpisodeSelect?: (episode: QueueItem) => void;
  className?: string;
}

export default function EnhancedEpisodeQueue({
  initialQueue = [],
  onEpisodeSelect,
  className = "",
}: EnhancedEpisodeQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [showQueue, setShowQueue] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [draggedItem, setDraggedItem] = useState<QueueItem | null>(null);

  // Initialize queue from local storage
  useEffect(() => {
    const saved = localStorage.getItem("streamMasterQueue");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setQueue(data.queue || []);
        setCurrentIndex(data.currentIndex || 0);
        setIsShuffled(data.isShuffled || false);
        setRepeatMode(data.repeatMode || "off");
      } catch (error) {
        console.error("Failed to load queue from storage:", error);
      }
    }
  }, []);

  // Save queue to local storage
  const saveQueue = useCallback(() => {
    localStorage.setItem("streamMasterQueue", JSON.stringify({
      queue,
      currentIndex,
      isShuffled,
      repeatMode,
      timestamp: Date.now(),
    }));
  }, [queue, currentIndex, isShuffled, repeatMode]);

  useEffect(() => {
    saveQueue();
  }, [queue, currentIndex, isShuffled, repeatMode, saveQueue]);

  // Current episode
  const currentEpisode = queue[currentIndex];

  // Queue controls
  const playNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex = currentIndex;

    if (repeatMode === "one") {
      // Stay on same episode
      setPlaybackTime(0);
      return;
    }

    if (isShuffled) {
      // Random next episode
      const availableIndices = queue
        .map((_, i) => i)
        .filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
    } else {
      // Sequential next
      nextIndex = currentIndex + 1;
      
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentIndex(nextIndex);
    setPlaybackTime(0);
    
    if (onEpisodeSelect && queue[nextIndex]) {
      onEpisodeSelect(queue[nextIndex]);
    }
  }, [queue, currentIndex, isShuffled, repeatMode, onEpisodeSelect]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;

    let prevIndex = currentIndex;

    if (playbackTime > 3) {
      // If more than 3 seconds played, restart current episode
      setPlaybackTime(0);
      return;
    }

    if (isShuffled) {
      // Random previous episode
      const availableIndices = queue
        .map((_, i) => i)
        .filter(i => i !== currentIndex);
      prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] || 0;
    } else {
      // Sequential previous
      prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        prevIndex = repeatMode === "all" ? queue.length - 1 : 0;
      }
    }

    setCurrentIndex(prevIndex);
    setPlaybackTime(0);
    
    if (onEpisodeSelect && queue[prevIndex]) {
      onEpisodeSelect(queue[prevIndex]);
    }
  }, [queue, currentIndex, isShuffled, repeatMode, playbackTime, onEpisodeSelect]);

  // Add episode to queue
  const addToQueue = (episode: QueueItem) => {
    const exists = queue.find(item => item.id === episode.id);
    if (!exists) {
      setQueue(prev => [...prev, episode]);
    }
  };

  // Remove episode from queue
  const removeFromQueue = (episodeId: string) => {
    const episodeIndex = queue.findIndex(item => item.id === episodeId);
    if (episodeIndex === -1) return;

    setQueue(prev => prev.filter(item => item.id !== episodeId));
    
    if (episodeIndex === currentIndex) {
      // Removed current episode, play next
      if (queue.length > 1) {
        playNext();
      } else {
        setCurrentIndex(0);
        setIsPlaying(false);
      }
    } else if (episodeIndex < currentIndex) {
      // Adjust current index
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Clear queue
  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  // Toggle shuffle
  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  // Cycle repeat mode
  const toggleRepeat = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  // Drag and drop handlers
  const handleDragStart = (event: any) => {
    const item = queue.find(q => q.id === event.active.id);
    setDraggedItem(item || null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (active.id !== over?.id) {
      setQueue((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total queue duration
  const totalDuration = queue.reduce((sum, item) => sum + (item.duration || 0), 0);

  return (
    <div className={`bg-black/50 backdrop-blur-md border border-white/10 rounded-xl ${className}`}>
      {/* Queue Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <List size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold">Episode Queue</h3>
            {queue.length > 0 && (
              <span className="text-sm text-slate-400">
                ({queue.length} episodes • {formatDuration(totalDuration)})
              </span>
            )}
          </div>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title={showQueue ? "Hide queue" : "Show queue"}
          >
            <List size={16} />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={playPrevious}
              disabled={queue.length === 0}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              title="Previous episode"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={queue.length === 0}
              className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors disabled:opacity-50"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={playNext}
              disabled={queue.length === 0}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              title="Next episode"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors ${
                isShuffled 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-white/5 text-slate-400"
              }`}
              title="Toggle shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-colors ${
                repeatMode !== "off"
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-white/5 text-slate-400"
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={16} />
              {repeatMode === "one" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
              )}
            </button>
            <button
              onClick={clearQueue}
              disabled={queue.length === 0}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 text-red-400"
              title="Clear queue"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentEpisode && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                {isPlaying ? <Play size={16} /> : <Pause size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentEpisode.name}</p>
                <p className="text-sm text-slate-400 truncate">
                  {currentEpisode.series} • Episode {currentEpisode.episodeNumber}
                </p>
              </div>
              {currentEpisode.duration && (
                <div className="text-sm text-slate-400">
                  {formatDuration(playbackTime)} / {formatDuration(currentEpisode.duration)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Queue List */}
      {showQueue && (
        <div className="max-h-96 overflow-y-auto">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={queue.map(item => item.id)}>
              {queue.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <List size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Queue is empty</p>
                  <p className="text-sm">Add episodes to start building your playlist</p>
                </div>
              ) : (
                queue.map((episode, index) => (
                  <QueueEpisodeItem
                    key={episode.id}
                    episode={episode}
                    index={index}
                    isActive={index === currentIndex}
                    onSelect={() => {
                      setCurrentIndex(index);
                      if (onEpisodeSelect) {
                        onEpisodeSelect(episode);
                      }
                    }}
                    onRemove={() => removeFromQueue(episode.id)}
                  />
                ))
              )}
            </SortableContext>
            <DragOverlay>
              {draggedItem ? (
                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                  <p className="font-medium">{draggedItem.name}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}

// Queue Episode Item Component
interface QueueEpisodeItemProps {
  episode: QueueItem;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function QueueEpisodeItem({
  episode,
  index,
  isActive,
  onSelect,
  onRemove,
}: QueueEpisodeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: episode.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3 border-b border-white/5 transition-colors ${
        isActive 
          ? "bg-blue-600/20 border-blue-500/30" 
          : "hover:bg-white/5"
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} className="text-slate-400" />
      </div>

      {/* Episode Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium truncate">{episode.name}</p>
          <span className="text-xs text-slate-400 ml-2">{index + 1}</span>
        </div>
        <p className="text-sm text-slate-400 truncate">
          {episode.series} • Episode {episode.episodeNumber}
          {episode.duration && (
            <span className="ml-2">({Math.floor(episode.duration / 60)}m)</span>
          )}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 text-red-400"
        title="Remove from queue"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}