import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { encrypt } from '../../utils/crypto.util';
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
    return this.updatePhone(accountId, dto);
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

    return this.updatePhone(accountId, dto);
  }

  private async updatePhone(accountId: string, dto: BindPhoneDto) {
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

    await this.prisma.staffAccount.update({
      where: { id: accountId },
      data: { phoneEncrypted, phoneMasked },
    });

    return { mobileBound: true, phoneMasked };
  }
}
