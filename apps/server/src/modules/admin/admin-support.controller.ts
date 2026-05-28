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

  // ---- Conversation inbox ----

  @Get('conversations')
  async listConversations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminSupportService.listConversations({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      keyword,
    });
  }

  @Get('conversations/:staffAccountId')
  async getConversation(
    @Param('staffAccountId') staffAccountId: string,
    @CurrentAdmin('id') adminUserId: string,
  ) {
    return this.adminSupportService.getConversation(staffAccountId, adminUserId);
  }

  @Post('conversations/:staffAccountId/reply')
  async replyToConversation(
    @Param('staffAccountId') staffAccountId: string,
    @CurrentAdmin('id') adminUserId: string,
    @Body() body: { content: string },
  ) {
    return this.adminSupportService.replyToConversation(
      staffAccountId,
      adminUserId,
      body.content,
    );
  }

  @Get('conversations/:staffAccountId/export')
  async exportConversation(
    @Param('staffAccountId') staffAccountId: string,
  ) {
    return this.adminSupportService.exportConversation(staffAccountId);
  }

  // ---- Legacy support endpoints (kept for backward compat) ----

  @Get(':messageId')
  async detail(@Param('messageId') messageId: string) {
    return this.adminSupportService.detail(messageId);
  }
}
