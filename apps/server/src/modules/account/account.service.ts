import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(accountId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: {
        profile: true,
        intakeStatus: true,
        listingStatus: true,
      },
    });
    if (!account) throw new NotFoundException('Account not found');
    return {
      staffId: account.staffId,
      mobileBound: !!account.phoneEncrypted,
      phoneMasked: account.phoneMasked,
      privacyAgreed: account.privacyAgreed,
      wechatNickname: account.wechatNickname,
      wechatAvatar: account.wechatAvatar,
      profile: account.profile,
      intakeStatus: account.intakeStatus,
      listingStatus: account.listingStatus,
      createdAt: account.createdAt,
    };
  }

  async agreePrivacy(accountId: string) {
    await this.prisma.staffAccount.update({
      where: { id: accountId },
      data: { privacyAgreed: true, privacyAgreedAt: new Date() },
    });
    return { privacyAgreed: true };
  }
}
