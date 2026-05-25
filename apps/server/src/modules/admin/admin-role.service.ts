import { Injectable, NotFoundException } from '@nestjs/common';
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
    const role = await this.prisma.adminRole.findUnique({
      where: { id },
      include: { rolePermissions: { include: { adminPermission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.adminRolePermission.deleteMany({ where: { adminRoleId: roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.adminRolePermission.createMany({
        data: permissionIds.map((pid) => ({ adminRoleId: roleId, adminPermissionId: pid })),
      });
    }
  }

  async listAllPermissions() {
    return this.prisma.adminPermission.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
