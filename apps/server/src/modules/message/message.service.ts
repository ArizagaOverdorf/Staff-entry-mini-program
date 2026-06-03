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

    // Support and audit messages are aggregated into dedicated rows in the miniapp.
    const where = {
      staffAccountId: accountId,
      messageType: { notIn: ['support_request', 'support_reply', 'audit'] },
    };
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
  async createSupportMessage(
    accountId: string,
    title?: string,
    content?: string,
  ) {
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
    if (normalizedContent.length > 500) {
      throw new BadRequestException('咨询内容不能超过500字');
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
    if (normalizedContent.length > 500) {
      throw new BadRequestException('消息内容不能超过500字');
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

  /**
   * Get support conversation summary for message center aggregation.
   * Returns one row with latest message preview, unread count, and session status.
   * Session is active if latest support message is within 30 minutes.
   */
  async getSupportConversationSummary(accountId: string) {
    const supportTypes: string[] = ['support_request', 'support_reply'];

    const latestMsg = await this.prisma.message.findFirst({
      where: {
        staffAccountId: accountId,
        messageType: { in: supportTypes },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        messageType: true,
        senderType: true,
        isRead: true,
        createdAt: true,
      },
    });

    const unreadCount = await this.prisma.message.count({
      where: {
        staffAccountId: accountId,
        messageType: { in: supportTypes },
        senderType: { in: ['admin', 'system'] },
        isRead: false,
      },
    });

    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    let sessionActive = false;
    if (latestMsg) {
      const age = Date.now() - new Date(latestMsg.createdAt).getTime();
      sessionActive = age < SESSION_TIMEOUT_MS;
    }

    return {
      hasConversation: !!latestMsg,
      latestMessage: latestMsg ? this.formatMessage(latestMsg) : null,
      unreadCount,
      sessionActive,
      sessionStatus: latestMsg
        ? sessionActive
          ? '会话进行中'
          : '会话已结束'
        : null,
      sessionTimeoutMs: SESSION_TIMEOUT_MS,
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
