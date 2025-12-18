import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Platform } from '../../prisma-client';

@Injectable()
export class PlatformsService {
  constructor(private prisma: PrismaService) {}

  async getLinkedAccounts(userId: string) {
    return this.prisma.linkedPlatformAccount.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        handle: true,
        linkedAt: true,
        scopes: true,
      },
    });
  }

  async linkPlatformAccount(userId: string, platform: Platform, platformData: { 
    platformUserId: string;
    handle: string;
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
  }) {
    // In a real implementation, you would encrypt the tokens
    return this.prisma.linkedPlatformAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      update: {
        platformUserId: platformData.platformUserId,
        handle: platformData.handle,
        accessToken: platformData.accessToken, // Should be encrypted
        refreshToken: platformData.refreshToken, // Should be encrypted
        scopes: platformData.scopes,
      },
      create: {
        userId,
        platform,
        platformUserId: platformData.platformUserId,
        handle: platformData.handle,
        accessToken: platformData.accessToken, // Should be encrypted
        refreshToken: platformData.refreshToken, // Should be encrypted
        scopes: platformData.scopes,
      },
    });
  }

  async unlinkPlatformAccount(userId: string, platform: Platform) {
    const account = await this.prisma.linkedPlatformAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Platform account not found');
    }

    return this.prisma.linkedPlatformAccount.delete({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });
  }

  async getContentItems(streamerId: string, platform?: Platform, type?: 'VIDEO' | 'CLIP' | 'LIVE' | 'SHORT' | 'POST') {
    return this.prisma.contentItem.findMany({
      where: {
        streamerId,
        ...(platform ? { platform } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getLiveStatus(streamerId: string, platform?: Platform) {
    return this.prisma.liveStatus.findMany({
      where: {
        streamerId,
        ...(platform ? { platform } : {}),
      },
    });
  }
}