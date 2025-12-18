import { Platform } from '../../prisma-client';

export interface StreamCreatorSummary {
  id: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

export interface StreamSummary {
  id: string;
  streamerId: string;
  title: string;
  platform: Platform;
  viewerCount: number;
  startedAt?: Date | null;
  thumbnail?: string | null;
  url: string;
  creator: StreamCreatorSummary;
  category?: string | null;
}

export interface SerializedStreamSummary extends Omit<StreamSummary, 'startedAt'> {
  startedAt: string | null;
}

export interface TrendingStreamsResponse {
  items: SerializedStreamSummary[];
  meta: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}
