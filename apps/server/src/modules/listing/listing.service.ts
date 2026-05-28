import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(accountId: string) {
    const status = await this.prisma.staffListingStatus.findUnique({
      where: { staffAccountId: accountId },
    });

    return this.formatStatus(status);
  }

  async resume(accountId: string) {
    await this.assertCanSelfToggle(accountId);

    const status = await this.prisma.staffListingStatus.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        listingStatus: 'on',
        isAvailable: true,
        pauseReason: null,
        resumedAt: new Date(),
      },
      update: {
        listingStatus: 'on',
        isAvailable: true,
        pauseReason: null,
        resumedAt: new Date(),
      },
    });

    return this.formatStatus(status);
  }

  async pause(accountId: string, reason?: string) {
    await this.assertCanSelfToggle(accountId);

    const status = await this.prisma.staffListingStatus.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        listingStatus: 'off',
        isAvailable: false,
        pauseReason: reason || 'staff_rest',
        pausedAt: new Date(),
      },
      update: {
        listingStatus: 'off',
        isAvailable: false,
        pauseReason: reason || 'staff_rest',
        pausedAt: new Date(),
      },
    });

    return this.formatStatus(status);
  }

  private async assertCanSelfToggle(accountId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: {
        intakeStatus: true,
        listingStatus: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Staff not found');
    }

    const intakeStatus = account.intakeStatus?.intakeStatus;
    if (intakeStatus !== 'approved') {
      throw new BadRequestException('入驻状态正常后才能切换上线状态');
    }

    const managementStatus = account.listingStatus?.managementStatus ?? 'normal';
    if (managementStatus === 'paused') {
      throw new BadRequestException('服务状态暂停，暂不能上线');
    }
    if (managementStatus === 'blacklisted') {
      throw new BadRequestException('服务状态受限，暂不能上线');
    }
  }

  private formatStatus(status: any) {
    const listingStatus = status?.isAvailable ? 'on' : 'off';

    return {
      listingStatus,
      isAvailable: listingStatus === 'on',
      listingStatusLabel: listingStatus === 'on' ? '上线中' : '休息中',
      pauseReason: status?.pauseReason ?? null,
      pausedAt: status?.pausedAt ?? null,
      resumedAt: status?.resumedAt ?? null,
      managementStatus: status?.managementStatus ?? 'normal',
    };
  }
}
