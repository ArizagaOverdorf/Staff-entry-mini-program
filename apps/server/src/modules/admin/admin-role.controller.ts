import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AdminRoleService } from './admin-role.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

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
