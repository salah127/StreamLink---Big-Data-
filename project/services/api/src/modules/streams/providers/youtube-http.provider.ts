import { Injectable, Logger } from '@nestjs/common';
import { request } from 'undici';
import { Platform } from '../../../prisma-client';
import { StreamSummary } from '../types';
import { ProviderFetchOptions, StreamProvider } from './stream-provider.interface';

@Injectable()
export class YoutubeHttpProvider implements StreamProvider {
    readonly platform = Platform.YOUTUBE;
    private readonly logger = new Logger(YoutubeHttpProvider.name);

    async fetchTrendingStreams(options: ProviderFetchOptions): Promise<StreamSummary[]> {
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey || apiKey.includes('your-')) {
            this.logger.error('YouTube API Key missing or invalid.');
            return [];
        }

        try {
            const limit = Math.min(options.limit, 50);
            const videos = await this.getMostPopularVideos(apiKey, limit);

            this.logger.log(`Fetched ${videos.length} videos from YouTube API`);

            return videos.map((video: any) => ({
                id: video.id,
                streamerId: video.snippet.channelId,
                platform: Platform.YOUTUBE,
                title: video.snippet.title,
                // For mostPopular chart, 'statistics.viewCount' is total views, not concurrent live viewers usually.
                // However, if the video is LIVE content, it might have liveStreamingDetails.
                // The prompt asked for "Top 100 'mostPopular'".
                // If it's pure vods, use viewCount. If live, use concurrent.
                // We'll prioritize concurrent if present, otherwise view count.
                viewerCount: parseInt(video.liveStreamingDetails?.concurrentViewers || video.statistics?.viewCount || '0', 10),
                startedAt: new Date(video.liveStreamingDetails?.actualStartTime || video.snippet.publishedAt),
                thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
                url: `https://youtube.com/watch?v=${video.id}`,
                creator: {
                    id: video.snippet.channelId,
                    username: video.snippet.channelTitle,
                    displayName: video.snippet.channelTitle,
                },
                category: null,
            }));
        } catch (error: any) {
            this.logger.error('Failed to fetch YouTube streams', error.message || error);
            return [];
        }
    }

    private async getMostPopularVideos(apiKey: string, limit: number, regionCode = 'FR'): Promise<any[]> {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('key', apiKey);
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('eventType', 'live');
        url.searchParams.set('type', 'video');
        url.searchParams.set('order', 'viewCount');
        url.searchParams.set('maxResults', limit.toString());
        url.searchParams.set('regionCode', regionCode);

        const { body } = await request(url);
        const data = await body.json() as any;

        if (data.error) {
            throw new Error(`YouTube error: ${JSON.stringify(data.error)}`);
        }

        const videoIds = data.items?.map((item: any) => item.id.videoId).join(',') || '';
        
        if (!videoIds) {
            return [];
        }

        // Fetch full video details including live streaming info
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('key', apiKey);
        detailsUrl.searchParams.set('part', 'snippet,statistics,liveStreamingDetails');
        detailsUrl.searchParams.set('id', videoIds);

        const { body: detailsBody } = await request(detailsUrl);
        const detailsData = await detailsBody.json() as any;

        if (detailsData.error) {
            throw new Error(`YouTube error: ${JSON.stringify(detailsData.error)}`);
        }

        return detailsData.items ?? [];
    }
}