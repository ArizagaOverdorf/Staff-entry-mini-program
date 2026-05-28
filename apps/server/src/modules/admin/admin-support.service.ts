import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface SupportListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  messageType?: string;
  isRead?: boolean;
}

@Injectable()
export class AdminSupportService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: SupportListParams) {
    const { page, pageSize, keyword, messageType, isRead } = params;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(pageSize, 100)
        : 20;

    const where: Record<string, any> = {
      messageType: { in: ['support_request', 'support_reply'] },
    };

    if (messageType) {
      where.messageType = messageType;
    }
    if (isRead !== undefined && isRead !== null) {
      where.isRead = isRead;
    }
    if (keyword) {
      where.staffAccount = {
        OR: [
          { staffId: { contains: keyword } },
          { phoneMasked: { contains: keyword } },
          { profile: { realNameMasked: { contains: keyword } } },
        ],
      };
    }

    const [total, list] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        include: {
          staffAccount: {
            select: {
              id: true,
              staffId: true,
              phoneMasked: true,
              wechatNickname: true,
              profile: {
                select: { realNameMasked: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
    ]);

    return {
      list: list.map((msg) => this.formatSupportMessage(msg)),
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  async detail(messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        messageType: { in: ['support_request', 'support_reply'] },
      },
      include: {
        staffAccount: {
          select: {
            id: true,
            staffId: true,
            phoneMasked: true,
            wechatNickname: true,
            profile: {
              select: { realNameMasked: true },
            },
          },
        },
      },
    });
    if (!message) throw new NotFoundException('Support message not found');

    return this.formatSupportMessage(message);
  }

  async reply(messageId: string, adminUserId: string, content: string) {
    const normalizedContent = content?.trim();

    if (!normalizedContent) {
      throw new BadRequestException('Reply content is required');
    }
    if (normalizedContent.length > 1000) {
      throw new BadRequestException('回复内容不能超过1000字');
    }

    const original = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        messageType: { in: ['support_request', 'support_reply'] },
      },
    });
    if (!original) throw new NotFoundException('Support message not found');

    const replyTitle = `客服回复：${original.title}`;

    const reply = await this.prisma.$transaction(async (tx) => {
      const replyMsg = await tx.message.create({
        data: {
          staffAccountId: original.staffAccountId,
          title: replyTitle,
          content: normalizedContent,
          messageType: 'support_reply',
          isRead: false,
        },
      });

      await tx.operationLog.create({
        data: {
          operatorId: adminUserId,
          operatorType: 'admin',
          targetType: 'support_message',
          targetId: original.id,
          action: 'support_reply',
          detail: `回复支持消息: ${original.title}`,
        },
      });

      return replyMsg;
    });

    return this.formatSupportMessage(reply);
  }

  private formatSupportMessage(msg: any) {
    return {
      id: msg.id,
      staffAccountId: msg.staffAccountId,
      staffId: msg.staffAccount?.staffId,
      staffName:
        msg.staffAccount?.profile?.realNameMasked ??
        msg.staffAccount?.wechatNickname ??
        '-',
      staffPhone: msg.staffAccount?.phoneMasked,
      title: msg.title,
      content: msg.content,
      messageType: msg.messageType,
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString?.() ?? msg.readAt,
      createdAt: msg.createdAt?.toISOString?.() ?? msg.createdAt,
    };
  }
}
