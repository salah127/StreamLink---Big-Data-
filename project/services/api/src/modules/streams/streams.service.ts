import { Inject, Injectable, Logger } from '@nestjs/common';

import { Platform } from '../../prisma-client';
import type { ProviderFetchOptions, StreamProvider } from './providers/stream-provider.interface';
import type { SerializedStreamSummary, StreamSummary, TrendingStreamsResponse } from './types';

export interface GetTrendingStreamsOptions {
  limit?: number;
  cursor?: string;
  category?: string;
  platforms?: Platform[];
}

interface CacheEntry {
  data: StreamSummary[];
  expiresAt: number;
}

export const STREAM_PROVIDERS_TOKEN = Symbol('STREAM_PROVIDERS_TOKEN');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL_MS = 30 * 1000;

@Injectable()
export class StreamsService {
  private readonly logger = new Logger(StreamsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @Inject(STREAM_PROVIDERS_TOKEN) private readonly providers: StreamProvider[],
  ) { }

  async getRankedStreamers(limit: number = 300): Promise<SerializedStreamSummary[]> {
    try {
      // Fetch from all local HTTP providers
      const results = await Promise.all(
        this.providers.map((provider) =>
          provider.fetchTrendingStreams({ limit }).catch((err) => {
            this.logger.error(`Failed to fetch from ${provider.platform}`, err);
            return [];
          }),
        ),
      );

      const allStreams = results.flat();

      // Sort by viewer count (descending)
      allStreams.sort((a, b) => b.viewerCount - a.viewerCount);

      const mapped: SerializedStreamSummary[] = allStreams.map((item) => ({
        id: item.id,
        streamerId: item.streamerId,
        platform: item.platform,
        title: item.title,
        viewerCount: item.viewerCount,
        startedAt: item.startedAt?.toISOString() || null,
        isLive: true,
        url: item.url,
        thumbnail: item.thumbnail || null,
        creator: item.creator,
        category: item.category || undefined,
      }));

      return mapped.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get ranked streamers', error);
      return [];
    }
  }

  async getTrendingStreams(options: GetTrendingStreamsOptions = {}): Promise<TrendingStreamsResponse> {
    const limit = this.normalizeLimit(options.limit);
    const offset = this.decodeCursor(options.cursor);
    const category = options.category?.trim() || undefined;
    const platforms = this.normalizePlatforms(options.platforms);

    const applicableProviders = this.filterProviders(platforms);
    if (applicableProviders.length === 0) {
      return this.buildResponse([], 0, limit, offset);
    }

    const cacheKey = this.buildCacheKey({ platforms, category });
    const cached = this.cache.get(cacheKey);
    const isCacheValid = cached && cached.expiresAt > Date.now();

    const sortedStreams = isCacheValid
      ? cached!.data
      : await this.fetchAndCacheStreams(cacheKey, applicableProviders, { limit: limit + offset + 10, category });

    return this.buildResponse(sortedStreams, sortedStreams.length, limit, offset);
  }

  private async fetchAndCacheStreams(
    cacheKey: string,
    providers: StreamProvider[],
    options: ProviderFetchOptions,
  ): Promise<StreamSummary[]> {
    const results = await Promise.allSettled(
      providers.map((provider) => provider.fetchTrendingStreams(options)),
    );

    const aggregated = results
      .filter((result): result is PromiseFulfilledResult<StreamSummary[]> => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    if (aggregated.length === 0) {
      const rejected = results.find((result) => result.status === 'rejected');
      if (rejected) {
        this.logger.warn('All stream providers failed to return data for trending streams.');
      }
    }

    const dedupedMap = new Map<string, StreamSummary>();
    for (const stream of aggregated) {
      const key = `${stream.streamerId}:${stream.platform}`;
      const existing = dedupedMap.get(key);
      if (!existing || this.isHigherRank(stream, existing)) {
        dedupedMap.set(key, stream);
      }
    }

    const sorted = Array.from(dedupedMap.values()).sort((a, b) => {
      const viewerDiff = b.viewerCount - a.viewerCount;
      if (viewerDiff !== 0) {
        return viewerDiff;
      }

      const aStarted = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bStarted = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bStarted - aStarted;
    });

    this.cache.set(cacheKey, {
      data: sorted,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return sorted;
  }

  private buildResponse(streams: StreamSummary[], total: number, limit: number, offset: number): TrendingStreamsResponse {
    const pageItems = streams.slice(offset, offset + limit);
    const hasMore = total > offset + limit;
    const nextCursor = hasMore ? this.encodeCursor(offset + limit) : undefined;

    const serialized: SerializedStreamSummary[] = pageItems.map((item) => ({
      ...item,
      startedAt: item.startedAt ? new Date(item.startedAt).toISOString() : null,
      thumbnail: item.thumbnail ?? null,
      creator: {
        ...item.creator,
        displayName: item.creator.displayName ?? undefined,
        username: item.creator.username ?? undefined,
        avatarUrl: item.creator.avatarUrl ?? undefined,
      },
    }));

    return {
      items: serialized,
      meta: {
        total,
        hasMore,
        nextCursor,
      },
    };
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit)) {
      return DEFAULT_LIMIT;
    }
    return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
  }

  private decodeCursor(cursor?: string): number {
    if (!cursor) {
      return 0;
    }

    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const offset = Number.parseInt(decoded, 10);
      return Number.isFinite(offset) && offset >= 0 ? offset : 0;
    } catch (error) {
      this.logger.warn(`Invalid cursor received: ${cursor}`, error as Error);
      return 0;
    }
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(String(offset)).toString('base64');
  }

  private normalizePlatforms(platforms?: Platform[]): Platform[] | undefined {
    if (!platforms || platforms.length === 0) {
      return undefined;
    }

    const unique = Array.from(new Set(platforms));
    return unique.length > 0 ? unique : undefined;
  }

  private filterProviders(platforms?: Platform[]): StreamProvider[] {
    if (!platforms) {
      return this.providers;
    }
    const allowed = new Set(platforms);
    return this.providers.filter((provider) => allowed.has(provider.platform));
  }

  private buildCacheKey(params: { platforms?: Platform[]; category?: string }): string {
    return JSON.stringify({
      platforms: params.platforms?.slice().sort() ?? null,
      category: params.category ?? null,
    });
  }

  private isHigherRank(candidate: StreamSummary, current: StreamSummary): boolean {
    if (candidate.viewerCount === current.viewerCount) {
      const candidateTime = candidate.startedAt ? new Date(candidate.startedAt).getTime() : 0;
      const currentTime = current.startedAt ? new Date(current.startedAt).getTime() : 0;
      return candidateTime > currentTime;
    }
    return candidate.viewerCount > current.viewerCount;
  }
}
