import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.adminRole.findMany({
      include: { rolePermissions: { include: { adminPermission: true } } },
    });
  }

  async detail(id: string) {
    return this.prisma.adminRole.findUniqueOrThrow({
      where: { id },
      include: { rolePermissions: { include: { adminPermission: true } } },
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.adminRolePermission.deleteMany({ where: { adminRoleId: roleId } });
    await this.prisma.adminRolePermission.createMany({
      data: permissionIds.map((pid) => ({ adminRoleId: roleId, adminPermissionId: pid })),
    });
  }
}
