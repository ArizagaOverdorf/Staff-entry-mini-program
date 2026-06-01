import { Controller, Get, Post, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdminRoleService } from './admin-role.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @RequirePermissions('role.manage')
  @Post('roles')
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentAdmin() admin: { id: string; isSuper: boolean; permissions: string[] },
  ) {
    if (!admin.isSuper) {
      throw new ForbiddenException('仅超级管理员可创建角色');
    }
    return this.adminRoleService.create(dto, admin.id);
  }

  @RequirePermissions('role.manage')
  @Get('roles')
  async list() {
    return this.adminRoleService.list();
  }

  @RequirePermissions('role.manage')
  @Get('roles/:id')
  async detail(@Param('id') id: string) {
    return this.adminRoleService.detail(id);
  }

  @RequirePermissions('role.manage')
  @Get('roles/:id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    return this.adminRoleService.getRolePermissions(id);
  }

  @RequirePermissions('role.manage')
  @Put('roles/:id/permissions')
  async assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.adminRoleService.assignPermissions(id, dto.permissionIds);
  }

  @RequirePermissions('role.manage')
  @Get('permissions')
  async listAllPermissions() {
    return this.adminRoleService.listAllPermissions();
  }

  @RequirePermissions('role.manage')
  @Get('permissions/tree')
  async getPermissionTree() {
    return this.adminRoleService.getPermissionTree();
  }
}
