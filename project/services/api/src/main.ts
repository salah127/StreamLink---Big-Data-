import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from '@streamlink/config';
import { AppModule } from './app.module';

// Disable SSL verification for development to bypass self-signed certificate issues
// This is needed when running behind corporate proxies or with SSL inspection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors(config.api.cors);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('StreamLink API')
    .setDescription('Universal companion app for streamers and viewers')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('platforms', 'Platform integrations')
    .addTag('streamers', 'Streamer features')
    .addTag('viewers', 'Viewer features')
    .addTag('interactions', 'Real-time interactions')
    .addTag('marketplace', 'Products and orders')
    .addTag('notifications', 'Push notifications')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(config.api.port, config.api.host);
  
  logger.log(`[launch] API server running on http://${config.api.host}:${config.api.port}`);
  logger.log(`[docs] Swagger docs available at http://${config.api.host}:${config.api.port}/api/docs`);
}

bootstrap();