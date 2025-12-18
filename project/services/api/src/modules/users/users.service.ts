import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        streamerProfile: true,
        viewerProfile: true,
        linkedPlatformAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const sanitizedDisplayName = data.displayName?.trim();

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(sanitizedDisplayName !== undefined ? { displayName: sanitizedDisplayName } : {}),
      },
      include: {
        streamerProfile: true,
        viewerProfile: true,
      },
    });
  }

  async getPointsBalance(userId: string, streamerId?: string) {
    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        userId,
        ...(streamerId ? { streamerId } : {}),
      },
    });

    const typedTransactions = transactions as Array<{ delta: number }>;

    return typedTransactions.reduce((balance, transaction) => balance + transaction.delta, 0);
  }

  async deleteAccount(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}