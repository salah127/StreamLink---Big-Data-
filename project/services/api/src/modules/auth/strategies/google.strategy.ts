import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { config } from '@streamlink/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientId = config.oauth.google.clientId;
    const clientSecret = config.oauth.google.clientSecret;
    
    // Provide default values if OAuth credentials are not configured
    super({
      clientID: clientId || 'placeholder-client-id',
      clientSecret: clientSecret || 'placeholder-client-secret',
      callbackURL: '/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
    
    // Log warning if using placeholder credentials
    if (!clientId || !clientSecret || clientId.includes('placeholder')) {
      console.warn('Google OAuth not properly configured - using placeholder credentials for development');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const primaryEmail = profile.emails?.[0]?.value ?? '';
    const displayName = profile.displayName?.trim() ?? [profile.name?.givenName, profile.name?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const picture = profile.photos?.[0]?.value;

    const user = {
      id: profile.id,
      email: primaryEmail,
      displayName,
      picture,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}