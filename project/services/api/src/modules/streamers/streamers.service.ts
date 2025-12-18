import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User } from '../../prisma-client';

type StreamerProfileData = User & {
  streamerProfile?: {
    isPublic?: boolean | null;
    bio?: string | null;
    links?: Record<string, unknown> | null;
  } | null;
  linkedPlatformAccounts: Array<{ platform: string; handle: string; linkedAt?: string | Date }>;
  contentItems: Array<Record<string, unknown>>;
  statsSnapshots: Array<{ followers: number; views: number; likes: number }>;
  liveStatuses: Array<{ platform: string }>;
};

@Injectable()
export class StreamersService {
  constructor(private prisma: PrismaService) {}

  async getPublicProfile(streamerId: string) {
    const user = (await this.prisma.user.findUnique({
      where: { id: streamerId },
      include: {
        streamerProfile: true,
        linkedPlatformAccounts: {
          select: {
            platform: true,
            handle: true,
            linkedAt: true,
          },
        },
        contentItems: {
          take: 10,
          orderBy: { publishedAt: 'desc' },
        },
        statsSnapshots: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        liveStatuses: {
          where: { isLive: true },
        },
      },
    })) as StreamerProfileData | null;

    if (!user || !user.streamerProfile?.isPublic) {
      throw new NotFoundException('Streamer profile not found or not public');
    }

    // Calculate aggregate stats
    const totalStats = user.statsSnapshots.reduce(
      (acc, snapshot) => ({
        followers: acc.followers + snapshot.followers,
        views: acc.views + snapshot.views,
        likes: acc.likes + snapshot.likes,
      }),
      { followers: 0, views: 0, likes: 0 }
    );

    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.streamerProfile.bio,
      links: user.streamerProfile.links,
      platforms: user.linkedPlatformAccounts,
      content: user.contentItems,
      stats: totalStats,
      isLive: user.liveStatuses.length > 0,
      liveOn: user.liveStatuses.map(status => status.platform),
    };
  }

  async getDashboardStats(streamerId: string) {
    const [followers, totalViews, recentContent, pendingRedemptions] = await Promise.all([
      this.prisma.follow.count({
        where: { streamerId },
      }) as Promise<number>,
      this.prisma.statsSnapshot.aggregate({
        where: { streamerId },
        _sum: { views: true },
      }) as Promise<{ _sum?: { views?: number | null } }>,
      this.prisma.contentItem.count({
        where: {
          streamerId,
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }) as Promise<number>,
      this.prisma.redemption.count({
        where: {
          streamerId,
          status: 'PENDING',
        },
      }) as Promise<number>,
    ]);

    return {
      followers,
      totalViews: totalViews._sum?.views ?? 0,
      recentContent,
      pendingRedemptions,
    };
  }

  async getRewards(streamerId: string) {
    return this.prisma.reward.findMany({
      where: { streamerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReward(streamerId: string, data: { title: string; description?: string; costPoints: number }) {
    return this.prisma.reward.create({
      data: {
        ...data,
        streamerId,
      },
    });
  }

  async updateReward(streamerId: string, rewardId: string, data: { title?: string; description?: string; costPoints?: number; isActive?: boolean }) {
    const reward = await this.prisma.reward.findFirst({
      where: { id: rewardId, streamerId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return this.prisma.reward.update({
      where: { id: rewardId },
      data,
    });
  }

  async deleteReward(streamerId: string, rewardId: string) {
    const reward = await this.prisma.reward.findFirst({
      where: { id: rewardId, streamerId },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return this.prisma.reward.delete({
      where: { id: rewardId },
    });
  }

  async getRedemptions(streamerId: string, status?: 'PENDING' | 'FULFILLED' | 'REJECTED') {
    return this.prisma.redemption.findMany({
      where: {
        streamerId,
        ...(status ? { status } : {}),
      },
      include: {
        reward: true,
        viewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRedemptionStatus(streamerId: string, redemptionId: string, status: 'FULFILLED' | 'REJECTED') {
    const redemption = await this.prisma.redemption.findFirst({
      where: { id: redemptionId, streamerId },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return this.prisma.redemption.update({
      where: { id: redemptionId },
      data: {
        status,
        fulfilledAt: status === 'FULFILLED' ? new Date() : null,
      },
    });
  }
}