import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { AdminStaffService } from './admin-staff.service';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@RequirePermissions('staff.view')
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly adminStaffService: AdminStaffService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('intakeStatus') intakeStatus?: string,
    @Query('listingStatus') listingStatus?: string,
  ) {
    return this.adminStaffService.list({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      name,
      phone,
      intakeStatus,
      listingStatus,
    });
  }

  @Get(':staffId')
  async detail(@Param('staffId') staffId: string) {
    return this.adminStaffService.detail(staffId);
  }

  @Get(':staffId/credentials')
  async credentials(@Param('staffId') staffId: string) {
    return this.adminStaffService.credentials(staffId);
  }
}
