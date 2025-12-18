import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async subscribeNotifications(userId: string, token: string, platform: 'EXPO' | 'EMAIL') {
    return this.prisma.notificationSubscription.upsert({
      where: {
        userId_token_platform: {
          userId,
          token,
          platform,
        },
      },
      update: {
        enabled: true,
      },
      create: {
        userId,
        token,
        platform,
        enabled: true,
      },
    });
  }

  async unsubscribeNotifications(userId: string, token: string, platform: 'EXPO' | 'EMAIL') {
    return this.prisma.notificationSubscription.updateMany({
      where: {
        userId,
        token,
        platform,
      },
      data: {
        enabled: false,
      },
    });
  }

  async getSubscriptions(userId: string) {
    return this.prisma.notificationSubscription.findMany({
      where: { userId },
    });
  }

  // This would be called by the worker service
  async sendLiveNotification(streamerId: string, platform: string, title: string) {
    // Get all followers with notifications enabled
    const followers = await this.prisma.follow.findMany({
      where: {
        streamerId,
        notificationsEnabled: true,
      },
      include: {
        viewer: {
          include: {
            notificationSubscriptions: {
              where: { enabled: true },
            },
          },
        },
        streamer: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // In a real implementation, you would send push notifications here
    // using Expo SDK or email service
    console.log(
      `Would send live notification to ${followers.length} followers via ${platform} with title "${title}"`,
    );
    
    return { notificationsSent: followers.length };
  }
}