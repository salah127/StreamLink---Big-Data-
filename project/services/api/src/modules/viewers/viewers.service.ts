import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

type StreamerRecord = {
  streamerProfile?: { isPublic?: boolean | null } | null;
};

type RewardRecord = {
  streamerId: string;
  costPoints: number;
  isActive?: boolean | null;
  title?: string | null;
};

@Injectable()
export class ViewersService {
  constructor(private prisma: PrismaService) {}

  async followStreamer(viewerId: string, streamerId: string) {
    // Check if streamer exists
    const streamer = await this.prisma.user.findUnique({
      where: { id: streamerId },
      include: { streamerProfile: true },
    });

    const typedStreamer = streamer as (StreamerRecord & { id: string }) | null;

    if (!typedStreamer || !typedStreamer.streamerProfile) {
      throw new NotFoundException('Streamer not found');
    }

    return this.prisma.follow.upsert({
      where: {
        viewerId_streamerId: {
          viewerId,
          streamerId,
        },
      },
      update: {
        notificationsEnabled: true,
      },
      create: {
        viewerId,
        streamerId,
        notificationsEnabled: true,
      },
    });
  }

  async unfollowStreamer(viewerId: string, streamerId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        viewerId_streamerId: {
          viewerId,
          streamerId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    return this.prisma.follow.delete({
      where: {
        viewerId_streamerId: {
          viewerId,
          streamerId,
        },
      },
    });
  }

  async getFollowing(viewerId: string) {
    return this.prisma.follow.findMany({
      where: { viewerId },
      include: {
        streamer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            streamerProfile: {
              select: {
                bio: true,
              },
            },
            liveStatuses: {
              where: { isLive: true },
              select: {
                platform: true,
                title: true,
                startedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeemReward(viewerId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      include: { streamer: true },
    });

    const typedReward = reward as unknown as (RewardRecord & { streamer?: { id: string } | null }) | null;

    if (!typedReward || typedReward.isActive === false) {
      throw new NotFoundException('Reward not found or inactive');
    }

    // Check if user has enough points
    const pointsBalance = await this.getPointsBalance(viewerId, typedReward.streamerId);
    if (pointsBalance < typedReward.costPoints) {
      throw new BadRequestException('Insufficient points');
    }

    // Create redemption and deduct points in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create redemption
      const redemption = await prisma.redemption.create({
        data: {
          rewardId,
          viewerId,
          streamerId: typedReward.streamerId,
        },
      });

      // Deduct points
      await prisma.pointsTransaction.create({
        data: {
          userId: viewerId,
          streamerId: typedReward.streamerId,
          delta: -typedReward.costPoints,
          reason: `Redeemed: ${typedReward.title ?? 'Reward'}`,
          metadata: { redemptionId: redemption.id },
        },
      });

      return redemption;
    });
  }

  async getRedemptions(viewerId: string) {
    return this.prisma.redemption.findMany({
      where: { viewerId },
      include: {
        reward: {
          select: {
            title: true,
            description: true,
            costPoints: true,
          },
        },
        streamer: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getPointsBalance(userId: string, streamerId: string): Promise<number> {
    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        streamerId,
      },
    });

    const typedTransactions = transactions as Array<{ delta: number }>;

    return typedTransactions.reduce((balance, transaction) => balance + transaction.delta, 0);
  }
}