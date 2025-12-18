import * as path from 'path';
import { BullModule } from '@nestjs/bull';
import { Logger, MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { StreamersModule } from './modules/streamers/streamers.module';
import { StreamsModule } from './modules/streams/streams.module';
import { UsersModule } from './modules/users/users.module';
import { ViewersModule } from './modules/viewers/viewers.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

import { config } from '@streamlink/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // Prioritize local .env file in services/api
        path.resolve(__dirname, '../../.env'),
        // Then project root .env
        path.resolve(__dirname, '../../../../.env'),
        // Fallback to default check based on CWD
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([{
      ttl: config.rateLimit.windowMs,
      limit: config.rateLimit.max,
    }]),
    BullModule.forRoot({
      redis: config.worker.redis,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PlatformsModule,
    StreamersModule,
    StreamsModule,
    ViewersModule,
    InteractionsModule,
    MarketplaceModule,
    NotificationsModule,
    WebhooksModule,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  async onModuleInit() {
    try {
      // Test Redis connection
      const Bull = require('bull');
      const testQueue = new Bull('connection-test', {
        redis: config.worker.redis,
      });

      await testQueue.isReady();
      this.logger.log('Redis connection established successfully');
      await testQueue.close();
    } catch (error) {
      this.logger.warn('Redis connection failed. Queue processing may be limited.');
      this.logger.warn(`Error: ${(error as any).message}`);
      this.logger.log('Service will continue with limited functionality.');
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}