import { Body, Controller, Get, Param, Post, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';
import { GoogleMobileAuthGuard } from './guards/google-mobile.guard';

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.displayName,
      registerDto.role,
      registerDto.username,
    );
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email or username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.loginId, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req) {
    await this.authService.revokeAllUserTokens(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google OAuth' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/mobile')
  @UseGuards(GoogleMobileAuthGuard)
  @ApiOperation({ summary: 'Begin Google OAuth flow for mobile clients' })
  async googleMobileAuth() {
    // Guard handles redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req, @Res() res: Response, @Query('state') state?: string) {
    const authResult = await this.authService.googleLogin(req.user);

    if (state) {
      try {
        const parsedState = JSON.parse(fromBase64Url(state));
        if (parsedState?.redirectUri) {
          const redirectUrl = new URL(parsedState.redirectUri);
          const allowedProtocols = new Set(['streamlink:', 'exp:', 'http:', 'https:']);
          if (!allowedProtocols.has(redirectUrl.protocol)) {
            throw new Error(`Unsupported redirect protocol: ${redirectUrl.protocol}`);
          }

          redirectUrl.searchParams.set('provider', 'google');
          redirectUrl.searchParams.set('token', authResult.access_token);
          redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(authResult.user)).toString('base64'));
          if (parsedState.analyticsId) {
            redirectUrl.searchParams.set('analyticsId', String(parsedState.analyticsId));
          }
          return res.redirect(redirectUrl.toString());
        }
      } catch (error) {
        console.warn('[AuthController] Failed to parse OAuth state payload', error);
      }
    }

    return res.json(authResult);
  }

  @Public()
  @Get(':provider/mobile')
  @ApiOperation({ summary: 'Fallback handler for unsupported providers on mobile' })
  async unsupportedProviderMobile(
    @Param('provider') provider: string,
    @Query('redirectUri') redirectUri: string | undefined,
    @Res() res: Response,
  ) {
    const normalizedProvider = provider?.toLowerCase?.() ?? 'unknown';
    await this.authService.recordSocialMetric({
      provider: normalizedProvider,
      action: 'error',
      context: 'mobile',
      metadata: { reason: 'provider_not_configured' },
    });

    if (redirectUri) {
      try {
        const redirectUrl = new URL(redirectUri);
        const allowedProtocols = new Set(['streamlink:', 'exp:', 'http:', 'https:']);
        if (allowedProtocols.has(redirectUrl.protocol)) {
          redirectUrl.searchParams.set('provider', normalizedProvider);
          redirectUrl.searchParams.set(
            'error',
            `${normalizedProvider.charAt(0).toUpperCase()}${normalizedProvider.slice(1)} authentication is not configured yet.`,
          );
          return res.redirect(redirectUrl.toString());
        }
      } catch (error) {
        console.warn('[AuthController] Invalid redirect Uri for unsupported provider', error);
      }
    }

    return res.status(400).json({ error: `Provider ${normalizedProvider} is not configured.` });
  }

  @Public()
  @Post('social/metrics')
  @ApiOperation({ summary: 'Record metrics for social auth interactions' })
  async recordSocialMetric(
    @Body()
    body: {
      provider: string;
      action: 'tap' | 'success' | 'error' | 'cancel';
      context?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.authService.recordSocialMetric(body);
    return { ok: true };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  getProfile(@Req() req) {
    return req.user;
  }
}