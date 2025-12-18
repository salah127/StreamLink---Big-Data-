import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Platform } from '../../prisma-client';
import { StreamsService, type GetTrendingStreamsOptions } from './streams.service';

@ApiTags('streams')
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) { }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending live streams across platforms' })
  @ApiResponse({ status: 200, description: 'Trending streams retrieved successfully' })
  getTrendingStreams(@Query() query: Record<string, string | string[] | undefined>) {
    const options: GetTrendingStreamsOptions = {
      limit: this.parseLimit(query.limit),
      cursor: this.parseCursor(query.cursor),
      category: this.parseCategory(query.category),
      platforms: this.parsePlatforms(query.platforms),
    };

    return this.streamsService.getTrendingStreams(options);
  }

  @Public()
  @Get('rankings')
  @ApiOperation({ summary: 'Get top 300 ranked active streamers' })
  @ApiResponse({ status: 200, description: 'Ranked streamers retrieved successfully' })
  getRankings(@Query('limit') limit?: string) {
    const parsedLimit = this.parseLimit(limit) || 300;
    return this.streamsService.getRankedStreamers(parsedLimit);
  }

  private parseLimit(limit?: string | string[]): number | undefined {
    if (!limit) {
      return undefined;
    }

    const raw = Array.isArray(limit) ? limit[0] : limit;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseCursor(cursor?: string | string[]): string | undefined {
    if (!cursor) {
      return undefined;
    }
    return Array.isArray(cursor) ? cursor[0] : cursor;
  }

  private parseCategory(category?: string | string[]): string | undefined {
    if (!category) {
      return undefined;
    }
    const raw = Array.isArray(category) ? category[0] : category;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private parsePlatforms(platforms?: string | string[]): Platform[] | undefined {
    if (!platforms) {
      return undefined;
    }

    const values = Array.isArray(platforms)
      ? platforms
      : platforms.split(',');

    const normalized = values
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0);

    const validPlatforms = new Set(Object.values(Platform));
    const parsed = normalized
      .filter((value) => validPlatforms.has(value as Platform))
      .map((value) => value as Platform);

    return parsed.length > 0 ? parsed : undefined;
  }
}
