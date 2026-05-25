import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../config/config.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwtSecret,
    });
  }

  async validate(payload: { sub: string; username: string; isSuper: boolean }) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            adminRole: {
              include: {
                rolePermissions: {
                  include: { adminPermission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) return null;

    const permissions: string[] = [];
    const roles: string[] = [];

    for (const ur of user.userRoles) {
      if (ur.adminRole.isActive) {
        roles.push(ur.adminRole.code);
        for (const rp of ur.adminRole.rolePermissions) {
          if (rp.adminPermission.isActive) {
            permissions.push(rp.adminPermission.code);
          }
        }
      }
    }

    return {
      id: payload.sub,
      username: payload.username,
      isSuper: payload.isSuper,
      roles,
      permissions,
    };
  }
}
