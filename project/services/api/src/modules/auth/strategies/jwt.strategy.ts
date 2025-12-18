import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { config } from '@streamlink/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.jwtSecret,
    });
  }

  async validate(payload: { sub: string; email?: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        streamerProfile: true,
        viewerProfile: true,
      },
    });
    if (!user) {
      return null;
    }

    const { passwordHash: _passwordHash, ...safeUser } = user as typeof user & { passwordHash?: string | null };
    void _passwordHash;
    return safeUser;
  }
}