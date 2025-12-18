import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Platform } from '../../../prisma-client';
import type { StreamSummary } from '../types';
import type { ProviderFetchOptions, StreamProvider } from './stream-provider.interface';

interface LinkedPlatformAccountSummary {
  platform: Platform;
  handle: string | null;
  platformUserId: string | null;
}

interface LiveStatusWithStreamer {
  id: string;
  streamerId: string;
  platform: Platform;
  isLive: boolean;
  startedAt?: Date | null;
  title?: string | null;
  game?: string | null;
  viewerCount?: number | null;
  thumbnailUrl?: string | null;
  streamer: {
    id: string;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    linkedPlatformAccounts: LinkedPlatformAccountSummary[];
  };
}

@Injectable()
export class PrismaStreamProvider implements StreamProvider {
  private readonly logger = new Logger(PrismaStreamProvider.name);

  constructor(
    protected readonly prisma: PrismaService,
    readonly platform: Platform,
  ) {}

  async fetchTrendingStreams(options: ProviderFetchOptions): Promise<StreamSummary[]> {
    try {
      const liveStatuses = await this.prisma.liveStatus.findMany({
        where: {
          isLive: true,
          platform: this.platform,
          ...(options.category ? { game: options.category } : {}),
        },
        include: {
          streamer: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              linkedPlatformAccounts: true,
            },
          },
        },
        orderBy: [
          { viewerCount: 'desc' },
          { startedAt: 'desc' },
        ],
        take: Math.min(Math.max(options.limit, 1), 100),
      });

  return liveStatuses.map((status) => this.mapToSummary(status as unknown as LiveStatusWithStreamer));
    } catch (error) {
      this.logger.error(`Failed to fetch trending streams for ${this.platform}`, error as Error);
      return [];
    }
  }

  protected mapToSummary(status: LiveStatusWithStreamer): StreamSummary {
    const account = status.streamer.linkedPlatformAccounts.find(
      (linked) => linked.platform === this.platform,
    );

    const viewerCount = typeof status.viewerCount === 'number' ? status.viewerCount : 0;
    const fallbackUrl = `https://stream.link/streamers/${status.streamerId}`;
    const platformUrl = account?.handle
      ? this.buildPlatformUrl(this.platform, account.handle)
      : fallbackUrl;

    return {
      id: status.id,
      streamerId: status.streamerId,
      title: status.title ?? 'Untitled Stream',
      platform: this.platform,
      viewerCount,
      startedAt: status.startedAt ?? undefined,
      thumbnail: status.thumbnailUrl ?? status.streamer.avatarUrl ?? null,
      url: platformUrl,
      category: status.game,
      creator: {
        id: status.streamer.id,
        displayName: status.streamer.displayName,
        username: status.streamer.username,
        avatarUrl: status.streamer.avatarUrl,
      },
    };
  }

  private buildPlatformUrl(platform: Platform, handle: string): string {
    const sanitizedHandle = handle.replace(/^@/, '');

    switch (platform) {
      case Platform.TWITCH:
        return `https://twitch.tv/${sanitizedHandle}`;
      case Platform.YOUTUBE:
        return `https://youtube.com/${sanitizedHandle}`;
      case Platform.KICK:
        return `https://kick.com/${sanitizedHandle}`;
      case Platform.INSTAGRAM:
        return `https://instagram.com/${sanitizedHandle}`;
      case Platform.TIKTOK:
        return `https://tiktok.com/@${sanitizedHandle}`;
      case Platform.X:
        return `https://x.com/${sanitizedHandle}`;
      default:
        return `https://stream.link/${sanitizedHandle}`;
    }
  }
}
