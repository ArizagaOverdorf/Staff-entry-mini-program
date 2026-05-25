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

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { select: { adminPermissionId: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return { permissionIds: role.rolePermissions.map((rp) => rp.adminPermissionId) };
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

  async getPermissionTree(): Promise<PermNode[]> {
    const all = await this.prisma.adminPermission.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return buildPermissionTree(all);
  }
}

export interface PermNode {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  sortOrder: number;
  children?: PermNode[];
}

function buildPermissionTree(items: PermNode[]): PermNode[] {
  const map = new Map<string, PermNode>();
  const roots: PermNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of map.values()) {
    if (!node.children?.length) delete node.children;
  }

  return roots;
}
