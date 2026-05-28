import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminStaffService } from './admin-staff.service';
import { AuditCredentialDto, AuditIntakeDto } from './dto/audit.dto';
import { SetManagementStatusDto } from './dto/set-management-status.dto';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@RequirePermissions('staff.view')
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly adminStaffService: AdminStaffService) {}

  @Get('stats')
  async dashboardStats() {
    return this.adminStaffService.getDashboardStats();
  }

  @Post('cleanup-draft')
  @RequirePermissions('staff.audit')
  async cleanupDraft() {
    return this.adminStaffService.cleanupDrafts();
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
    @Query('intakeStatus') intakeStatus?: string,
    @Query('listingStatus') listingStatus?: string,
    @Query('includeDraft') includeDraft?: string,
  ) {
    return this.adminStaffService.list({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      name,
      phone,
      intakeStatus,
      listingStatus,
      includeDraft: includeDraft === 'true',
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

  @Get(':staffId/audit-records')
  async auditRecords(@Param('staffId') staffId: string) {
    return this.adminStaffService.getAuditRecords(staffId);
  }

  @Post(':staffId/review/approve')
  @RequirePermissions('staff.audit')
  async approveIntake(
    @Param('staffId') staffId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() dto: AuditIntakeDto,
  ) {
    return this.adminStaffService.approveIntake(staffId, adminUserId, dto.remark);
  }

  @Post(':staffId/review/reject')
  @RequirePermissions('staff.audit')
  async rejectIntake(
    @Param('staffId') staffId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() dto: AuditIntakeDto,
  ) {
    return this.adminStaffService.rejectIntake(staffId, adminUserId, dto.remark);
  }

  @Post(':staffId/review/request-more-info')
  @RequirePermissions('staff.audit')
  async requestMoreInfo(
    @Param('staffId') staffId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() dto: AuditIntakeDto,
  ) {
    return this.adminStaffService.requestMoreInfo(staffId, adminUserId, dto.remark);
  }

  @Post(':staffId/credentials/:credentialId/review')
  @RequirePermissions('staff.audit')
  async reviewCredential(
    @Param('staffId') staffId: string,
    @Param('credentialId') credentialId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() dto: AuditCredentialDto,
  ) {
    return this.adminStaffService.reviewCredential(
      staffId,
      credentialId,
      adminUserId,
      dto.action,
      dto.remark,
    );
  }

  @Post(':staffId/management-status')
  @RequirePermissions('staff.audit')
  async setManagementStatus(
    @Param('staffId') staffId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() dto: SetManagementStatusDto,
  ) {
    return this.adminStaffService.setManagementStatus(
      staffId,
      adminUserId,
      dto.status,
      dto.reason,
    );
  }
}
