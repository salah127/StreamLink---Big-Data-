import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HealthCheck } from './health.types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Check database connectivity
    const databaseCheck = await this.checkDatabase();

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    const status = databaseCheck.status === 'disconnected' ? 'error' : 'ok';

    return {
      status,
      timestamp,
      uptime,
      database: databaseCheck,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'connected' | 'disconnected' | 'mock';
    latency?: number;
  }> {
    // Check if using mock Prisma by checking if user model has mock methods
    const isMock = typeof (this.prisma as any).user?.findUnique === 'function' &&
                   !(this.prisma as any).$connect;

    if (isMock) {
      this.logger.warn('Health check: Using mock Prisma client');
      return { status: 'mock' };
    }

    try {
      const start = Date.now();
      // Simple query to check database connectivity
      // Try to use $queryRaw if available (real Prisma), otherwise just check if we can query
      if (typeof (this.prisma as any).$queryRaw === 'function') {
        await (this.prisma as any).$queryRaw`SELECT 1`;
      } else {
        // Fallback for mock - try a simple query
        await this.prisma.user.findFirst({ take: 1 });
      }
      const latency = Date.now() - start;

      return {
        status: 'connected',
        latency,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'disconnected',
      };
    }
  }
}
