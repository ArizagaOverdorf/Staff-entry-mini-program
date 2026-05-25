import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwtSecret,
    });
  }

  async validate(payload: { sub: string; staffId: string }) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: payload.sub },
      select: { id: true, staffId: true, deletedAt: true },
    });
    if (!account || account.deletedAt) return null;
    return { id: account.id, staffId: account.staffId };
  }
}
