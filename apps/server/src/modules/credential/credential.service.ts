import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';
import { UpsertSkillEntryDto, UpsertIndependentSkillsDto } from './dto/skill-entry.dto';
import {
  CredentialType,
  CredentialTypeLabels,
  CREDENTIAL_TYPES_REQUIRE_ISSUE_DATE,
  CREDENTIAL_TYPES_REQUIRE_EXPIRY,
  ALLOWED_SKILL_LEVELS,
  ALLOWED_SKILL_CERT_CATEGORY_IDS,
  INDEPENDENT_SKILL_KEYS,
  INDEPENDENT_SKILL_LABELS,
  CERTIFICATE_SKILL_NAMES,
  RELATED_SERVICE_SKILLS,
} from './credential.constants';
import { encrypt } from '../../utils/crypto.util';
import { maskIdNumber, parseIdCardBirthday } from '../../utils/mask.util';

type StaffSkillCategoryInput = {
  categoryId: string;
  categoryName: string;
};

const CREDENTIAL_IMAGE_REQUIRED_TYPES = [
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
  'insurance',
  'education',
  'student_card',
  'other',
];

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
    this.validateIssueDate(credentialType, dto.issueDate);
    this.validateExpiryDate(credentialType, dto.issueDate, dto.expiryDate ?? dto.expireDate);

    // Resolve files with optional side info
    const fileEntries = this.resolveFileEntries(dto);
    if (credentialType === 'id_card') {
      this.validateIdCardFiles(fileEntries);
      this.validateIdCardNumber(dto.credentialNumber);
    }
    if (credentialType === 'insurance') {
      this.validateInsuranceFields(dto.credentialNumber, dto.issuingAuthority);
    }
    if (credentialType === 'skill_cert') {
      this.validateSkillCert(dto, fileEntries);
    }
    this.validateRequiredCredentialImage(credentialType, fileEntries);

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
    this.validateIssueDate(credentialType, issueDate);
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
    if (credentialType === 'insurance') {
      this.validateInsuranceFields(
        dto.credentialNumber !== undefined
          ? dto.credentialNumber
          : credential.credentialNumber,
        dto.issuingAuthority !== undefined
          ? dto.issuingAuthority
          : credential.issuingAuthority,
      );
    }
    if (credentialType === 'skill_cert') {
      const skillLevel =
        dto.skillLevel !== undefined ? dto.skillLevel : credential.skillLevel;
      this.validateSkillCert({ ...dto, skillLevel: skillLevel ?? undefined }, fileEntries);
    }
    this.validateRequiredCredentialImage(credentialType, fileEntries);

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

  // ============================================================
  // Independent skill toggles (保洁 / 厨师)
  // ============================================================

  async getIndependentSkills(accountId: string) {
    const skills = await this.prisma.staffIndependentSkill.findMany({
      where: { staffAccountId: accountId },
    });
    const result: Record<string, boolean> = {};
    for (const key of INDEPENDENT_SKILL_KEYS) {
      const existing = skills.find((s) => s.skillKey === key);
      result[key] = existing ? existing.isSelected : false;
    }
    return {
      skills: Object.entries(result).map(([skillKey, isSelected]) => ({
        skillKey,
        skillLabel: INDEPENDENT_SKILL_LABELS[skillKey] || skillKey,
        isSelected,
      })),
    };
  }

  async upsertIndependentSkills(accountId: string, dto: UpsertIndependentSkillsDto) {
    for (const item of dto.skills) {
      if (!(INDEPENDENT_SKILL_KEYS as readonly string[]).includes(item.skillKey)) {
        throw new BadRequestException(`Invalid independent skill key: ${item.skillKey}`);
      }
      await this.prisma.staffIndependentSkill.upsert({
        where: {
          staffAccountId_skillKey: {
            staffAccountId: accountId,
            skillKey: item.skillKey,
          },
        },
        create: {
          staffAccountId: accountId,
          skillKey: item.skillKey,
          isSelected: item.isSelected,
        },
        update: {
          isSelected: item.isSelected,
        },
      });
    }
    return this.getIndependentSkills(accountId);
  }

  // ============================================================
  // Certificate-backed skill entries (技能一 / 技能二 / 技能三)
  // ============================================================

  async getSkillEntries(accountId: string) {
    const entries = await this.prisma.staffSkillEntry.findMany({
      where: { staffAccountId: accountId },
      include: {
        files: { include: { fileAsset: true } },
      },
      orderBy: { entryIndex: 'asc' },
    });

    // Ensure all 3 slots always exist
    const result: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const existing = entries.find((e) => e.entryIndex === i);
      if (existing) {
        result.push(this.formatSkillEntry(existing));
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
    return { entries: result };
  }

  async upsertSkillEntry(accountId: string, dto: UpsertSkillEntryDto) {
    const { entryIndex, skillName, skillLevel, workDurationMonths, relatedServiceSkills, files, fileIds } = dto;

    if (entryIndex < 1 || entryIndex > 3) {
      throw new BadRequestException('entryIndex must be 1, 2, or 3');
    }

    const isFilled = !!(skillName && skillName.trim());

    if (isFilled) {
      this.validateSkillEntry(dto);
    }

    // Resolve file entries
    const fileEntries = this.resolveSkillEntryFiles(dto);
    if (isFilled && fileEntries.length === 0) {
      throw new BadRequestException('证书图片为必填项，请上传1-3张证书图片');
    }
    if (fileEntries.length > 3) {
      throw new BadRequestException('最多上传3张证书图片');
    }

    const fileIdsToValidate = fileEntries.map((e) => e.fileId);
    if (fileIdsToValidate.length > 0) {
      await this.assertFilesBelongToAccount(accountId, fileIdsToValidate);
    }

    // Check duplicate skill names across entries
    if (isFilled && skillName) {
      const existingEntries = await this.prisma.staffSkillEntry.findMany({
        where: {
          staffAccountId: accountId,
          entryIndex: { not: entryIndex },
          skillName: { not: null },
        },
      });
      const duplicates = existingEntries.filter((e) => e.skillName === skillName.trim());
      if (duplicates.length > 0) {
        throw new BadRequestException(`技能名称「${skillName}」已在其他技能条目中使用，请选择不同的技能名称`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.staffSkillEntry.upsert({
        where: {
          staffAccountId_entryIndex: {
            staffAccountId: accountId,
            entryIndex,
          },
        },
        create: {
          staffAccountId: accountId,
          entryIndex,
          skillName: isFilled ? skillName!.trim() : null,
          skillLevel: isFilled ? (skillLevel || null) : null,
          workDurationMonths: isFilled ? (workDurationMonths || null) : null,
          relatedServiceSkills: isFilled && relatedServiceSkills?.length
            ? relatedServiceSkills
            : [],
        },
        update: {
          skillName: isFilled ? skillName!.trim() : null,
          skillLevel: isFilled ? (skillLevel || null) : null,
          workDurationMonths: isFilled ? (workDurationMonths || null) : null,
          relatedServiceSkills: isFilled && relatedServiceSkills?.length
            ? relatedServiceSkills
            : [],
        },
      });

      // Replace files
      await tx.staffSkillEntryFile.deleteMany({
        where: { staffSkillEntryId: entry.id },
      });
      if (fileEntries.length > 0) {
        await tx.staffSkillEntryFile.createMany({
          data: fileEntries.map((fe) => ({
            staffSkillEntryId: entry.id,
            fileAssetId: fe.fileId,
          })),
        });
      }

      await this.requireIntakeReviewAfterCredentialChange(tx, accountId);

      return entry;
    });

    const fullEntry = await this.prisma.staffSkillEntry.findUniqueOrThrow({
      where: { id: updated.id },
      include: { files: { include: { fileAsset: true } } },
    });
    return this.formatSkillEntry(fullEntry);
  }

  private validateSkillEntry(dto: UpsertSkillEntryDto) {
    const { skillName, skillLevel, workDurationMonths } = dto;

    if (!skillName || !skillName.trim()) {
      throw new BadRequestException('技能名称为必填项');
    }
    if (!(CERTIFICATE_SKILL_NAMES as readonly string[]).includes(skillName.trim())) {
      throw new BadRequestException(`无效的技能名称: ${skillName}`);
    }
    if (!skillLevel || !(ALLOWED_SKILL_LEVELS as readonly string[]).includes(skillLevel)) {
      throw new BadRequestException(
        `技能等级无效，允许的等级：${(ALLOWED_SKILL_LEVELS as readonly string[]).join('、')}`,
      );
    }
    if (!workDurationMonths || workDurationMonths < 1 || !Number.isInteger(workDurationMonths)) {
      throw new BadRequestException('相关工作时长必须为正整数（月）');
    }
    if (dto.relatedServiceSkills?.length) {
      for (const s of dto.relatedServiceSkills) {
        if (!(RELATED_SERVICE_SKILLS as readonly string[]).includes(s)) {
          throw new BadRequestException(`无效的关联服务技能: ${s}`);
        }
      }
    }
  }

  private resolveSkillEntryFiles(dto: UpsertSkillEntryDto): { fileId: string }[] {
    if (dto.files && dto.files.length > 0) {
      return dto.files.map((f) => ({ fileId: f.fileId }));
    }
    if (dto.fileIds && dto.fileIds.length > 0) {
      return dto.fileIds.map((fid) => ({ fileId: fid }));
    }
    return [];
  }

  async hasAnyCertificateBackedSkillEntry(accountId: string): Promise<boolean> {
    const entries = await this.prisma.staffSkillEntry.findMany({
      where: {
        staffAccountId: accountId,
        skillName: { not: null },
      },
    });
    return entries.length > 0;
  }

  private formatSkillEntry(entry: any) {
    return {
      id: entry.id,
      entryIndex: entry.entryIndex,
      skillName: entry.skillName,
      skillLevel: entry.skillLevel,
      workDurationMonths: entry.workDurationMonths,
      relatedServiceSkills: (entry.relatedServiceSkills as string[]) || [],
      files: (entry.files || []).map((f: any) => ({
        id: f.id,
        fileAsset: {
          id: f.fileAsset.id,
          originalName: f.fileAsset.originalName,
          mimeType: f.fileAsset.mimeType,
          size: Number(f.fileAsset.size),
        },
      })),
    };
  }

  // ============================================================
  // Private helpers
  // ============================================================

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
    const issueDateLabel = credentialType === 'insurance' ? '生效日期' : '签发日期';
    if (!issueDate) {
      throw new BadRequestException(
        `证件「${CredentialTypeLabels[credentialType] || credentialType}」需要填写${issueDateLabel}`,
      );
    }
    if (isNaN(Date.parse(issueDate))) {
      throw new BadRequestException(`${issueDateLabel}格式无效`);
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
      throw new BadRequestException(`有效期至不能早于${issueDateLabel}`);
    }
  }

  private validateIssueDate(
    credentialType: string,
    issueDate: string | undefined | null,
  ) {
    if (!CREDENTIAL_TYPES_REQUIRE_ISSUE_DATE.includes(credentialType)) {
      return;
    }
    if (!issueDate) {
      throw new BadRequestException(
        `证件「${CredentialTypeLabels[credentialType] || credentialType}」需要填写签发日期`,
      );
    }
    if (isNaN(Date.parse(issueDate))) {
      throw new BadRequestException('签发日期格式无效');
    }
  }

  private validateInsuranceFields(
    credentialNumber: string | undefined | null,
    issuingAuthority: string | undefined | null,
  ) {
    if (!credentialNumber || !credentialNumber.trim()) {
      throw new BadRequestException('保险需要填写保险单号');
    }
    if (!issuingAuthority || !issuingAuthority.trim()) {
      throw new BadRequestException('保险需要选择或填写保险公司');
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

  private validateRequiredCredentialImage(
    credentialType: string,
    fileEntries: { fileId: string; fileSide: string }[],
  ) {
    if (
      CREDENTIAL_IMAGE_REQUIRED_TYPES.includes(credentialType) &&
      (!fileEntries || fileEntries.length === 0)
    ) {
      const label = CredentialTypeLabels[credentialType] ?? credentialType;
      throw new BadRequestException(`${label}需要上传证件图片`);
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
    const birthday = parseIdCardBirthday(trimmed);

    await tx.staffProfile.upsert({
      where: { staffAccountId: accountId },
      create: {
        staffAccountId: accountId,
        staffId: account.staffId,
        idNumberEncrypted: encrypt(trimmed, encryptionKey),
        idNumberMasked: maskIdNumber(trimmed),
        birthday: birthday ? new Date(birthday) : undefined,
      },
      update: {
        idNumberEncrypted: encrypt(trimmed, encryptionKey),
        idNumberMasked: maskIdNumber(trimmed),
        birthday: birthday ? new Date(birthday) : undefined,
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
