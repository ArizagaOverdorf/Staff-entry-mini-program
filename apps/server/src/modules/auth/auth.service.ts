import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { decrypt, encrypt } from '../../utils/crypto.util';
import { generateStaffId } from '../../utils/id-gen.util';
import { maskPhone } from '../../utils/mask.util';
import { BindPhoneDto } from './dto/bind-phone.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async wechatLogin(code: string) {
    // TODO: call WeChat API code2Session.
    const openid = `mock_openid_${code}`;
    let account = await this.prisma.staffAccount.findUnique({
      where: { openid },
    });
    const isNewUser = !account;

    if (!account) {
      account = await this.prisma.staffAccount.create({
        data: { staffId: generateStaffId(), openid },
      });
    }

    const token = this.jwtService.sign({
      sub: account.id,
      staffId: account.staffId,
    });

    return {
      token,
      staffId: account.staffId,
      isNewUser,
      mobileBound: !!account.phoneEncrypted,
      privacyAgreed: account.privacyAgreed,
    };
  }

  async bindPhone(accountId: string, dto: BindPhoneDto) {
    return this.updatePhone(accountId, dto, { reuseExistingPhoneAccount: true });
  }

  async changePhone(accountId: string, dto: BindPhoneDto) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: { profile: true },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    // Reserved for Alibaba Cloud / Tencent Cloud real-name verification.
    // Current MVP allows self-service phone change only after this WeChat-bound account is verified.
    if (!account.profile?.identityVerified) {
      throw new BadRequestException('identity verification is required');
    }

    return this.updatePhone(accountId, dto, { reuseExistingPhoneAccount: false });
  }

  private async updatePhone(
    accountId: string,
    dto: BindPhoneDto,
    options: { reuseExistingPhoneAccount: boolean },
  ) {
    const phone = dto.phone?.trim();
    const smsCode = dto.smsCode?.trim();

    if (dto.encryptedData || dto.iv) {
      // TODO: implement WeChat phone decryption via wechatDataDecrypt.
      if (!phone) {
        throw new BadRequestException(
          'WeChat phone decryption is not implemented yet; provide plain phone instead',
        );
      }
    }

    if (!phone) {
      throw new BadRequestException('phone is required');
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('phone format is invalid');
    }

    if (phone && smsCode !== '123456') {
      throw new BadRequestException('sms code is invalid');
    }

    let phoneEncrypted: string;
    try {
      phoneEncrypted = encrypt(phone, this.config.encryptionKey);
    } catch {
      throw new InternalServerErrorException(
        'Invalid encryption configuration',
      );
    }

    const phoneMasked = maskPhone(phone);
    const currentAccount = await this.prisma.staffAccount.findFirst({
      where: { id: accountId, deletedAt: null },
      select: {
        id: true,
        staffId: true,
        openid: true,
        privacyAgreed: true,
      },
    });

    if (!currentAccount) {
      throw new BadRequestException('account not found');
    }

    const existingAccount = await this.findActiveAccountByPhone(phone, accountId);

    if (existingAccount) {
      if (!options.reuseExistingPhoneAccount) {
        throw new BadRequestException('手机号已绑定其他服务人员账号');
      }

      const now = new Date();
      const reusedAccount = await this.prisma.$transaction(async (tx) => {
        await tx.staffAccount.update({
          where: { id: currentAccount.id },
          data: {
            openid: null,
            deletedAt: now,
          },
        });

        return tx.staffAccount.update({
          where: { id: existingAccount.id },
          data: {
            openid: currentAccount.openid || existingAccount.openid,
            phoneEncrypted,
            phoneMasked,
          },
        });
      });

      return {
        mobileBound: true,
        phoneMasked,
        staffId: reusedAccount.staffId,
        token: this.signStaffToken(reusedAccount.id, reusedAccount.staffId),
        privacyAgreed: reusedAccount.privacyAgreed,
        reusedAccount: true,
      };
    }

    await this.prisma.staffAccount.update({
      where: { id: accountId },
      data: { phoneEncrypted, phoneMasked },
    });

    return {
      mobileBound: true,
      phoneMasked,
      staffId: currentAccount.staffId,
      token: this.signStaffToken(currentAccount.id, currentAccount.staffId),
      privacyAgreed: currentAccount.privacyAgreed,
      reusedAccount: false,
    };
  }

  private signStaffToken(accountId: string, staffId: string): string {
    return this.jwtService.sign({
      sub: accountId,
      staffId,
    });
  }

  private async findActiveAccountByPhone(phone: string, excludeAccountId: string) {
    const phoneMasked = maskPhone(phone);
    const candidates = await this.prisma.staffAccount.findMany({
      where: {
        deletedAt: null,
        phoneMasked,
        id: { not: excludeAccountId },
      },
      select: {
        id: true,
        staffId: true,
        openid: true,
        phoneEncrypted: true,
        privacyAgreed: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    for (const candidate of candidates) {
      if (!candidate.phoneEncrypted) continue;
      try {
        if (decrypt(candidate.phoneEncrypted, this.config.encryptionKey) === phone) {
          return candidate;
        }
      } catch {
        // Ignore rows encrypted with an old or invalid local key.
      }
    }
    return null;
  }
}
