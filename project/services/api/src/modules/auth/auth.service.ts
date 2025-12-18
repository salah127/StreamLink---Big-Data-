import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { config } from '@streamlink/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role, User } from '../../prisma-client';

interface GoogleOAuthProfile {
  id: string;
  email?: string;
  displayName?: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private sanitizeUser(user: User & { passwordHash?: string | null }) {
    if (!user) {
      throw new BadRequestException('Invalid user record');
    }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  void _passwordHash;

    const normalizedEmail =
      typeof safeUser.email === 'string' ? safeUser.email.trim() : safeUser.email ?? '';
    const normalizedUsername =
      typeof safeUser.username === 'string' ? safeUser.username.trim() : safeUser.username ?? null;
    const normalizedDisplayName =
      typeof safeUser.displayName === 'string'
        ? safeUser.displayName.trim()
        : safeUser.displayName ?? null;

    if (!normalizedEmail) {
      this.logger.warn(`sanitizeUser invoked for user ${safeUser.id ?? 'unknown'} without email value.`);
    }

    return {
      ...safeUser,
      email: normalizedEmail,
      username: normalizedUsername,
      displayName: normalizedDisplayName,
    } as User;
  }

  async validateUser(loginId: string, password: string): Promise<User | null> {
    const trimmedLogin = loginId.trim();
    const normalizedLogin = trimmedLogin.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedLogin },
          { email: normalizedLogin },
          { username: normalizedLogin },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async login(user: User) {
    const sanitizedUser = this.sanitizeUser(user);
    const payload = { email: sanitizedUser.email, sub: sanitizedUser.id, role: sanitizedUser.role };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: config.auth.jwtExpiration,
    });

    // Generate refresh token (long-lived)
    const refreshToken = await this.generateRefreshToken(sanitizedUser.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60, // 15 minutes in seconds
      user: {
        id: sanitizedUser.id,
        email: sanitizedUser.email,
        username: sanitizedUser.username ?? undefined,
        displayName: sanitizedUser.displayName ?? undefined,
        role: sanitizedUser.role,
        avatarUrl: sanitizedUser.avatarUrl,
      },
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async refreshTokens(refreshToken: string) {
    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    // Validate token exists and is not revoked
    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke the old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Manually fetch the user
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.login(this.sanitizeUser(user));
  }

  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async register(
    email: string,
    password: string,
    displayName?: string,
    role: Role = Role.VIEWER,
    username?: string,
  ) {
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();
    const trimmedUsername = username?.trim();
    const normalizedUsername = trimmedUsername?.toLowerCase();
    const sanitizedDisplayName = displayName?.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
    email: normalizedEmail,
    username: normalizedUsername,
        passwordHash: hashedPassword,
    displayName: sanitizedDisplayName,
        role,
        // Create profile based on role
        ...(role === Role.STREAMER || role === Role.BOTH
          ? {
              streamerProfile: {
                create: {
                  isPublic: true,
                },
              },
            }
          : {}),
        ...(role === Role.VIEWER || role === Role.BOTH
          ? {
              viewerProfile: {
                create: {
                  preferences: {
                    notifications: true,
                    theme: 'dark',
                  },
                },
              },
            }
          : {}),
      },
    });

    this.logger.log(`New user registered: ${email} with role ${role}`);
    return this.login(this.sanitizeUser(user));
  }

  async googleLogin(profile: GoogleOAuthProfile) {
    const normalizedEmail = profile.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Google account is missing an email address');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const generatedUsername = normalizedEmail.split('@')[0]?.toLowerCase().trim();
      const sanitizedDisplayName = profile.displayName?.trim();
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          username: generatedUsername,
          displayName: sanitizedDisplayName,
          avatarUrl: profile.picture,
          role: 'VIEWER',
          viewerProfile: {
            create: {
              preferences: {
                notifications: true,
                theme: 'dark',
              },
            },
          },
        },
      });
    }

    // Create or update OAuth account
    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: profile.id,
        },
      },
      update: {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerUserId: profile.id,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    return this.login(this.sanitizeUser(user));
  }

  async recordSocialMetric(event: {
    provider: string;
    action: 'tap' | 'success' | 'error' | 'cancel';
    context?: string;
    metadata?: Record<string, unknown>;
  }) {
    const provider = event.provider?.toLowerCase().trim() || 'unknown';
    const action = event.action?.toLowerCase().trim() || 'tap';
    const context = event.context?.trim();

    try {
      await this.prisma.socialAuthMetric.create({
        data: {
          provider,
          action,
          context,
          metadata: event.metadata ? event.metadata : undefined,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record social auth metric for provider ${provider}`, error as Error);
    }
  }
}