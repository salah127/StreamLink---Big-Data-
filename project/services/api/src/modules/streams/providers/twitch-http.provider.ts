import { Injectable, Logger } from '@nestjs/common';
import { request, Agent, setGlobalDispatcher } from 'undici';
import { Platform } from '../../../prisma-client';
import { StreamSummary } from '../types';
import { ProviderFetchOptions, StreamProvider } from './stream-provider.interface';

// Set global dispatcher to bypass SSL verification in development
// This is needed for corporate proxies with SSL inspection
setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));

@Injectable()
export class TwitchHttpProvider implements StreamProvider {
    readonly platform = Platform.TWITCH;
    private readonly logger = new Logger(TwitchHttpProvider.name);

    // Cache token
    private accessToken: string | null = null;

    async fetchTrendingStreams(options: ProviderFetchOptions): Promise<StreamSummary[]> {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            this.logger.error('Twitch Credentials missing.');
            return [];
        }

        try {
            const token = await this.getAppToken(clientId, clientSecret);
            const limit = Math.min(options.limit, 100);

            const { statusCode, body } = await request(`https://api.twitch.tv/helix/streams?first=${limit}`, {
                headers: {
                    'Client-Id': clientId,
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (statusCode !== 200) {
                throw new Error(`Twitch API returned ${statusCode}`);
            }

            const data = await body.json() as any;
            const streams = data.data ?? [];

            this.logger.log(`Fetched ${streams.length} streams from Twitch API`);

            return streams.map((stream: any) => ({
                id: stream.id,
                streamerId: stream.user_id,
                platform: Platform.TWITCH,
                title: stream.title,
                viewerCount: stream.viewer_count,
                startedAt: new Date(stream.started_at),
                thumbnail: stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180'),
                url: `https://twitch.tv/${stream.user_login}`,
                creator: {
                    id: stream.user_id,
                    username: stream.user_login,
                    displayName: stream.user_name,
                },
                category: stream.game_name,
            }));
        } catch (error: any) {
            this.logger.error('Failed to fetch Twitch streams', error.message || error);
            return [];
        }
    }

    private async getAppToken(clientId: string, clientSecret: string): Promise<string> {
        if (this.accessToken) return this.accessToken;

        const url = new URL('https://id.twitch.tv/oauth2/token');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('client_secret', clientSecret);
        url.searchParams.set('grant_type', 'client_credentials');

        const { body } = await request(url, { method: 'POST' });
        const data = await body.json() as any;

        if (!data.access_token) {
            throw new Error(`Twitch token error: ${JSON.stringify(data)}`);
        }

        // Simple caching 
        this.accessToken = data.access_token;
        return data.access_token;
    }
}
