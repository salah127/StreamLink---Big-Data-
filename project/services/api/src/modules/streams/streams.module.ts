import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';

import { KickHttpProvider } from './providers/kick-http.provider';
import { TwitchHttpProvider } from './providers/twitch-http.provider';
import { YoutubeHttpProvider } from './providers/youtube-http.provider';
import { StreamsController } from './streams.controller';
import { STREAM_PROVIDERS_TOKEN, StreamsService } from './streams.service';

const streamProviderClasses = [
  TwitchHttpProvider,
  YoutubeHttpProvider,
  KickHttpProvider,
];

@Module({
  imports: [PrismaModule],
  controllers: [StreamsController],
  providers: [
    StreamsService,
    ...streamProviderClasses,
    {
      provide: STREAM_PROVIDERS_TOKEN,
      useFactory: (
        twitch: TwitchHttpProvider,
        youtube: YoutubeHttpProvider,
        kick: KickHttpProvider,
      ) => [twitch, youtube, kick],
      inject: [TwitchHttpProvider, YoutubeHttpProvider, KickHttpProvider],
    },
  ],
  exports: [StreamsService],
})
export class StreamsModule { }
