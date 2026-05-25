import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { generateStaffId } from '../../utils/id-gen.util';
import { BindPhoneDto } from './dto/bind-phone.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async wechatLogin(code: string) {
    // TODO: call WeChat API code2Session
    const openid = `mock_openid_${code}`;
    let account = await this.prisma.staffAccount.findUnique({
      where: { openid },
    });
    if (!account) {
      account = await this.prisma.staffAccount.create({
        data: { staffId: generateStaffId(), openid },
      });
    }
    const token = this.jwtService.sign({ sub: account.id, staffId: account.staffId });
    return { token, staffId: account.staffId };
  }

  async bindPhone(dto: BindPhoneDto) {
    // TODO: verify WeChat phone number
    await this.prisma.staffAccount.update({
      where: { id: dto.staffAccountId },
      data: { phoneEncrypted: dto.phone, phoneMasked: dto.phone.slice(0, 3) + '****' + dto.phone.slice(-4) },
    });
  }
}
