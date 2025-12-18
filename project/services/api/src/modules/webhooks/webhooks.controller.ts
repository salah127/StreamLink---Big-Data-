import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

type WebhookPayload = Record<string, unknown>;
type WebhookHeaders = Record<string, string | string[] | undefined>;

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {

  @Public()
  @Post('twitch')
  @ApiOperation({ summary: 'Twitch webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  twitchWebhook(@Body() body: WebhookPayload, @Headers() headers: WebhookHeaders) {
    // Handle Twitch webhooks (live status, follows, etc.)
    console.log('Twitch webhook received:', { body, headers });
    return { received: true };
  }

  @Public()
  @Post('youtube')
  @ApiOperation({ summary: 'YouTube webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  youtubeWebhook(@Body() body: WebhookPayload, @Headers() headers: WebhookHeaders) {
    // Handle YouTube webhooks
    console.log('YouTube webhook received:', { body, headers });
    return { received: true };
  }

  @Public()
  @Post('kick')
  @ApiOperation({ summary: 'Kick webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  kickWebhook(@Body() body: WebhookPayload, @Headers() headers: WebhookHeaders) {
    // Handle Kick webhooks
    console.log('Kick webhook received:', { body, headers });
    return { received: true };
  }
}