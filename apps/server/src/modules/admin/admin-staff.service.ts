import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { decrypt } from '../../utils/crypto.util';
import {
  MANDATORY_CREDENTIAL_TYPES,
  MANDATORY_CREDENTIAL_TYPES_FULL,
  CredentialTypeLabels,
  CREDENTIAL_TYPES_REQUIRE_EXPIRY,
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

const MANAGEMENT_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  paused: '暂停',
  blacklisted: '拉黑',
};

interface StaffListParams {
  page: number;
  pageSize: number;
  name?: string;
  phone?: string;
  intakeStatus?: string;
  listingStatus?: string;
  includeDraft?: boolean;
}

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
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalStaff, pendingReview, approved, todaySubmitted] = await Promise.all([
      this.prisma.staffAccount.count({ where: { deletedAt: null } }),
      this.prisma.staffIntakeStatus.count({
        where: { intakeStatus: 'pending_review' },
      }),
      this.prisma.staffIntakeStatus.count({
        where: { intakeStatus: 'approved' },
      }),
      this.prisma.staffAccount.count({
        where: {
          deletedAt: null,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    return { totalStaff, pendingReview, approved, todaySubmitted };
  }

  async list(params: StaffListParams) {
    const { page, pageSize, name, phone, intakeStatus, listingStatus, includeDraft } = params;
    const where: Record<string, any> = { deletedAt: null };

    if (name) {
      where.profile = { realNameMasked: { contains: name } };
    }
    if (phone) {
      where.phoneMasked = { contains: phone };
    }
    if (intakeStatus) {
      where.intakeStatus = { is: { intakeStatus } };
    } else if (!includeDraft) {
      where.intakeStatus = { is: { intakeStatus: { not: 'draft' } } };
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
              managementStatus: true,
              managementReason: true,
              managementUpdatedAt: true,
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

  async detail(
    staffId: string,
    admin?: { id: string; isSuper: boolean; permissions: string[] },
  ) {
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

    const canViewSensitive =
      admin?.isSuper || admin?.permissions?.includes('staff.sensitive.view');

    let fullName: string | undefined;
    let fullPhone: string | undefined;
    let fullIdNumber: string | undefined;

    if (canViewSensitive && admin) {
      const key = this.config.encryptionKey;

      if (account.profile?.realNameEncrypted) {
        try {
          fullName = decrypt(account.profile.realNameEncrypted, key);
        } catch { /* leave undefined */ }
      }
      if (account.phoneEncrypted) {
        try {
          fullPhone = decrypt(account.phoneEncrypted, key);
        } catch { /* leave undefined */ }
      }
      if (account.profile?.idNumberEncrypted) {
        try {
          fullIdNumber = decrypt(account.profile.idNumberEncrypted, key);
        } catch { /* leave undefined */ }
      }

      await this.prisma.operationLog.create({
        data: {
          operatorId: admin.id,
          operatorType: 'admin',
          targetType: 'staff_sensitive_data',
          targetId: account.staffId,
          action: 'staff_sensitive_view',
          detail: `管理员查看了服务人员敏感信息`,
        },
      });
    }

    return {
      id: account.id,
      staffId: account.staffId,
      name: fullName ?? account.profile?.realNameMasked ?? account.wechatNickname ?? '-',
      phone: fullPhone ?? account.phoneMasked,
      nickname: account.wechatNickname,
      avatar: account.profile?.avatarUrl,
      gender:
        account.profile?.gender != null
          ? account.profile.gender === 1
            ? '男'
            : '女'
          : undefined,
      idNumber: fullIdNumber ?? account.profile?.idNumberMasked,
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
      managementStatus: account.listingStatus?.managementStatus ?? 'normal',
      managementStatusLabel: MANAGEMENT_STATUS_LABELS[account.listingStatus?.managementStatus ?? 'normal'],
      managementReason: account.listingStatus?.managementReason,
      privacyAgreed: account.privacyAgreed,
      canViewSensitive: !!canViewSensitive,
      auditRecords: account.auditRecords.map((record) =>
        this.formatAuditRecord(record),
      ),
      createdAt: account.createdAt?.toISOString(),
    };
  }

  async credentials(staffId: string) {
    const account = await this.getStaffAccount(staffId);

    const credentials = await this.prisma.staffCredential.findMany({
      where: { staffAccountId: account.id, isCurrent: true },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: { include: { staffSkill: true } },
      },
      orderBy: [{ credentialType: 'asc' }, { version: 'desc' }],
    });

    const isExpired = (cred: any) => isDateBeforeToday(cred.expiryDate);

    const fileSideLabels: Record<string, string> = {
      front: '人像面',
      back: '国徽面',
      credential_image: '证件图片',
      attachment: '附件',
    };

    return credentials.map((credential) => {
      const expired = isExpired(credential);
      const badge = expired ? 'expired' : (credential.credentialBadge ?? null);
      return {
      id: credential.id,
      staffId: account.staffId,
      credentialType: credential.credentialType,
      credentialTypeLabel:
        CredentialTypeLabels[credential.credentialType] ?? credential.credentialType,
      credentialGroupId: credential.credentialGroupId,
      credentialName: credential.credentialName,
      credentialNumber: credential.credentialNumber,
      issuingAuthority: credential.issuingAuthority,
      issueDate: credential.issueDate?.toISOString?.() ?? credential.issueDate,
      expiryDate:
        credential.expiryDate?.toISOString?.() ?? credential.expiryDate,
      status: credential.credentialStatus,
      badge,
      isExpired: expired,
      expiryStatusLabel: expired ? '证件过期' : undefined,
      skillLevel: credential.skillLevel,
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
        fileSide: fileSideLabels[file.fileType] || file.fileType,
        fileAsset: {
          id: file.fileAsset.id,
          originalName: file.fileAsset.originalName,
          mimeType: file.fileAsset.mimeType,
          size: Number(file.fileAsset.size),
        },
      })),
      };
    });
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

    const requiredCredentialTypes = MANDATORY_CREDENTIAL_TYPES_FULL;

    const missingOrUnapproved: string[] = [];
    for (const credentialType of requiredCredentialTypes) {
      const credential = credentials.find(
        (item) => item.credentialType === credentialType && item.isCurrent,
      );
      if (!credential || credential.credentialStatus !== 'approved') {
        missingOrUnapproved.push(credentialType);
        continue;
      }
      const sideFiles = await this.loadCredentialFiles(credential.id);
      if (credentialType === 'id_card') {
        const hasFront = sideFiles.some((f: any) => f.fileType === 'front');
        const hasBack = sideFiles.some((f: any) => f.fileType === 'back');
        if (!hasFront || !hasBack) {
          missingOrUnapproved.push(credentialType);
        }
      } else if (sideFiles.length === 0) {
        missingOrUnapproved.push(credentialType);
      }
    }

    if (missingOrUnapproved.length > 0) {
      const labels = missingOrUnapproved
        .map((type) => CredentialTypeLabels[type] ?? type)
        .join('、');
      throw new BadRequestException(`强准入资料未通过或缺失: ${labels}`);
    }

    for (const cred of credentials) {
      if (!CREDENTIAL_TYPES_REQUIRE_EXPIRY.includes(cred.credentialType)) {
        continue;
      }
      if (isDateBeforeToday(cred.expiryDate)) {
        const label = CredentialTypeLabels[cred.credentialType] ?? cred.credentialType;
        throw new BadRequestException(`证件过期: ${label}（证件过期），无法通过入驻审核`);
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

    if (
      isApprove &&
      CREDENTIAL_TYPES_REQUIRE_EXPIRY.includes(credential.credentialType) &&
      isDateBeforeToday(credential.expiryDate)
    ) {
      throw new BadRequestException(
        `证件过期: 该证件已过期（证件过期），无法通过审核`,
      );
    }

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

  async cleanupDrafts() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.staffAccount.updateMany({
      where: {
        deletedAt: null,
        createdAt: { lt: sevenDaysAgo },
        OR: [
          { intakeStatus: { is: { intakeStatus: 'draft' } } },
          { intakeStatus: { is: null } },
        ],
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { cleaned: result.count };
  }

  async setManagementStatus(
    staffId: string,
    adminUserId: string,
    status: 'normal' | 'paused' | 'blacklisted',
    reason?: string,
  ) {
    if ((status === 'paused' || status === 'blacklisted') && !reason?.trim()) {
      throw new BadRequestException('暂停或拉黑操作必须填写原因');
    }

    const account = await this.getStaffAccount(staffId);
    const listingStatus = await this.prisma.staffListingStatus.findUnique({
      where: { staffAccountId: account.id },
    });

    const oldStatus = listingStatus?.managementStatus ?? 'normal';

    const statusLabelMap: Record<string, string> = {
      normal: '正常',
      paused: '暂停',
      blacklisted: '拉黑',
    };

    const statusLabel = statusLabelMap[status] || status;

    const isRestrictive = status === 'paused' || status === 'blacklisted';

    await this.prisma.$transaction(async (tx) => {
      const updateData: Record<string, any> = {
        managementStatus: status,
        managementReason: isRestrictive ? reason : null,
        managementUpdatedAt: new Date(),
        managementUpdatedBy: adminUserId,
      };

      if (isRestrictive) {
        updateData.listingStatus = 'off';
        updateData.isAvailable = false;
        updateData.pauseReason = `management_${status}`;
        updateData.pausedAt = new Date();
      }

      await tx.staffListingStatus.upsert({
        where: { staffAccountId: account.id },
        create: {
          staffAccountId: account.id,
          listingStatus: 'off',
          isAvailable: false,
          ...updateData,
        },
        update: updateData,
      });

      await tx.operationLog.create({
        data: {
          operatorId: adminUserId,
          operatorType: 'admin',
          targetType: 'staff_management_status',
          targetId: account.staffId,
          action: `management_${status}`,
          detail: `管理状态变更: ${oldStatus} → ${status}${reason ? `，原因：${reason}` : ''}`,
        },
      });

      const messageTitle = `服务状态变更通知`;
      const messageContent = isRestrictive
        ? `您的服务状态已被管理员设置为「${statusLabel}」。原因：${reason}`
        : `您的服务状态已恢复为「${statusLabel}」。`;

      await tx.message.create({
        data: {
          staffAccountId: account.id,
          title: messageTitle,
          content: messageContent,
          messageType: 'system',
        },
      });
    });

    return {
      managementStatus: status,
      managementStatusLabel: statusLabel,
      managementReason: isRestrictive ? reason : null,
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
      managementStatus: item.listingStatus?.managementStatus ?? 'normal',
      managementStatusLabel: MANAGEMENT_STATUS_LABELS[item.listingStatus?.managementStatus ?? 'normal'],
      managementReason: item.listingStatus?.managementReason,
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

  async getSkillEntries(staffId: string) {
    const account = await this.getStaffAccount(staffId);
    const entries = await this.prisma.staffSkillEntry.findMany({
      where: { staffAccountId: account.id },
      include: {
        files: { include: { fileAsset: true } },
      },
      orderBy: { entryIndex: 'asc' },
    });

    const result: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const existing = entries.find((e) => e.entryIndex === i);
      if (existing) {
        result.push({
          id: existing.id,
          entryIndex: existing.entryIndex,
          skillName: existing.skillName,
          skillLevel: existing.skillLevel,
          workDurationMonths: existing.workDurationMonths,
          relatedServiceSkills: (existing.relatedServiceSkills as string[]) || [],
          files: existing.files.map((f) => ({
            id: f.id,
            fileAsset: {
              id: f.fileAsset.id,
              originalName: f.fileAsset.originalName,
              mimeType: f.fileAsset.mimeType,
              size: Number(f.fileAsset.size),
            },
          })),
        });
      } else {
        result.push({
          entryIndex: i,
          skillName: null,
          skillLevel: null,
          workDurationMonths: null,
          relatedServiceSkills: [],
          files: [],
        });
      }
    }
    return result;
  }

  async getIndependentSkills(staffId: string) {
    const account = await this.getStaffAccount(staffId);
    const skills = await this.prisma.staffIndependentSkill.findMany({
      where: { staffAccountId: account.id },
    });

    const INDEPENDENT_SKILL_LABELS: Record<string, string> = {
      cleaning: '保洁',
      cook: '厨师',
    };

    return {
      skills: ['cleaning', 'cook'].map((key) => {
        const existing = skills.find((s) => s.skillKey === key);
        return {
          skillKey: key,
          skillLabel: INDEPENDENT_SKILL_LABELS[key] || key,
          isSelected: existing ? existing.isSelected : false,
        };
      }),
    };
  }

  private async hasAnyCertificateSkillEntry(accountId: string): Promise<boolean> {
    const entries = await this.prisma.staffSkillEntry.findMany({
      where: {
        staffAccountId: accountId,
        skillName: { not: null },
      },
    });
    return entries.length > 0;
  }

  private async hasAnyIndependentSkillSelection(accountId: string): Promise<boolean> {
    const selectedCount = await this.prisma.staffIndependentSkill.count({
      where: {
        staffAccountId: accountId,
        isSelected: true,
      },
    });
    return selectedCount > 0;
  }

  private async loadCredentialFiles(credentialId: string) {
    return this.prisma.staffCredentialFile.findMany({
      where: { staffCredentialId: credentialId },
      select: { fileType: true },
    });
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
