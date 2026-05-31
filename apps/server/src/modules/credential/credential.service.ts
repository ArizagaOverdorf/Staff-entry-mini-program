import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';
import { CredentialType, CredentialTypeLabels, CREDENTIAL_TYPES_REQUIRE_EXPIRY, ALLOWED_SKILL_LEVELS, ALLOWED_SKILL_CERT_CATEGORY_IDS } from './credential.constants';
import { encrypt } from '../../utils/crypto.util';
import { maskIdNumber } from '../staff/staff.mask';

type StaffSkillCategoryInput = {
  categoryId: string;
  categoryName: string;
};

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
export class CredentialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listByAccount(accountId: string) {
    const credentials = await this.prisma.staffCredential.findMany({
      where: { staffAccountId: accountId },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: {
          include: { staffSkill: true },
        },
      },
      orderBy: [{ isCurrent: 'desc' }, { version: 'desc' }],
    });
    return { list: credentials.map((c) => this.formatCredential(c)) };
  }

  async findById(accountId: string, id: string) {
    const credential = await this.prisma.staffCredential.findFirst({
      where: { id, staffAccountId: accountId },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: {
          include: { staffSkill: true },
        },
      },
    });
    if (!credential) {
      throw new BadRequestException('Credential not found');
    }
    return this.formatCredential(credential);
  }

  async create(accountId: string, dto: UpsertCredentialDto) {
    const credentialType = dto.credentialType ?? dto.typeId;
    const credentialName = dto.credentialName ?? dto.name ?? dto.typeName;

    if (!credentialType) {
      throw new BadRequestException('credentialType is required');
    }
    if (!credentialName) {
      throw new BadRequestException('credentialName is required');
    }
    this.validateCredentialType(credentialType);
    this.validateExpiryDate(credentialType, dto.issueDate, dto.expiryDate ?? dto.expireDate);

    // Resolve files with optional side info
    const fileEntries = this.resolveFileEntries(dto);
    if (credentialType === 'id_card') {
      this.validateIdCardFiles(fileEntries);
      this.validateIdCardNumber(dto.credentialNumber);
    }
    if (credentialType === 'skill_cert') {
      this.validateSkillCert(dto, fileEntries);
    }

    const fileIds = fileEntries.map((e) => e.fileId);

    const staffSkillIds = await this.resolveSkillIdsForCredential(
      accountId,
      credentialType,
      dto,
    );

    const validatedFileIds = await this.assertFilesBelongToAccount(
      accountId,
      fileIds,
    );

    const credential = await this.prisma.$transaction(async (tx) => {
      // For skill_cert, allow multiple current credentials (different groups).
      // For non-skill_cert, keep one current per credential type.
      if (credentialType !== 'skill_cert') {
        await tx.staffCredential.updateMany({
          where: {
            staffAccountId: accountId,
            credentialType,
            isCurrent: true,
          },
          data: { isCurrent: false },
        });
      }

      // Sync ID number to profile when saving id_card
      if (credentialType === 'id_card' && dto.credentialNumber) {
        await this.syncProfileIdNumber(tx, accountId, dto.credentialNumber);
      }

      const created = await tx.staffCredential.create({
        data: {
          staffAccountId: accountId,
          credentialType,
          credentialGroupId: null, // will be set to own id below
          credentialName,
          credentialNumber: dto.credentialNumber,
          issuingAuthority: dto.issuingAuthority,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          expiryDate: dto.expiryDate
            ? new Date(dto.expiryDate)
            : dto.expireDate
              ? new Date(dto.expireDate)
              : undefined,
          credentialStatus: 'pending',
          skillLevel: dto.skillLevel,
          version: 1,
          isCurrent: true,
          remark: dto.remark,
        },
      });

      // Set credentialGroupId to own id for new credential groups
      await tx.staffCredential.update({
        where: { id: created.id },
        data: { credentialGroupId: created.id },
      });

      await this.createFileLinks(tx, created.id, fileEntries);

      if (staffSkillIds.length) {
        await this.createSkillLinks(tx, created.id, staffSkillIds);
      }

      await this.requireIntakeReviewAfterCredentialChange(tx, accountId);

      return created;
    });

    const created = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id: credential.id },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: { include: { staffSkill: true } },
      },
    });
    return this.formatCredential(created);
  }

  async update(accountId: string, id: string, dto: UpsertCredentialDto) {
    const credential = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id },
      include: { files: true },
    });
    if (credential.staffAccountId !== accountId) {
      throw new ForbiddenException('Access denied');
    }

    const credentialType =
      dto.credentialType ?? dto.typeId ?? credential.credentialType;
    const credentialName =
      dto.credentialName ?? dto.name ?? dto.typeName ?? credential.credentialName;
    const expiryDate = dto.expiryDate ?? dto.expireDate;
    const issueDate = dto.issueDate !== undefined ? dto.issueDate : credential.issueDate
      ? (credential.issueDate instanceof Date ? credential.issueDate.toISOString().slice(0, 10) : credential.issueDate)
      : undefined;

    this.validateCredentialType(credentialType);
    this.validateExpiryDate(credentialType, issueDate, expiryDate);
    if (credentialType !== credential.credentialType) {
      throw new BadRequestException(
        'credential type cannot be changed after creation',
      );
    }

    // Resolve files with optional side info
    let fileEntries = this.resolveFileEntries(dto);
    if (fileEntries.length === 0) {
      // Keep existing files if no new file list is provided
      fileEntries = credential.files.map((f) => ({
        fileId: f.fileAssetId,
        fileSide: f.fileType ?? 'credential_image',
      }));
    }
    if (credentialType === 'id_card') {
      this.validateIdCardFiles(fileEntries);
      this.validateIdCardNumber(
        dto.credentialNumber !== undefined
          ? dto.credentialNumber
          : credential.credentialNumber,
      );
    }
    if (credentialType === 'skill_cert') {
      const skillLevel =
        dto.skillLevel !== undefined ? dto.skillLevel : credential.skillLevel;
      this.validateSkillCert({ ...dto, skillLevel: skillLevel ?? undefined }, fileEntries);
    }

    const fileIds = fileEntries.map((e) => e.fileId);

    const staffSkillIds = await this.resolveSkillIdsForCredential(
      accountId,
      credentialType,
      dto,
    );

    const validatedFileIds = await this.assertFilesBelongToAccount(
      accountId,
      fileIds,
    );

    // Reuse existing credential group, or fall back to credential id for migration
    const groupId = credential.credentialGroupId || credential.id;
    const nextVersion = credential.version + 1;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Only mark credentials in the same group as not current
      await tx.staffCredential.updateMany({
        where: {
          staffAccountId: accountId,
          credentialGroupId: groupId,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      // Migration compatibility: older rows may not have credentialGroupId yet.
      if (!credential.credentialGroupId || credential.credentialType !== credentialType) {
        await tx.staffCredential.update({
          where: { id },
          data: { isCurrent: false },
        });
      }

      const created = await tx.staffCredential.create({
        data: {
          staffAccountId: accountId,
          credentialType,
          credentialGroupId: groupId,
          credentialName,
          credentialNumber:
            dto.credentialNumber !== undefined
              ? dto.credentialNumber
              : credential.credentialNumber,
          issuingAuthority:
            dto.issuingAuthority !== undefined
              ? dto.issuingAuthority
              : credential.issuingAuthority,
          issueDate:
            dto.issueDate !== undefined
              ? dto.issueDate
                ? new Date(dto.issueDate)
                : null
              : credential.issueDate,
          expiryDate:
            expiryDate !== undefined
              ? expiryDate
                ? new Date(expiryDate)
                : null
              : credential.expiryDate,
          credentialStatus: 'pending',
          credentialBadge: null,
          skillLevel:
            dto.skillLevel !== undefined
              ? dto.skillLevel
              : credential.skillLevel,
          version: nextVersion,
          isCurrent: true,
          remark: dto.remark !== undefined ? dto.remark : credential.remark,
        },
      });

      await this.createFileLinks(tx, created.id, fileEntries);

      if (staffSkillIds.length) {
        await this.createSkillLinks(tx, created.id, staffSkillIds);
      }

      // Sync ID number to profile when updating id_card
      const effectiveNumber =
        dto.credentialNumber !== undefined
          ? dto.credentialNumber
          : credential.credentialNumber;
      if (credentialType === 'id_card' && effectiveNumber) {
        await this.syncProfileIdNumber(tx, accountId, effectiveNumber);
      }

      await this.requireIntakeReviewAfterCredentialChange(tx, accountId);

      return created;
    });

    const current = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id: updated.id },
      include: {
        files: { include: { fileAsset: true } },
        credentialSkills: { include: { staffSkill: true } },
      },
    });
    return this.formatCredential(current);
  }

  async remove(accountId: string, id: string) {
    const credential = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id },
    });
    if (credential.staffAccountId !== accountId) {
      throw new ForbiddenException('Access denied');
    }
    await this.prisma.staffCredential.delete({ where: { id } });
  }

  private validateCredentialType(credentialType: string) {
    if (!Object.values(CredentialType).includes(credentialType as any)) {
      throw new BadRequestException(
        `Invalid credential type: ${credentialType}`,
      );
    }
  }

  private validateExpiryDate(
    credentialType: string,
    issueDate: string | undefined | null,
    expiryDate: string | undefined | null,
  ) {
    if (!CREDENTIAL_TYPES_REQUIRE_EXPIRY.includes(credentialType)) {
      return;
    }
    if (!issueDate) {
      throw new BadRequestException(
        `证件「${CredentialTypeLabels[credentialType] || credentialType}」需要填写生效日期`,
      );
    }
    if (isNaN(Date.parse(issueDate))) {
      throw new BadRequestException('生效日期格式无效');
    }
    if (!expiryDate) {
      throw new BadRequestException(
        `证件「${CredentialTypeLabels[credentialType] || credentialType}」需要填写有效期`,
      );
    }
    if (isNaN(Date.parse(expiryDate))) {
      throw new BadRequestException('有效期日期格式无效');
    }
    if (expiryDate < issueDate) {
      throw new BadRequestException('有效期至不能早于生效日期');
    }
  }

  private async resolveSkillIdsForCredential(
    accountId: string,
    credentialType: string,
    dto: UpsertCredentialDto,
  ) {
    const staffSkillIds = dto.staffSkillIds ?? [];
    const staffSkillCategories = dto.staffSkillCategories ?? [];

    if (
      credentialType !== 'skill_cert' &&
      (staffSkillIds.length || staffSkillCategories.length)
    ) {
      throw new BadRequestException(
        'staff skill association is only allowed for skill_cert credential type',
      );
    }

    if (credentialType !== 'skill_cert') {
      return [];
    }

    const resolvedIds = new Set<string>();

    if (staffSkillIds.length) {
      await this.assertSkillsBelongToAccount(accountId, staffSkillIds);
      const linkedSkills = await this.prisma.staffSkill.findMany({
        where: { id: { in: [...new Set(staffSkillIds)] } },
        select: { id: true, categoryId: true },
      });
      for (const skill of linkedSkills) {
        if (!(ALLOWED_SKILL_CERT_CATEGORY_IDS as readonly string[]).includes(skill.categoryId)) {
          throw new BadRequestException(
            `服务技能「${skill.categoryId}」不属于技能证书允许的服务类别，当前仅支持：${(ALLOWED_SKILL_CERT_CATEGORY_IDS as readonly string[]).join('、')}`,
          );
        }
        resolvedIds.add(skill.id);
      }
    }

    for (const category of staffSkillCategories) {
      if (!(ALLOWED_SKILL_CERT_CATEGORY_IDS as readonly string[]).includes(category.categoryId)) {
        throw new BadRequestException(
          `不支持的服务技能类别：${category.categoryId}，当前仅支持：${(ALLOWED_SKILL_CERT_CATEGORY_IDS as readonly string[]).join('、')}`,
        );
      }
      const skillId = await this.findOrCreateStaffSkill(
        accountId,
        category,
      );
      resolvedIds.add(skillId);
    }

    if (resolvedIds.size === 0) {
      throw new BadRequestException(
        'staff skill association is required for skill_cert: please select at least one service skill',
      );
    }

    return [...resolvedIds];
  }

  private async findOrCreateStaffSkill(
    accountId: string,
    category: StaffSkillCategoryInput,
  ) {
    if (!category.categoryId || !category.categoryName) {
      throw new BadRequestException(
        'staffSkillCategories must include categoryId and categoryName',
      );
    }

    const existing = await this.prisma.staffSkill.findFirst({
      where: {
        staffAccountId: accountId,
        categoryId: category.categoryId,
      },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.staffSkill.create({
      data: {
        staffAccountId: accountId,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      },
      select: { id: true },
    });

    return created.id;
  }

  private async assertSkillsBelongToAccount(
    accountId: string,
    skillIds: string[],
  ) {
    const uniqueIds = [...new Set(skillIds)];
    const skills = await this.prisma.staffSkill.findMany({
      where: { id: { in: uniqueIds }, staffAccountId: accountId },
      select: { id: true },
    });
    if (skills.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Some staffSkillIds are invalid or do not belong to your account',
      );
    }
  }

  private async getNextVersion(accountId: string, credentialType: string) {
    const latest = await this.prisma.staffCredential.findFirst({
      where: { staffAccountId: accountId, credentialType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return (latest?.version ?? 0) + 1;
  }

  private async assertFilesBelongToAccount(
    accountId: string,
    fileIds: string[],
  ) {
    const uniqueFileIds = [...new Set(fileIds)];
    if (uniqueFileIds.length === 0) {
      return [];
    }

    const fileAssets = await this.prisma.fileAsset.findMany({
      where: { id: { in: uniqueFileIds } },
      include: {
        credentialFiles: {
          include: {
            staffCredential: { select: { staffAccountId: true } },
          },
        },
      },
    });
    if (fileAssets.length !== uniqueFileIds.length) {
      throw new BadRequestException('Some file IDs are invalid');
    }

    const deniedFile = fileAssets.find((fileAsset) => {
      if (fileAsset.uploadedByStaffAccountId) {
        return fileAsset.uploadedByStaffAccountId !== accountId;
      }

      return !fileAsset.credentialFiles.some(
        (fileLink) => fileLink.staffCredential.staffAccountId === accountId,
      );
    });

    if (deniedFile) {
      throw new ForbiddenException('File does not belong to current account');
    }

    return uniqueFileIds;
  }

  private resolveFileEntries(
    dto: UpsertCredentialDto,
  ): { fileId: string; fileSide: string }[] {
    if (dto.files && dto.files.length > 0) {
      return dto.files.map((f) => ({
        fileId: f.fileId,
        fileSide: f.fileSide || 'credential_image',
      }));
    }
    if (dto.fileIds && dto.fileIds.length > 0) {
      return dto.fileIds.map((fid) => ({
        fileId: fid,
        fileSide: 'credential_image',
      }));
    }
    return [];
  }

  private validateIdCardFiles(
    entries: { fileId: string; fileSide: string }[],
  ) {
    if (entries.length < 2) {
      throw new BadRequestException(
        '居民身份证需要上传人像面和国徽面两张图片',
      );
    }
    const hasFront = entries.some((e) => e.fileSide === 'front');
    const hasBack = entries.some((e) => e.fileSide === 'back');
    if (!hasFront || !hasBack) {
      throw new BadRequestException(
        '居民身份证需要标注人像面(front)和国徽面(back)',
      );
    }
  }

  private validateIdCardNumber(credentialNumber: string | null | undefined) {
    if (!credentialNumber || !credentialNumber.trim()) {
      throw new BadRequestException('居民身份证需要填写身份证号');
    }
  }

  private validateSkillCert(
    dto: UpsertCredentialDto,
    fileEntries: { fileId: string; fileSide: string }[],
  ) {
    if (!fileEntries || fileEntries.length === 0) {
      throw new BadRequestException('技能证书需要上传证书图片');
    }
    if (!dto.skillLevel || !(ALLOWED_SKILL_LEVELS as readonly string[]).includes(dto.skillLevel)) {
      throw new BadRequestException(
        `技能等级无效，允许的等级：${(ALLOWED_SKILL_LEVELS as readonly string[]).join('、')}`,
      );
    }
  }

  private async syncProfileIdNumber(
    tx: any,
    accountId: string,
    idNumber: string,
  ) {
    const trimmed = idNumber.trim();
    if (!trimmed) return;

    const account = await tx.staffAccount.findUnique({
      where: { id: accountId },
      select: { staffId: true },
    });
    if (!account?.staffId) {
      throw new BadRequestException('Staff account not found, cannot sync profile ID number');
    }

    const encryptionKey = this.config.encryptionKey;
    await tx.staffProfile.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        staffId: account.staffId,
        idNumberEncrypted: encrypt(trimmed, encryptionKey),
        idNumberMasked: maskIdNumber(trimmed),
      },
      update: {
        idNumberEncrypted: encrypt(trimmed, encryptionKey),
        idNumberMasked: maskIdNumber(trimmed),
      },
    });
  }

  private async createFileLinks(
    tx: any,
    credentialId: string,
    fileEntries: { fileId: string; fileSide: string }[],
  ) {
    if (fileEntries.length === 0) {
      return;
    }

    await tx.staffCredentialFile.createMany({
      data: fileEntries.map((entry) => ({
        staffCredentialId: credentialId,
        fileAssetId: entry.fileId,
        fileType: entry.fileSide || 'credential_image',
      })),
    });
  }

  private async createSkillLinks(
    tx: any,
    credentialId: string,
    skillIds: string[],
  ) {
    const uniqueIds = [...new Set(skillIds)];
    await tx.staffCredentialSkill.createMany({
      data: uniqueIds.map((skillId) => ({
        staffCredentialId: credentialId,
        staffSkillId: skillId,
      })),
    });
  }

  private async requireIntakeReviewAfterCredentialChange(
    tx: any,
    accountId: string,
  ) {
    const intakeStatus = await tx.staffIntakeStatus.findUnique({
      where: { staffAccountId: accountId },
      select: { intakeStatus: true },
    });

    if (intakeStatus?.intakeStatus !== 'approved') {
      return;
    }

    await tx.staffIntakeStatus.update({
      where: { staffAccountId: accountId },
      data: {
        intakeStatus: 'pending_review',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewRemark: '证件资料已更新，需重新审核后恢复正常状态',
      },
    });

    await tx.staffListingStatus.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        listingStatus: 'off',
        isAvailable: false,
        pauseReason: 'credential_updated_pending_review',
        pausedAt: new Date(),
      },
      update: {
        listingStatus: 'off',
        isAvailable: false,
        pauseReason: 'credential_updated_pending_review',
        pausedAt: new Date(),
      },
    });
  }

  private formatCredential(c: any) {
    const expiryDate = c.expiryDate
      ? new Date(c.expiryDate).toISOString().slice(0, 10)
      : undefined;
    const isExpired = isDateBeforeToday(expiryDate);
    const expiryStatusLabel = isExpired ? '证件过期' : undefined;
    const badge = isExpired ? 'expired' : (c.credentialBadge ?? null);

    const linkedSkills = (c.credentialSkills || []).map((cs: any) => ({
      id: cs.staffSkill?.id ?? cs.staffSkillId,
      categoryId: cs.staffSkill?.categoryId,
      categoryName: cs.staffSkill?.categoryName,
    }));

    return {
      id: c.id,
      name: c.credentialName,
      typeId: c.credentialType,
      typeName: CredentialTypeLabels[c.credentialType] ?? c.credentialType,
      credentialNumber: c.credentialNumber,
      issuingAuthority: c.issuingAuthority,
      issueDate: c.issueDate
        ? new Date(c.issueDate).toISOString().slice(0, 10)
        : undefined,
      expiryDate,
      expireDate: expiryDate,
      status: c.credentialStatus,
      badge,
      isExpired,
      expiryStatusLabel,
      credentialGroupId: c.credentialGroupId,
      skillLevel: c.skillLevel,
      version: c.version,
      isCurrent: c.isCurrent,
      remark: c.remark,
      fileUrl: c.files?.[0]?.fileAsset?.id
        ? `/api/app/files/${c.files[0].fileAsset.id}/preview`
        : undefined,
      fileSide: c.files?.[0]?.fileType ?? undefined,
      files: (c.files || []).map((f: any) => ({
        id: f.id,
        fileType: f.fileType,
        fileSide: f.fileType,
        fileAsset: {
          id: f.fileAsset.id,
          originalName: f.fileAsset.originalName,
          mimeType: f.fileAsset.mimeType,
          size: Number(f.fileAsset.size),
        },
      })),
      linkedSkills,
      staffSkillIds: linkedSkills.map((s: any) => s.id),
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    };
  }
}
