import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrivacyAgreeDto } from './dto/privacy-agree.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async agreePrivacy(dto: PrivacyAgreeDto) {
    await this.prisma.staffAccount.update({
      where: { id: dto.staffAccountId },
      data: { privacyAgreed: true, privacyAgreedAt: new Date() },
    });
  }
}
