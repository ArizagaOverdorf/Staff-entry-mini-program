import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface MessageListParams {
  page: number;
  pageSize: number;
}

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async list(accountId: string, params: MessageListParams) {
    const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
    const pageSize =
      Number.isFinite(params.pageSize) && params.pageSize > 0
        ? Math.min(params.pageSize, 100)
        : 20;

    const where = { staffAccountId: accountId };
    const [total, list] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      list: list.map((message) => this.formatMessage(message)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async unreadCount(accountId: string) {
    const count = await this.prisma.message.count({
      where: {
        staffAccountId: accountId,
        isRead: false,
        senderType: { in: ['admin', 'system'] },
      },
    });

    return { count, unreadCount: count };
  }

  async detail(accountId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, staffAccountId: accountId },
    });
    if (!message) throw new NotFoundException('Message not found');

    return this.formatMessage(message);
  }

  async markRead(accountId: string, messageId: string) {
    if (!messageId) {
      throw new BadRequestException('messageId is required');
    }

    const message = await this.prisma.message.findFirst({
      where: { id: messageId, staffAccountId: accountId },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.message.update({
      where: { id: message.id },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Staff sends a support message into their conversation.
   * This is a conversation message, not a one-time form.
   */
  async createSupportMessage(accountId: string, title?: string, content?: string) {
    const normalizedTitle = title?.trim();
    const normalizedContent = content?.trim();

    if (!normalizedTitle) {
      throw new BadRequestException('咨询标题不能为空');
    }
    if (normalizedTitle.length > 100) {
      throw new BadRequestException('咨询标题不能超过100字');
    }
    if (!normalizedContent) {
      throw new BadRequestException('咨询内容不能为空');
    }
    if (normalizedContent.length > 1000) {
      throw new BadRequestException('咨询内容不能超过1000字');
    }

    const message = await this.prisma.message.create({
      data: {
        staffAccountId: accountId,
        title: normalizedTitle,
        content: normalizedContent,
        messageType: 'support_request',
        senderType: 'staff',
      },
    });

    return this.formatMessage(message);
  }

  /**
   * Staff sends a quick chat message in the conversation.
   * Used by the conversation page for follow-up messages.
   */
  async sendConversationMessage(accountId: string, content: string) {
    const normalizedContent = content?.trim();
    if (!normalizedContent) {
      throw new BadRequestException('消息内容不能为空');
    }
    if (normalizedContent.length > 1000) {
      throw new BadRequestException('消息内容不能超过1000字');
    }

    const message = await this.prisma.message.create({
      data: {
        staffAccountId: accountId,
        title: '员工消息',
        content: normalizedContent,
        messageType: 'support_request',
        senderType: 'staff',
      },
    });

    return this.formatMessage(message);
  }

  /**
   * Get support conversation messages for the staff side.
   * Returns chronological messages and marks staff-side unread admin replies as read.
   */
  async getStaffConversation(accountId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        staffAccountId: accountId,
        messageType: { in: ['support_request', 'support_reply'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark staff-side unread admin/system messages as read
    const unreadIds = messages
      .filter((m) => m.senderType !== 'staff' && !m.isRead)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await this.prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return {
      messages: messages.map((msg) => this.formatMessage(msg)),
    };
  }

  async markAllRead(accountId: string) {
    await this.prisma.message.updateMany({
      where: { staffAccountId: accountId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  private formatMessage(message: any) {
    return {
      id: message.id,
      title: message.title,
      content: message.content,
      messageType: message.messageType,
      senderType: message.senderType,
      isRead: message.isRead,
      status: message.isRead ? 'read' : 'unread',
      readAt: message.readAt?.toISOString?.() ?? message.readAt,
      adminReadAt: message.adminReadAt?.toISOString?.() ?? message.adminReadAt,
      createdAt: message.createdAt?.toISOString?.() ?? message.createdAt,
    };
  }
}
