import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Platform } from '../../prisma-client';
import { PlatformsService } from './platforms.service';

@ApiTags('platforms')
@ApiBearerAuth()
@Controller('platforms')
export class PlatformsController {
  constructor(private platformsService: PlatformsService) {}

  @Get('linked')
  @ApiOperation({ summary: 'Get linked platform accounts' })
  @ApiResponse({ status: 200, description: 'Linked accounts retrieved successfully' })
  getLinkedAccounts(@Req() req) {
    return this.platformsService.getLinkedAccounts(req.user.id);
  }

  @Post('link')
  @ApiOperation({ summary: 'Link a platform account' })
  @ApiResponse({ status: 201, description: 'Platform account linked successfully' })
  linkPlatformAccount(@Req() req, @Body() body: {
    platform: Platform;
    platformUserId: string;
    handle: string;
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
  }) {
    return this.platformsService.linkPlatformAccount(req.user.id, body.platform, body);
  }

  @Delete('unlink/:platform')
  @ApiOperation({ summary: 'Unlink a platform account' })
  @ApiResponse({ status: 200, description: 'Platform account unlinked successfully' })
  unlinkPlatformAccount(@Req() req, @Param('platform') platform: Platform) {
    return this.platformsService.unlinkPlatformAccount(req.user.id, platform);
  }

  @Get('content/:streamerId')
  @ApiOperation({ summary: 'Get streamer content from platforms' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  getContentItems(
    @Param('streamerId') streamerId: string,
    @Query('platform') platform?: Platform,
    @Query('type') type?: 'VIDEO' | 'CLIP' | 'LIVE' | 'SHORT' | 'POST'
  ) {
    return this.platformsService.getContentItems(streamerId, platform, type);
  }

  @Get('live/:streamerId')
  @ApiOperation({ summary: 'Get live status for streamer' })
  @ApiResponse({ status: 200, description: 'Live status retrieved successfully' })
  getLiveStatus(@Param('streamerId') streamerId: string, @Query('platform') platform?: Platform) {
    return this.platformsService.getLiveStatus(streamerId, platform);
  }
}