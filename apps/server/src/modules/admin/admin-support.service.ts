import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ConversationListParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

@Injectable()
export class AdminSupportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated conversation rows grouped by staffAccountId.
   * Each row is a distinct staff conversation with unread count and latest message preview.
   */
  async listConversations(params: ConversationListParams) {
    const { page, pageSize, keyword } = params;
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

    // Build a subquery: for each staffAccountId with support messages,
    // get latest message time and unread count (staff messages not yet read by admin).
    const staffFilter: Record<string, any> = {};
    if (keyword) {
      staffFilter.OR = [
        { staffId: { contains: keyword } },
        { phoneMasked: { contains: keyword } },
        { profile: { realNameMasked: { contains: keyword } } },
      ];
    }

    // Get all distinct staffAccountIds that have support messages
    const supportTypes = ['support_request', 'support_reply'];
    const distinctStaff = await this.prisma.message.groupBy({
      by: ['staffAccountId'],
      where: {
        messageType: { in: supportTypes },
        staffAccount: staffFilter.OR ? { OR: staffFilter.OR } : undefined,
      },
    });

    const staffAccountIds = distinctStaff.map((d) => d.staffAccountId);

    if (staffAccountIds.length === 0) {
      return { list: [], total: 0, page: safePage, pageSize: safePageSize, totalPages: 0 };
    }

    // For each staff, get the latest message timestamp and unread count
    const conversationsRaw = await Promise.all(
      staffAccountIds.map(async (staffAccountId) => {
        const latestMsg = await this.prisma.message.findFirst({
          where: {
            staffAccountId,
            messageType: { in: supportTypes },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            content: true,
            createdAt: true,
            senderType: true,
            messageType: true,
          },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            staffAccountId,
            messageType: { in: supportTypes },
            senderType: 'staff',
            adminReadAt: null,
          },
        });

        return { staffAccountId, latestMsg, unreadCount };
      }),
    );

    // Sort by latest message time descending
    conversationsRaw.sort((a, b) => {
      const aTime = a.latestMsg?.createdAt?.getTime() ?? 0;
      const bTime = b.latestMsg?.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    // Paginate
    const total = conversationsRaw.length;
    const offset = (safePage - 1) * safePageSize;
    const pageItems = conversationsRaw.slice(offset, offset + safePageSize);

    // Fetch staff details for paginated items
    const staffIds = pageItems.map((c) => c.staffAccountId);
    const staffAccounts = await this.prisma.staffAccount.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        staffId: true,
        phoneMasked: true,
        wechatNickname: true,
        profile: { select: { realNameMasked: true } },
      },
    });
    const staffMap = new Map(staffAccounts.map((s) => [s.id, s]));

    const list = pageItems.map((conv) => {
      const staff = staffMap.get(conv.staffAccountId);
      return {
        staffAccountId: conv.staffAccountId,
        staffId: staff?.staffId ?? '-',
        staffName: staff?.profile?.realNameMasked ?? staff?.wechatNickname ?? '-',
        staffPhone: staff?.phoneMasked ?? '-',
        unreadCount: conv.unreadCount,
        latestMessage: conv.latestMsg
          ? {
              title: conv.latestMsg.title,
              content: conv.latestMsg.content,
              senderType: conv.latestMsg.senderType,
              messageType: conv.latestMsg.messageType,
            }
          : null,
        latestMessageAt: conv.latestMsg?.createdAt?.toISOString() ?? null,
      };
    });

    return {
      list,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  /**
   * Returns chronological messages for one staff conversation.
   * Marks admin-side unread staff messages as read.
   */
  async getConversation(staffAccountId: string, adminUserId: string) {
    const staff = await this.prisma.staffAccount.findUnique({
      where: { id: staffAccountId },
      select: {
        id: true,
        staffId: true,
        phoneMasked: true,
        wechatNickname: true,
        profile: { select: { realNameMasked: true } },
      },
    });
    if (!staff) throw new NotFoundException('Staff account not found');

    const messages = await this.prisma.message.findMany({
      where: {
        staffAccountId,
        messageType: { in: ['support_request', 'support_reply'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        adminUser: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    // Mark admin-side unread staff messages as read
    const unreadIds = messages
      .filter((m) => m.senderType === 'staff' && !m.adminReadAt)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await this.prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { adminReadAt: new Date() },
      });
    }

    return {
      staff: {
        staffAccountId: staff.id,
        staffId: staff.staffId,
        staffName: staff.profile?.realNameMasked ?? staff.wechatNickname ?? '-',
        staffPhone: staff.phoneMasked ?? '-',
      },
      messages: messages.map((msg) => this.formatConversationMessage(msg)),
    };
  }

  /**
   * Admin replies to a staff conversation.
   */
  async replyToConversation(
    staffAccountId: string,
    adminUserId: string,
    content: string,
  ) {
    const normalizedContent = content?.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Reply content is required');
    }
    if (normalizedContent.length > 1000) {
      throw new BadRequestException('回复内容不能超过1000字');
    }

    const staff = await this.prisma.staffAccount.findUnique({
      where: { id: staffAccountId },
    });
    if (!staff) throw new NotFoundException('Staff account not found');

    // Get latest staff message for title context
    const latestStaffMsg = await this.prisma.message.findFirst({
      where: {
        staffAccountId,
        messageType: { in: ['support_request', 'support_reply'] },
        senderType: 'staff',
      },
      orderBy: { createdAt: 'desc' },
      select: { title: true },
    });

    const replyTitle = `客服回复：${latestStaffMsg?.title ?? '支持咨询'}`;

    const reply = await this.prisma.$transaction(async (tx) => {
      const replyMsg = await tx.message.create({
        data: {
          staffAccountId,
          adminUserId,
          title: replyTitle,
          content: normalizedContent,
          messageType: 'support_reply',
          senderType: 'admin',
          isRead: false,
          adminReadAt: new Date(),
        },
      });

      await tx.operationLog.create({
        data: {
          operatorId: adminUserId,
          operatorType: 'admin',
          targetType: 'support_conversation',
          targetId: staffAccountId,
          action: 'support_reply',
          detail: `客服回复员工 ${staff.staffId} 的咨询`,
        },
      });

      return replyMsg;
    });

    return this.formatConversationMessage(reply);
  }

  /**
   * Export conversation as structured data for CSV generation.
   */
  async exportConversation(staffAccountId: string) {
    const staff = await this.prisma.staffAccount.findUnique({
      where: { id: staffAccountId },
      select: {
        id: true,
        staffId: true,
        phoneMasked: true,
        wechatNickname: true,
        profile: { select: { realNameMasked: true } },
      },
    });
    if (!staff) throw new NotFoundException('Staff account not found');

    const messages = await this.prisma.message.findMany({
      where: {
        staffAccountId,
        messageType: { in: ['support_request', 'support_reply'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        adminUser: {
          select: { id: true, username: true, realName: true },
        },
      },
    });

    const staffName =
      staff.profile?.realNameMasked ?? staff.wechatNickname ?? staff.staffId;

    const rows = messages.map((msg) => ({
      time: msg.createdAt.toISOString(),
      senderRole: msg.senderType === 'staff' ? '员工' : msg.senderType === 'admin' ? '客服' : '系统',
      senderName:
        msg.senderType === 'staff'
          ? staffName
          : msg.senderType === 'admin'
            ? msg.adminUser?.realName ?? msg.adminUser?.username ?? '客服'
            : '系统',
      staffId: staff.staffId,
      title: msg.title,
      content: msg.content ?? '',
      messageType: msg.messageType,
    }));

    return {
      staff: {
        staffId: staff.staffId,
        staffName,
        staffPhone: staff.phoneMasked,
      },
      messages: rows,
      exportedAt: new Date().toISOString(),
    };
  }

  // ---- legacy support - keep backward compat for existing detail endpoint ----

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
            profile: { select: { realNameMasked: true } },
          },
        },
        adminUser: {
          select: { id: true, username: true, realName: true },
        },
      },
    });
    if (!message) throw new NotFoundException('Support message not found');
    return this.formatConversationMessage(message);
  }

  // ---- formatters ----

  private formatConversationMessage(msg: any) {
    return {
      id: msg.id,
      staffAccountId: msg.staffAccountId,
      staffId: msg.staffAccount?.staffId,
      staffName:
        msg.staffAccount?.profile?.realNameMasked ??
        msg.staffAccount?.wechatNickname ??
        msg.staffId ??
        '-',
      staffPhone: msg.staffAccount?.phoneMasked,
      adminUserId: msg.adminUserId,
      adminName: msg.adminUser?.realName ?? msg.adminUser?.username ?? null,
      title: msg.title,
      content: msg.content,
      messageType: msg.messageType,
      senderType: msg.senderType,
      isRead: msg.isRead,
      readAt: msg.readAt?.toISOString?.() ?? msg.readAt,
      adminReadAt: msg.adminReadAt?.toISOString?.() ?? msg.adminReadAt,
      createdAt: msg.createdAt?.toISOString?.() ?? msg.createdAt,
    };
  }
}
