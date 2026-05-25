import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AdminRoleService } from './admin-role.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/roles')
export class AdminRoleController {
  constructor(private readonly adminRoleService: AdminRoleService) {}

  @Get()
  async list() {
    return this.adminRoleService.list();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.adminRoleService.detail(id);
  }

  @Post(':id/permissions')
  async assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.adminRoleService.assignPermissions(id, dto.permissionIds);
  }
}
