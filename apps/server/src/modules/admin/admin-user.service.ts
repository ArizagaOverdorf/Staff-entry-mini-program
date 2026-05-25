import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { hashPassword } from '../../utils/crypto.util';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async list(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, pageSize = 20 } = pagination;
    const [items, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where: { deletedAt: null },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          isActive: true,
          isSuper: true,
          createdAt: true,
          userRoles: {
            include: { adminRole: { select: { id: true, code: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminUser.count({ where: { deletedAt: null } }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async detail(id: string) {
    const user = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: { adminRole: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Admin user not found');
    return user;
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const { roleIds, ...data } = dto;
    return this.prisma.adminUser.create({
      data: {
        username: data.username,
        passwordHash: hashPassword(data.password),
        realName: data.realName,
        phone: data.phone,
        userRoles: roleIds?.length
          ? { createMany: { data: roleIds.map((rid) => ({ adminRoleId: rid })) } }
          : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    await this.prisma.adminUser.findFirstOrThrow({ where: { id, deletedAt: null } });

    const { roleIds, ...data } = dto;

    if (roleIds) {
      await this.prisma.adminUserRole.deleteMany({ where: { adminUserId: id } });
      await this.prisma.adminUserRole.createMany({
        data: roleIds.map((rid) => ({ adminUserId: id, adminRoleId: rid })),
      });
    }

    return this.prisma.adminUser.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.prisma.adminUser.findFirstOrThrow({ where: { id, deletedAt: null } });
    return this.prisma.adminUser.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
