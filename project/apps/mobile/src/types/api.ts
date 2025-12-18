export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  role: 'VIEWER' | 'STREAMER' | 'BOTH' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export type StreamPlatform = 'TWITCH' | 'YOUTUBE' | 'KICK' | 'INSTAGRAM' | 'TIKTOK' | 'X';

export interface StreamerProfile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  links?: Record<string, string>;
  platforms: PlatformAccount[];
  content: ContentItem[];
  stats: {
    followers: number;
    views: number;
    likes: number;
  };
  isLive: boolean;
  liveOn: StreamPlatform[];
}

export interface PlatformAccount {
  platform: StreamPlatform;
  handle: string;
  linkedAt: string;
}

export interface ContentItem {
  id: string;
  platform: string;
  type: 'VIDEO' | 'CLIP' | 'LIVE' | 'SHORT' | 'POST';
  title: string;
  url: string;
  thumbnail?: string;
  publishedAt: string;
  statsCached?: {
    views: number;
    likes: number;
    comments: number;
  };
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  costPoints: number;
  isActive: boolean;
}

export interface Redemption {
  id: string;
  reward: {
    title: string;
    description?: string;
    costPoints: number;
  };
  streamer: {
    displayName?: string;
    avatarUrl?: string;
  };
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  createdAt: string;
  fulfilledAt?: string;
}

export interface Follow {
  id: string;
  streamer: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
    streamerProfile?: {
      bio?: string;
    };
    liveStatuses: Array<{
      platform: StreamPlatform;
      title?: string;
      startedAt?: string;
    }>;
  };
  createdAt: string;
  notificationsEnabled: boolean;
}

export interface Poll {
  id: string;
  question: string;
  status: 'OPEN' | 'CLOSED';
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
  createdAt: string;
  endsAt?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  product?: {
    title: string;
    description?: string;
  };
  streamer?: {
    displayName?: string;
    avatarUrl?: string;
  };
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  followers: number;
  totalViews: number;
  recentContent: number;
  pendingRedemptions: number;
}

export interface TrendingStreamCreator {
  id: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

export interface TrendingStream {
  id: string;
  streamerId: string;
  title: string;
  platform: StreamPlatform;
  viewerCount: number;
  startedAt: string | null;
  thumbnail?: string | null;
  url: string;
  category?: string | null;
  creator: TrendingStreamCreator;
}

export interface TrendingStreamsResponse {
  items: TrendingStream[];
  meta: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}