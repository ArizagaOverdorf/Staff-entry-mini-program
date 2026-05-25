import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MANDATORY_CREDENTIAL_TYPES } from '../credential/credential.constants';

@Injectable()
export class IntakeService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(accountId: string, staffId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: {
        profile: true,
        skills: true,
        serviceAreas: true,
        credentials: {
          where: { isCurrent: true },
        },
        intakeStatus: true,
        listingStatus: true,
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    const mandatoryStatus = MANDATORY_CREDENTIAL_TYPES.map((type) => {
      const cred = account.credentials.find((c) => c.credentialType === type);
      return {
        credentialType: type,
        hasCredential: !!cred,
        credentialId: cred?.id ?? null,
        credentialStatus: cred?.credentialStatus ?? null,
      };
    });

    const issues: string[] = [];
    if (!account.phoneEncrypted) issues.push('未绑定手机号');
    if (!account.privacyAgreed) issues.push('未同意隐私政策');
    if (!account.profile) {
      issues.push('未填写个人资料');
    } else {
      if (!account.profile.realNameEncrypted) issues.push('未填写真实姓名');
      if (!account.profile.idNumberEncrypted) issues.push('未填写身份证号');
      if (account.profile.gender == null) issues.push('未选择性别');
    }
    if (account.skills.length === 0) issues.push('未选择服务类别');
    if (account.serviceAreas.length === 0) issues.push('未选择服务区域');

    for (const ms of mandatoryStatus) {
      if (!ms.hasCredential) {
        issues.push(`缺少强准入证件: ${ms.credentialType}`);
      }
    }

    return {
      staffId: account.staffId,
      canSubmit: issues.length === 0,
      issues,
      profileCompleted: !!account.profile?.realNameEncrypted,
      skillsCount: account.skills.length,
      serviceAreasCount: account.serviceAreas.length,
      credentialsCount: account.credentials.length,
      mandatoryCredentials: mandatoryStatus,
      intakeStatus: account.intakeStatus?.intakeStatus ?? 'draft',
      listingStatus: account.listingStatus?.listingStatus ?? 'offline',
    };
  }

  async submit(accountId: string, staffId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: {
        profile: true,
        skills: true,
        serviceAreas: true,
        credentials: { where: { isCurrent: true } },
        intakeStatus: true,
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    if (account.intakeStatus?.intakeStatus === 'pending_review') {
      throw new BadRequestException('入驻申请已在审核中');
    }

    if (!account.phoneEncrypted) {
      throw new BadRequestException('请先绑定手机号');
    }
    if (!account.privacyAgreed) {
      throw new BadRequestException('请先同意隐私政策');
    }
    if (!account.profile) {
      throw new BadRequestException('请先填写个人资料');
    }
    if (!account.profile.realNameEncrypted) {
      throw new BadRequestException('请填写真实姓名');
    }
    if (!account.profile.idNumberEncrypted) {
      throw new BadRequestException('请填写身份证号');
    }
    if (account.profile.gender == null) {
      throw new BadRequestException('请选择性别');
    }
    if (account.skills.length === 0) {
      throw new BadRequestException('请至少选择一个服务类别');
    }
    if (account.serviceAreas.length === 0) {
      throw new BadRequestException('请至少选择一个服务区域');
    }

    for (const credType of MANDATORY_CREDENTIAL_TYPES) {
      const hasCred = account.credentials.some(
        (c) => c.credentialType === credType,
      );
      if (!hasCred) {
        throw new BadRequestException(`请上传强准入证件: ${credType}`);
      }
    }

    return this.prisma.staffIntakeStatus.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        intakeStatus: 'pending_review',
        submittedAt: new Date(),
      },
      update: {
        intakeStatus: 'pending_review',
        submittedAt: new Date(),
        reviewRemark: null,
      },
    });
  }

  async getStatus(accountId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: {
        intakeStatus: true,
        listingStatus: true,
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    const intakeStatus = account.intakeStatus?.intakeStatus ?? 'draft';

    const auditRecords = await this.prisma.auditRecord.findMany({
      where: { staffAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      intakeStatus,
      intakeStatusLabel: this.getStatusLabel(intakeStatus),
      listingStatus: account.listingStatus?.listingStatus ?? 'offline',
      listingStatusLabel: account.listingStatus?.isAvailable ? '已上架' : '未上架',
      submittedAt: account.intakeStatus?.submittedAt,
      reviewedAt: account.intakeStatus?.reviewedAt,
      rejectReason:
        intakeStatus === 'rejected'
          ? account.intakeStatus?.reviewRemark
          : undefined,
      reviewerRemark: account.intakeStatus?.reviewRemark,
      auditLog: auditRecords.map((r) => ({
        id: r.id,
        action: r.action,
        remark: r.remark,
        createdAt: r.createdAt?.toISOString(),
      })),
    };
  }

  private getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      draft: '草稿',
      pending_review: '待审核',
      approved: '已通过',
      rejected: '已驳回',
      needs_more_info: '需补充资料',
    };
    return map[status] ?? status;
  }
}
