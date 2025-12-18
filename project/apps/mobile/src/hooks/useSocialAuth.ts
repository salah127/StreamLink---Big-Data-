import { Buffer } from 'buffer';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { nanoid } from 'nanoid/non-secure';
import { useCallback, useMemo, useState } from 'react';
import { SOCIAL_PROVIDERS, SocialProviderConfig, SocialProviderKey } from '../constants/socialProviders';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';

interface UseSocialAuthOptions {
  context: 'login' | 'register';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface SocialAuthResult {
  ok: boolean;
  provider: SocialProviderKey;
  cancelled?: boolean;
}

const decodeUserPayload = (value: string) => {
  const normalized = value.replace(/ /g, '+');
  const buffer = Buffer.from(normalized, 'base64');
  return JSON.parse(buffer.toString('utf8'));
};

export const useSocialAuth = ({ context, onSuccess, onError }: UseSocialAuthOptions) => {
  const login = useAuthStore((state) => state.login);
  const [processingProvider, setProcessingProvider] = useState<SocialProviderKey | null>(null);

  const providers = useMemo<SocialProviderConfig[]>(() => SOCIAL_PROVIDERS, []);

  const authenticate = useCallback(
    async (provider: SocialProviderKey): Promise<SocialAuthResult | undefined> => {
      const analyticsId = nanoid();
      const metadata = { analyticsId } as Record<string, unknown>;

      await api.trackSocialAuthMetric({ provider, action: 'tap', context, metadata });
      setProcessingProvider(provider);

      try {
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'streamlink',
          path: 'oauth-callback',
        });

        const authUrl = api.getSocialAuthUrl(provider, redirectUri, analyticsId);

        const result = await AuthSession.startAsync({
          authUrl,
          returnUrl: redirectUri,
        });

        if (result.type === 'success' && result.url) {
          const parsed = Linking.parse(result.url);
          const params = parsed.queryParams ?? {};
          const tokenParam = typeof params.token === 'string' ? params.token : undefined;
          const userParam = typeof params.user === 'string' ? params.user : undefined;
          const providerParam = (typeof params.provider === 'string'
            ? (params.provider.toLowerCase() as SocialProviderKey)
            : provider) as SocialProviderKey;

          if (tokenParam && userParam) {
            const user = decodeUserPayload(userParam);
            await login(user, tokenParam);
            await api.trackSocialAuthMetric({ provider: providerParam, action: 'success', context, metadata });
            onSuccess?.();
            return { ok: true, provider: providerParam };
          }

          const errorMessage = typeof params.error === 'string' ? params.error : 'Missing authentication details.';
          throw new Error(errorMessage);
        }

        if (result.type === 'dismiss' || result.type === 'cancel') {
          await api.trackSocialAuthMetric({ provider, action: 'cancel', context, metadata });
          return { ok: false, provider, cancelled: true };
        }

        throw new Error('Authentication failed. Please try again.');
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('Social authentication failed');
        await api.trackSocialAuthMetric({
          provider,
          action: 'error',
          context,
          metadata: { ...metadata, message: normalizedError.message },
        });
        onError?.(normalizedError);
        throw normalizedError;
      } finally {
        setProcessingProvider(null);
      }
    },
    [context, login, onError, onSuccess],
  );

  return {
    providers,
    authenticate,
    processingProvider,
  };
};