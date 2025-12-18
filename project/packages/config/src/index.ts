export const config = {
  app: {
    name: 'StreamLink',
    version: '1.0.0',
    description: 'Universal companion app for streamers and viewers'
  },
  api: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },
  worker: {
    port: parseInt(process.env.WORKER_PORT || '3002'),
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '20'),
      enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      retryStrategy: (times: number) => {
        if (times > 50) {
          // Stop retrying after 50 attempts
          console.error('Redis connection failed after 50 retries. Service will continue without queue processing.');
          return null;
        }
        // Exponential backoff with max 5 seconds
        return Math.min(times * 100, 5000);
      }
    }
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://streamlink:password@localhost:5432/streamlink'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '15m',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-32-byte-key-change-this'
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || ''
    }
  },
  platforms: {
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      scopes: ['user:read:email', 'user:read:subscriptions', 'channel:read:subscriptions']
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      scopes: ['https://www.googleapis.com/auth/youtube.readonly']
    },
    kick: {
      apiKey: process.env.KICK_API_KEY || ''
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      scopes: ['instagram_basic', 'instagram_content_publish']
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      scopes: ['user.info.basic', 'video.list']
    },
    x: {
      apiKey: process.env.X_API_KEY || '',
      apiSecret: process.env.X_API_SECRET || '',
      scopes: ['tweet.read', 'users.read']
    }
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'postmark',
    postmark: {
      apiKey: process.env.POSTMARK_API_KEY || ''
    },
    from: process.env.FROM_EMAIL || 'noreply@streamlink.app'
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000
  }
};

export type Config = typeof config;