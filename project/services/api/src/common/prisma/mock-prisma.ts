// Temporary mock Prisma client for development without database
// This allows TypeScript compilation while network issues are resolved

export enum Role {
  VIEWER = 'VIEWER',
  STREAMER = 'STREAMER',
  ADMIN = 'ADMIN',
  BOTH = 'BOTH'
}

export enum Platform {
  TWITCH = 'TWITCH',
  YOUTUBE = 'YOUTUBE',
  KICK = 'KICK',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  X = 'X'
}

export enum ContentType {
  STREAM = 'STREAM',
  VIDEO = 'VIDEO',
  POST = 'POST',
  CLIP = 'CLIP',
  LIVE = 'LIVE'
}

export enum MiniGameType {
  TRIVIA = 'TRIVIA',
  POLL = 'POLL',
  PREDICTION = 'PREDICTION',
  WORD_CLOUD = 'WORD_CLOUD'
}

export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash?: string;
  role: Role;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  streamerProfile?: { bio?: string | null; isPublic?: boolean | null } | null;
  viewerProfile?: Record<string, unknown> | null;
  linkedPlatformAccounts?: Array<{ platform: string; handle?: string; linkedAt?: Date | string }>;
  liveStatuses?: Array<{ platform: string; isLive?: boolean | null; title?: string | null; startedAt?: Date | null }>;
  statsSnapshots?: Array<{ platform: string; followers: number; views: number; likes: number }>;
}

export interface Reward {
  id: string;
  streamerId: string;
  title?: string | null;
  costPoints: number;
  isActive?: boolean | null;
}

export interface PointsTransaction {
  id: string;
  viewerId: string;
  streamerId: string;
  delta: number;
  type: string;
  createdAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
}

export interface Poll {
  id: string;
  streamerId: string;
  question?: string | null;
  status?: 'OPEN' | 'CLOSED' | null;
  endsAt?: Date | string | null;
  options: Array<{ id: string }>;
}

export interface PollOption {
  id: string;
  label?: string;
  votes?: number;
}

type MockArgs = Record<string, unknown>;

export class PrismaClient {
  // Helper method to create mock CRUD operations for any model
  private createMockModel<T = Record<string, unknown>>() {
    return {
      findUnique: (_args?: MockArgs): Promise<T | null> => {
        void _args;
        return Promise.resolve(null);
      },
      findFirst: (_args?: MockArgs): Promise<T | null> => {
        void _args;
        return Promise.resolve(null);
      },
      findMany: (_args?: MockArgs): Promise<T[]> => {
        void _args;
        return Promise.resolve([]);
      },
      create: (_args?: MockArgs): Promise<T> => {
        void _args;
        return Promise.resolve({} as T);
      },
      update: (_args?: MockArgs): Promise<T> => {
        void _args;
        return Promise.resolve({} as T);
      },
      updateMany: (_args?: MockArgs): Promise<{ count: number }> => {
        void _args;
        return Promise.resolve({ count: 0 });
      },
      delete: (_args?: MockArgs): Promise<T> => {
        void _args;
        return Promise.resolve({} as T);
      },
      deleteMany: (_args?: MockArgs): Promise<{ count: number }> => {
        void _args;
        return Promise.resolve({ count: 0 });
      },
      upsert: (_args?: MockArgs): Promise<T> => {
        void _args;
        return Promise.resolve({} as T);
      },
      count: (_args?: MockArgs): Promise<number> => {
        void _args;
        return Promise.resolve(0);
      },
      aggregate: (_args?: MockArgs): Promise<{ [key: string]: unknown }> => {
        void _args;
        return Promise.resolve({});
      },
    };
  }

  user = this.createMockModel<User>();
  follow = this.createMockModel();
  linkedPlatformAccount = this.createMockModel();
  contentItem = this.createMockModel();
  statsSnapshot = this.createMockModel();
  liveStatus = this.createMockModel();
  reward = this.createMockModel<Reward>();
  pointsTransaction = this.createMockModel<PointsTransaction>();
  refreshToken = this.createMockModel<RefreshToken>();
  redemption = this.createMockModel();
  oAuthAccount = this.createMockModel();
  socialAuthMetric = this.createMockModel();
  poll = this.createMockModel<Poll>();
  pollOption = this.createMockModel<PollOption>();
  pollVote = this.createMockModel();
  miniGame = this.createMockModel();
  gameParticipation = this.createMockModel();
  product = this.createMockModel();
  order = this.createMockModel();
  notificationSubscription = this.createMockModel();

  constructor() {
    console.warn('Using mock Prisma client - database operations will not work');
  }

  async $connect() {
    console.warn('Mock Prisma client - $connect called');
  }

  async $disconnect() {
    console.warn('Mock Prisma client - $disconnect called');
  }

  async $transaction<T>(callback: (client: this) => Promise<T>): Promise<T> {
    return callback(this);
  }
}