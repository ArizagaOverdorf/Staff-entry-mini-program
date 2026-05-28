import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessageService } from './message.service';

@UseGuards(JwtAuthGuard)
@Controller('app/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async list(
    @CurrentUser('id') accountId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.messageService.list(accountId, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('id') accountId: string) {
    return this.messageService.unreadCount(accountId);
  }

  @Get(':messageId')
  async detail(
    @CurrentUser('id') accountId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.detail(accountId, messageId);
  }

  @Post(':messageId/read')
  async markRead(
    @CurrentUser('id') accountId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messageService.markRead(accountId, messageId);
  }

  @Post('support')
  async createSupport(
    @CurrentUser('id') accountId: string,
    @Body() body: { title?: string; content?: string },
  ) {
    return this.messageService.createSupportMessage(accountId, body.title, body.content);
  }

  @Post('read')
  async markReadLegacy(
    @CurrentUser('id') accountId: string,
    @Body() body: { id?: string; all?: boolean },
  ) {
    if (body.all) {
      return this.messageService.markAllRead(accountId);
    }
    return this.messageService.markRead(accountId, body.id ?? '');
  }
}
