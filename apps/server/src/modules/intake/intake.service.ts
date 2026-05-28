import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MANDATORY_CREDENTIAL_TYPES,
  SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS,
  CredentialTypeLabels,
  CREDENTIAL_TYPES_REQUIRE_EXPIRY,
} from '../credential/credential.constants';

function isDateBeforeToday(value: Date | string | null | undefined): boolean {
  if (!value) return false;
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return false;
  const today = new Date();
  const expiryDate = new Date(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate(),
  );
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return expiryDate < todayDate;
}

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
          include: {
            credentialSkills: { include: { staffSkill: true } },
          },
        },
        intakeStatus: true,
        listingStatus: true,
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    const isCredentialExpired = (cred: any) => {
      if (!cred?.expiryDate) return false;
      return isDateBeforeToday(cred.expiryDate);
    };

    const mandatoryCredentials = MANDATORY_CREDENTIAL_TYPES.map((type) => {
      const cred = account.credentials.find((c) => c.credentialType === type);
      return {
        credentialType: type,
        credentialTypeLabel: CredentialTypeLabels[type] ?? type,
        hasCredential: !!cred,
        credentialId: cred?.id ?? null,
        credentialStatus: cred?.credentialStatus ?? null,
        isExpired: isCredentialExpired(cred),
      };
    });

    const educationCredentialsCount = account.credentials.filter(
      (c) => c.credentialType === 'education' || c.credentialType === 'student_card',
    ).length;

    const skillCredentialRequirements = account.skills
      .filter((skill) =>
        SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS.includes(skill.categoryId),
      )
      .map((skill) => {
        const coveringCert = account.credentials.find(
          (cred) =>
            cred.credentialType === 'skill_cert' &&
            cred.credentialSkills?.some(
              (cs) => cs.staffSkillId === skill.id,
            ),
        );
        return {
          skillId: skill.id,
          categoryId: skill.categoryId,
          categoryName: skill.categoryName,
          requiresSkillCert: true,
          hasSkillCert: !!coveringCert,
          coveringCredentialId: coveringCert?.id ?? null,
          coveringCredentialStatus: coveringCert?.credentialStatus ?? null,
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

    for (const mc of mandatoryCredentials) {
      if (!mc.hasCredential) {
        issues.push(`缺少强准入证件: ${mc.credentialTypeLabel}`);
      } else if (mc.isExpired) {
        issues.push(`强准入证件已过期: ${mc.credentialTypeLabel}（证件过期）`);
      }
    }

    for (const sr of skillCredentialRequirements) {
      if (!sr.hasSkillCert) {
        issues.push(`服务技能「${sr.categoryName}」需要技能证书，请上传并关联`);
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
      educationCredentialsCount,
      mandatoryCredentials,
      skillCredentialRequirements,
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
        credentials: {
          where: { isCurrent: true },
          include: {
            credentialSkills: { include: { staffSkill: true } },
          },
        },
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
      const cred = account.credentials.find(
        (c) => c.credentialType === credType,
      );
      if (!cred) {
        const label = CredentialTypeLabels[credType] ?? credType;
        throw new BadRequestException(`请上传强准入证件: ${label}`);
      }
      if (CREDENTIAL_TYPES_REQUIRE_EXPIRY.includes(credType)) {
        const expired = isDateBeforeToday(cred.expiryDate);
        if (expired) {
          const label = CredentialTypeLabels[credType] ?? credType;
          throw new BadRequestException(`证件过期: ${label}（证件过期）`);
        }
      }
    }

    for (const skill of account.skills) {
      if (!SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS.includes(skill.categoryId)) {
        continue;
      }
      const hasCoveringCert = account.credentials.some(
        (cred) =>
          cred.credentialType === 'skill_cert' &&
          cred.credentialSkills?.some(
            (cs) => cs.staffSkillId === skill.id,
          ),
      );
      if (!hasCoveringCert) {
        throw new BadRequestException(
          `服务技能「${skill.categoryName}」需要关联技能证书，请上传技能证书并关联该技能`,
        );
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
      isAvailable: account.listingStatus?.isAvailable ?? false,
      managementStatus: account.listingStatus?.managementStatus ?? 'normal',
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
