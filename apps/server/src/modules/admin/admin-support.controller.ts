import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminSupportService } from './admin-support.service';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@RequirePermissions('staff.view')
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly adminSupportService: AdminSupportService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('messageType') messageType?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.adminSupportService.list({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
      messageType,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    });
  }

  @Get(':messageId')
  async detail(@Param('messageId') messageId: string) {
    return this.adminSupportService.detail(messageId);
  }

  @Post(':messageId/reply')
  async reply(
    @Param('messageId') messageId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() body: { content: string },
  ) {
    return this.adminSupportService.reply(messageId, adminUserId, body.content);
  }
}
