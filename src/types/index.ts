// Global TypeScript type definitions for Stream Master Pro

// NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
    };
  }

  interface User {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN";
  }
}

// API Response Types
export interface SeriesResponse {
  series: {
    id: string;
    name: string;
    description?: string;
    posterUrl?: string;
    seasons: Season[];
  };
}

export interface Season {
  id: string;
  season_number: number;
  name?: string;
}

export interface Episode {
  id: string | number; // Can be either but will be converted to string
  episode_number: number;
  episodeNumber?: number; // Alias for convenience
  name: string;
  description?: string;
  asset_id: string;
  season_id: string;
  series?: string; // Series name for convenience
}

export interface StreamResolveRequest {
  assetId: string;
}

export interface StreamResolveResponse {
  url: string;
  description?: string;
  poster?: string;
}

// Component Props Types
export interface VideoPlayerProps {
  episode?: Episode;
  streamUrl?: string;
  manifestUrl?: string; // Legacy support
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  autoplay?: boolean;
  className?: string;
}

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface PlayerLayoutProps {
  children: React.ReactNode;
}

// User History Types
export interface UserHistoryResponse {
  recentSeries: Array<{
    id: string;
    name: string;
    description?: string | null;
    posterUrl?: string | null;
    viewedAt: Date;
  }>;
  recentEpisodes: Array<{
    id: string;
    assetId: string;
    name: string;
    viewedAt: Date;
  }>;
  totalSeries: number;
  totalEpisodes: number;
}

// Server Action Types
export interface TrackEpisodeViewParams {
  episodeId: string;
  assetId: string;
  name: string;
}

export interface ServerActionResponse {
  success?: boolean;
  error?: string;
}

// Admin Types
export interface UserManagementData {
  users: Array<{
    id: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: Date;
    _count: {
      recentSeries: number;
      recentEpisodes: number;
    };
  }>;
}

// Download Types
export interface DownloadProgress {
  id: string;
  filename: string;
  progress: number;
  status: "queued" | "downloading" | "converting" | "completed" | "error";
  error?: string;
}

export interface DownloadRequest {
  episodeId: string;
  assetId: string;
  manifestUrl: string;
  filename: string;
}

// System Health Types
export interface SystemHealth {
  watchitApi: "online" | "offline" | "error";
  brightcove: "online" | "offline" | "error";
  database: "online" | "offline" | "error";
  lastChecked: Date;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserEditFormData {
  email: string;
  role: "USER" | "ADMIN";
}

// Queue Management Types
export interface QueueItem {
  id: string;
  name: string;
  series: string;
  episodeNumber: number;
  duration?: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  episodes: Episode[];
  createdAt: Date;
  updatedAt: Date;
}

// Catalog Types
export interface CatalogSeries {
  id: string;
  name: string;
  description?: string | null;
  posterUrl?: string | null;
  createdAt: Date;
}

// Admin User Management Types
export interface AdminUser {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  _count: {
    recentSeries: number;
    recentEpisodes: number;
  };
}