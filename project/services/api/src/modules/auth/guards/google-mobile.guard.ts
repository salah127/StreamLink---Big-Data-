import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const toBase64Url = (value: string) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

@Injectable()
export class GoogleMobileAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const redirectUri = typeof request.query?.redirectUri === 'string' ? request.query.redirectUri : undefined;
    const analyticsId = typeof request.query?.analyticsId === 'string' ? request.query.analyticsId : undefined;

    const statePayload = JSON.stringify({
      redirectUri,
      analyticsId,
      platform: 'mobile',
      timestamp: Date.now(),
    });

    return {
      state: toBase64Url(statePayload),
      prompt: 'select_account',
      session: false,
    };
  }
}
