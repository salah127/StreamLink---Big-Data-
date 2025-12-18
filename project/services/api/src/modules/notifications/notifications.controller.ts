import { Controller, Post, Delete, Get, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to notifications' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  subscribeNotifications(@Req() req, @Body() body: { token: string; platform: 'EXPO' | 'EMAIL' }) {
    return this.notificationsService.subscribeNotifications(req.user.id, body.token, body.platform);
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  unsubscribeNotifications(@Req() req, @Body() body: { token: string; platform: 'EXPO' | 'EMAIL' }) {
    return this.notificationsService.unsubscribeNotifications(req.user.id, body.token, body.platform);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get notification subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  getSubscriptions(@Req() req) {
    return this.notificationsService.getSubscriptions(req.user.id);
  }
}