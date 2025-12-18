import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { config } from '@streamlink/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleMobileAuthGuard } from './guards/google-mobile.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: config.auth.jwtSecret,
      signOptions: { expiresIn: config.auth.jwtExpiration },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleMobileAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}