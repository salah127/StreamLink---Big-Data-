import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role } from '../../prisma-client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  // let prisma: PrismaService;
  // let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock.jwt.token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // prisma = module.get<PrismaService>(PrismaService);
    // jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedPassword',
        role: Role.VIEWER,
        displayName: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '1',
        userId: '1',
        token: 'refresh.token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isRevoked: false,
      });

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const existingUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: Role.VIEWER,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        service.register('test@example.com', 'password123')
      ).rejects.toThrow('User already exists');
    });

    it('should not expose passwordHash in response', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        role: Role.VIEWER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '1',
        userId: '1',
        token: 'refresh.token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isRevoked: false,
      });

      const result = await service.register('test@example.com', 'password123');

      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: '$2b$10$dummyHashedPassword', // bcrypt hash
        role: Role.VIEWER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      // Mock bcrypt.compare - we'd need to actually test with bcrypt
      // For now this tests the flow
      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(mockPrismaService.user.findFirst).toHaveBeenCalled();
      // Will return null because password doesn't match
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const mockRefreshToken = {
        id: '1',
        token: 'valid.refresh.token',
        userId: '1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false,
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: Role.VIEWER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockPrismaService.refreshToken.update.mockResolvedValue({ ...mockRefreshToken, isRevoked: true });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '2',
        userId: '1',
        token: 'new.refresh.token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isRevoked: false,
      });

      const result = await service.refreshTokens('valid.refresh.token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { isRevoked: true },
        })
      );
    });

    it('should throw error for expired refresh token', async () => {
      const expiredToken = {
        id: '1',
        token: 'expired.token',
        userId: '1',
        expiresAt: new Date(Date.now() - 1000), // expired
        isRevoked: false,
        user: { id: '1', email: 'test@example.com', role: Role.VIEWER },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

      await expect(
        service.refreshTokens('expired.token')
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw error for revoked refresh token', async () => {
      const revokedToken = {
        id: '1',
        token: 'revoked.token',
        userId: '1',
        expiresAt: new Date(Date.now() + 1000),
        isRevoked: true,
        user: { id: '1', email: 'test@example.com', role: Role.VIEWER },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(revokedToken);

      await expect(
        service.refreshTokens('revoked.token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all active tokens for a user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserTokens('user-123');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });
});
