import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MANDATORY_CREDENTIAL_TYPES,
  SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS,
  CredentialTypeLabels,
} from '../credential/credential.constants';

const INTAKE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  needs_more_info: '需补充资料',
};

const LISTING_STATUS_MAP: Record<string, string> = {
  on: 'on',
  off: 'off',
  offline: 'off',
  paused: 'paused',
};

interface StaffListParams {
  page: number;
  pageSize: number;
  name?: string;
  phone?: string;
  intakeStatus?: string;
  listingStatus?: string;
}

@Injectable()
export class AdminStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: StaffListParams) {
    const { page, pageSize, name, phone, intakeStatus, listingStatus } = params;
    const where: Record<string, any> = { deletedAt: null };

    if (name) {
      where.profile = { realNameMasked: { contains: name } };
    }
    if (phone) {
      where.phoneMasked = { contains: phone };
    }
    if (intakeStatus) {
      where.intakeStatus = { intakeStatus };
    }
    if (listingStatus) {
      where.listingStatus = {
        listingStatus: LISTING_STATUS_MAP[listingStatus] ?? listingStatus,
      };
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(pageSize, 100)
        : 10;

    const [total, items] = await Promise.all([
      this.prisma.staffAccount.count({ where }),
      this.prisma.staffAccount.findMany({
        where,
        select: {
          id: true,
          staffId: true,
          phoneMasked: true,
          wechatNickname: true,
          privacyAgreed: true,
          createdAt: true,
          profile: {
            select: {
              realNameMasked: true,
              idNumberMasked: true,
              gender: true,
              avatarUrl: true,
              address: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
          intakeStatus: {
            select: {
              intakeStatus: true,
              submittedAt: true,
              reviewedAt: true,
              reviewRemark: true,
            },
          },
          listingStatus: {
            select: {
              listingStatus: true,
              isAvailable: true,
              pauseReason: true,
            },
          },
        },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      list: items.map((item) => this.formatStaffListItem(item)),
      total,
    };
  }

  async detail(staffId: string) {
    const account = await this.prisma.staffAccount.findFirst({
      where: { staffId, deletedAt: null },
      include: {
        profile: true,
        skills: true,
        serviceAreas: true,
        intakeStatus: true,
        listingStatus: true,
        auditRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            adminUser: { select: { id: true, realName: true, username: true } },
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    return {
      id: account.id,
      staffId: account.staffId,
      name: account.profile?.realNameMasked ?? account.wechatNickname ?? '-',
      phone: account.phoneMasked,
      nickname: account.wechatNickname,
      avatar: account.profile?.avatarUrl,
      gender:
        account.profile?.gender != null
          ? account.profile.gender === 1
            ? '男'
            : '女'
          : undefined,
      idNumber: account.profile?.idNumberMasked,
      address: account.profile?.address,
      emergencyContact: account.profile?.emergencyContactName,
      emergencyPhone: account.profile?.emergencyContactPhone,
      serviceCategories: account.skills.map((skill) => skill.categoryName),
      serviceAreas: account.serviceAreas.map((area) =>
        `${area.province} ${area.city} ${area.district ?? ''}`.trim(),
      ),
      intakeStatus: account.intakeStatus?.intakeStatus ?? 'draft',
      intakeStatusLabel:
        INTAKE_STATUS_LABELS[account.intakeStatus?.intakeStatus ?? 'draft'],
      submittedAt: account.intakeStatus?.submittedAt?.toISOString(),
      reviewedAt: account.intakeStatus?.reviewedAt?.toISOString(),
      reviewRemark: account.intakeStatus?.reviewRemark,
      listingStatus: account.listingStatus?.listingStatus ?? 'off',
      isAvailable: account.listingStatus?.isAvailable ?? false,
      pauseReason: account.listingStatus?.pauseReason,
      privacyAgreed: account.privacyAgreed,
      auditRecords: account.auditRecords.map((record) =>
        this.formatAuditRecord(record),
      ),
      createdAt: account.createdAt?.toISOString(),
    };
  }

  async credentials(staffId: string) {
    const account = await this.getStaffAccount(staffId);

    const credentials = await this.prisma.staffCredential.findMany({
      where: { staffAccountId: account.id },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: { include: { staffSkill: true } },
      },
      orderBy: [{ isCurrent: 'desc' }, { version: 'desc' }],
    });

    return credentials.map((credential) => ({
      id: credential.id,
      staffId: account.staffId,
      credentialType: credential.credentialType,
      credentialTypeLabel:
        CredentialTypeLabels[credential.credentialType] ?? credential.credentialType,
      credentialName: credential.credentialName,
      credentialNumber: credential.credentialNumber,
      issuingAuthority: credential.issuingAuthority,
      issueDate: credential.issueDate?.toISOString?.() ?? credential.issueDate,
      expiryDate:
        credential.expiryDate?.toISOString?.() ?? credential.expiryDate,
      status: credential.credentialStatus,
      badge: credential.credentialBadge,
      version: credential.version,
      isCurrent: credential.isCurrent,
      remark: credential.remark,
      linkedSkills: (credential.credentialSkills || []).map((cs: any) => ({
        id: cs.staffSkill?.id ?? cs.staffSkillId,
        categoryId: cs.staffSkill?.categoryId,
        categoryName: cs.staffSkill?.categoryName,
      })),
      files: credential.files.map((file) => ({
        id: file.id,
        fileType: file.fileType,
        fileAsset: {
          id: file.fileAsset.id,
          originalName: file.fileAsset.originalName,
          mimeType: file.fileAsset.mimeType,
          size: Number(file.fileAsset.size),
        },
      })),
    }));
  }

  async getAuditRecords(staffId: string) {
    const account = await this.getStaffAccount(staffId);

    const records = await this.prisma.auditRecord.findMany({
      where: { staffAccountId: account.id },
      include: {
        adminUser: { select: { id: true, realName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.formatAuditRecord(record));
  }

  async approveIntake(staffId: string, adminUserId: string, remark?: string) {
    const account = await this.getReviewAccount(staffId);
    this.assertPendingReview(account.intakeStatus?.intakeStatus);

    const credentials = account.credentials || [];

    const missingOrUnapproved = MANDATORY_CREDENTIAL_TYPES.filter(
      (credentialType) => {
        const credential = credentials.find(
          (item) => item.credentialType === credentialType && item.isCurrent,
        );
        return !credential || credential.credentialStatus !== 'approved';
      },
    );

    if (missingOrUnapproved.length > 0) {
      throw new BadRequestException(
        `Required credentials are not approved: ${missingOrUnapproved.join(', ')}`,
      );
    }

    for (const skill of account.skills || []) {
      if (!SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS.includes(skill.categoryId)) {
        continue;
      }
      const hasApprovedCert = credentials.some(
        (cred) =>
          cred.credentialType === 'skill_cert' &&
          cred.credentialStatus === 'approved' &&
          cred.isCurrent &&
          (cred.credentialSkills || []).some(
            (cs: any) => cs.staffSkillId === skill.id,
          ),
      );
      if (!hasApprovedCert) {
        throw new BadRequestException(
          `Skill "${skill.categoryName}" requires an approved skill certificate`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.staffIntakeStatus.update({
        where: { staffAccountId: account.id },
        data: {
          intakeStatus: 'approved',
          reviewedAt: new Date(),
          reviewRemark: remark || null,
        },
      });

      const listingStatus = await tx.staffListingStatus.findUnique({
        where: { staffAccountId: account.id },
      });
      if (!listingStatus) {
        await tx.staffListingStatus.create({
          data: {
            staffAccountId: account.id,
            listingStatus: 'off',
            isAvailable: false,
          },
        });
      }

      await this.writeReviewSideEffects(tx, {
        staffAccountId: account.id,
        staffId: account.staffId,
        adminUserId,
        auditAction: 'intake_approve',
        operationAction: 'intake_approve',
        targetType: 'staff_intake',
        targetId: account.staffId,
        remark: remark || '入驻审核通过',
        messageTitle: '入驻审核通过',
        messageContent: remark
          ? `您的入驻申请已通过审核。备注：${remark}`
          : '您的入驻申请已通过审核。',
      });
    });

    return { intakeStatus: 'approved', label: INTAKE_STATUS_LABELS.approved };
  }

  async rejectIntake(staffId: string, adminUserId: string, remark?: string) {
    const account = await this.getReviewAccount(staffId);
    this.assertPendingReview(account.intakeStatus?.intakeStatus);
    this.assertRemark(remark, 'Reject remark is required');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffIntakeStatus.update({
        where: { staffAccountId: account.id },
        data: {
          intakeStatus: 'rejected',
          reviewedAt: new Date(),
          reviewRemark: remark,
        },
      });

      await this.writeReviewSideEffects(tx, {
        staffAccountId: account.id,
        staffId: account.staffId,
        adminUserId,
        auditAction: 'intake_reject',
        operationAction: 'intake_reject',
        targetType: 'staff_intake',
        targetId: account.staffId,
        remark,
        messageTitle: '入驻审核驳回',
        messageContent: `您的入驻申请未通过审核。原因：${remark}`,
      });
    });

    return { intakeStatus: 'rejected', label: INTAKE_STATUS_LABELS.rejected };
  }

  async requestMoreInfo(
    staffId: string,
    adminUserId: string,
    remark?: string,
  ) {
    const account = await this.getReviewAccount(staffId);
    this.assertPendingReview(account.intakeStatus?.intakeStatus);
    this.assertRemark(remark, 'More-info remark is required');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffIntakeStatus.update({
        where: { staffAccountId: account.id },
        data: {
          intakeStatus: 'needs_more_info',
          reviewedAt: new Date(),
          reviewRemark: remark,
        },
      });

      await this.writeReviewSideEffects(tx, {
        staffAccountId: account.id,
        staffId: account.staffId,
        adminUserId,
        auditAction: 'intake_request_more_info',
        operationAction: 'intake_request_more_info',
        targetType: 'staff_intake',
        targetId: account.staffId,
        remark,
        messageTitle: '入驻资料需补充',
        messageContent: `您的入驻申请需要补充资料。要求：${remark}`,
      });
    });

    return {
      intakeStatus: 'needs_more_info',
      label: INTAKE_STATUS_LABELS.needs_more_info,
    };
  }

  async reviewCredential(
    staffId: string,
    credentialId: string,
    adminUserId: string,
    action: 'approve' | 'reject',
    remark?: string,
  ) {
    if (action !== 'approve' && action !== 'reject') {
      throw new BadRequestException('Invalid credential review action');
    }
    if (action === 'reject') {
      this.assertRemark(remark, 'Credential reject remark is required');
    }

    const credential = await this.prisma.staffCredential.findFirst({
      where: {
        id: credentialId,
        staffAccount: { staffId, deletedAt: null },
      },
      include: { staffAccount: { select: { id: true, staffId: true } } },
    });
    if (!credential) throw new NotFoundException('Credential not found');
    if (!credential.isCurrent) {
      throw new BadRequestException('Only current credential can be reviewed');
    }

    const isApprove = action === 'approve';
    const auditAction = isApprove
      ? 'credential_approve'
      : 'credential_reject';
    const messageTitle = isApprove ? '证件审核通过' : '证件审核驳回';
    const finalRemark =
      remark ||
      `${credential.credentialName || credential.credentialType} ${
        isApprove ? '审核通过' : '审核驳回'
      }`;

    await this.prisma.$transaction(async (tx) => {
      await tx.staffCredential.update({
        where: { id: credential.id },
        data: {
          credentialStatus: isApprove ? 'approved' : 'rejected',
          credentialBadge: null,
          remark: isApprove ? remark || null : remark,
        },
      });

      await this.writeReviewSideEffects(tx, {
        staffAccountId: credential.staffAccountId,
        staffId: credential.staffAccount.staffId,
        adminUserId,
        auditAction,
        operationAction: auditAction,
        targetType: 'staff_credential',
        targetId: credential.id,
        remark: finalRemark,
        messageTitle,
        messageContent: isApprove
          ? `您的证件「${credential.credentialName}」已通过审核。`
          : `您的证件「${credential.credentialName}」未通过审核。原因：${remark}`,
      });
    });

    return {
      credentialStatus: isApprove ? 'approved' : 'rejected',
    };
  }

  private formatStaffListItem(item: any) {
    return {
      id: item.id,
      staffId: item.staffId,
      name: item.profile?.realNameMasked ?? item.wechatNickname ?? '-',
      phone: item.phoneMasked,
      gender:
        item.profile?.gender != null
          ? item.profile.gender === 1
            ? '男'
            : '女'
          : undefined,
      avatar: item.profile?.avatarUrl,
      intakeStatus: item.intakeStatus?.intakeStatus ?? 'draft',
      reviewRemark: item.intakeStatus?.reviewRemark,
      submittedAt: item.intakeStatus?.submittedAt?.toISOString(),
      reviewedAt: item.intakeStatus?.reviewedAt?.toISOString(),
      listingStatus: item.listingStatus?.listingStatus ?? 'off',
      isAvailable: item.listingStatus?.isAvailable ?? false,
      pauseReason: item.listingStatus?.pauseReason,
      createdAt: item.createdAt?.toISOString(),
    };
  }

  private formatAuditRecord(record: any) {
    return {
      id: record.id,
      action: record.action,
      remark: record.remark,
      adminUser: record.adminUser
        ? {
            id: record.adminUser.id,
            name: record.adminUser.realName ?? record.adminUser.username,
          }
        : null,
      createdAt: record.createdAt?.toISOString(),
    };
  }

  private async getStaffAccount(staffId: string) {
    const account = await this.prisma.staffAccount.findFirst({
      where: { staffId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Staff not found');
    return account;
  }

  private async getReviewAccount(staffId: string) {
    const account = await this.prisma.staffAccount.findFirst({
      where: { staffId, deletedAt: null },
      include: {
        intakeStatus: true,
        skills: true,
        credentials: {
          where: { isCurrent: true },
          include: {
            credentialSkills: true,
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Staff not found');
    return account;
  }

  private assertPendingReview(status?: string) {
    if (status !== 'pending_review') {
      throw new BadRequestException(
        `Only pending_review intake can be reviewed, current status: ${
          status ?? 'draft'
        }`,
      );
    }
  }

  private assertRemark(remark: string | undefined, message: string) {
    if (!remark?.trim()) {
      throw new BadRequestException(message);
    }
  }

  private async writeReviewSideEffects(
    tx: any,
    input: {
      staffAccountId: string;
      staffId: string;
      adminUserId: string;
      auditAction: string;
      operationAction: string;
      targetType: string;
      targetId: string;
      remark?: string;
      messageTitle: string;
      messageContent: string;
    },
  ) {
    await tx.auditRecord.create({
      data: {
        staffAccountId: input.staffAccountId,
        adminUserId: input.adminUserId,
        action: input.auditAction,
        remark: input.remark,
      },
    });

    await tx.operationLog.create({
      data: {
        operatorId: input.adminUserId,
        operatorType: 'admin',
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.operationAction,
        detail: input.remark,
      },
    });

    await tx.message.create({
      data: {
        staffAccountId: input.staffAccountId,
        title: input.messageTitle,
        content: input.messageContent,
        messageType: 'audit',
      },
    });
  }
}
