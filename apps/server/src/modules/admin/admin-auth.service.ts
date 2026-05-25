import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyPassword } from '../../utils/crypto.util';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { username: dto.username },
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

    if (!user || !user.isActive || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles: string[] = [];
    const permissions: string[] = [];

    for (const ur of user.userRoles) {
      if (ur.adminRole.isActive) {
        roles.push(ur.adminRole.code);
        for (const rp of ur.adminRole.rolePermissions) {
          if (rp.adminPermission.isActive && !permissions.includes(rp.adminPermission.code)) {
            permissions.push(rp.adminPermission.code);
          }
        }
      }
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      isSuper: user.isSuper,
    });

    return {
      accessToken: token,
      adminUser: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        isSuper: user.isSuper,
        roles,
        permissions,
      },
    };
  }

  async getMe(adminUserId: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
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

    if (!user) throw new UnauthorizedException('User not found');

    const roles: string[] = [];
    const permissions: string[] = [];

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
      id: user.id,
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      isSuper: user.isSuper,
      isActive: user.isActive,
      roles,
      permissions,
      createdAt: user.createdAt,
    };
  }
}
