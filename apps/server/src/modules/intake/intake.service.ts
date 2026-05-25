import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntakeService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(staffId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { staffId },
      include: { intakeStatus: true },
    });
    if (!account) throw new NotFoundException('Staff not found');
    if (account.intakeStatus && account.intakeStatus.intakeStatus !== 'draft') {
      throw new BadRequestException('Intake already submitted');
    }
    return this.prisma.staffIntakeStatus.upsert({
      where: { staffAccountId: account.id },
      create: { staffAccountId: account.id, intakeStatus: 'pending_review', submittedAt: new Date() },
      update: { intakeStatus: 'pending_review', submittedAt: new Date() },
    });
  }

  async getStatus(staffId: string) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    return this.prisma.staffIntakeStatus.findUnique({ where: { staffAccountId: account.id } });
  }
}
