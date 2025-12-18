import { Injectable, Logger } from '@nestjs/common';
import { request } from 'undici';
import { Platform } from '../../../prisma-client';
import { StreamSummary } from '../types';
import { ProviderFetchOptions, StreamProvider } from './stream-provider.interface';

@Injectable()
export class KickHttpProvider implements StreamProvider {
    readonly platform = Platform.KICK;
    private readonly logger = new Logger(KickHttpProvider.name);

    private accessToken: string | null = null;

    async fetchTrendingStreams(options: ProviderFetchOptions): Promise<StreamSummary[]> {
        const clientId = process.env.KICK_CLIENT_ID;
        const clientSecret = process.env.KICK_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            this.logger.error('Kick Credentials missing.');
            return [];
        }

        try {
            const token = await this.getAppToken(clientId, clientSecret);
            const limit = Math.min(options.limit, 100);

            // Using api.kick.com/public/v1 as per user plan
            const { statusCode, body } = await request(`https://api.kick.com/public/v1/livestreams?limit=${limit}&sort=viewer_count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (statusCode !== 200) {
                // Try parsing error body for details
                const errBody = await body.text();
                throw new Error(`Kick API returned ${statusCode}: ${errBody}`);
            }

            const data = await body.json() as any;
            const streams = data.data ?? [];

            this.logger.log(`Fetched ${streams.length} streams from Kick API`);

            return streams.map((stream: any) => ({
                id: stream.channel_id?.toString() || stream.id?.toString(),
                streamerId: stream.broadcaster_user_id?.toString() || stream.user_id?.toString(),
                platform: Platform.KICK,
                title: stream.stream_title || stream.session_title || 'Untitled Stream',
                viewerCount: stream.viewer_count || stream.viewers || 0,
                startedAt: new Date(stream.started_at || stream.created_at || Date.now()),
                thumbnail: stream.thumbnail?.url || stream.thumbnail,
                url: `https://kick.com/${stream.slug}`,
                creator: {
                    id: stream.broadcaster_user_id?.toString() || stream.user_id?.toString(),
                    username: stream.slug,
                    displayName: stream.slug,
                    avatarUrl: stream.user?.profile_pic,
                },
                category: stream.category?.name,
            }));
        } catch (error: any) {
            this.logger.error('Failed to fetch Kick streams', error.message || error);
            return [];
        }
    }

    private async getAppToken(clientId: string, clientSecret: string): Promise<string> {
        if (this.accessToken) return this.accessToken;

        const form = new URLSearchParams();
        form.set('grant_type', 'client_credentials');
        form.set('client_id', clientId);
        form.set('client_secret', clientSecret);

        const { body } = await request('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form.toString(),
        });

        const data = await body.json() as any;
        if (!data.access_token) {
            throw new Error(`Kick token error: ${JSON.stringify(data)}`);
        }

        this.accessToken = data.access_token;
        return data.access_token;
    }
}
