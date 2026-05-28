import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';
import { CredentialType, CredentialTypeLabels } from './credential.constants';

type StaffSkillCategoryInput = {
  categoryId: string;
  categoryName: string;
};

@Injectable()
export class CredentialService {
  constructor(private readonly prisma: PrismaService) {}

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
    const staffSkillIds = await this.resolveSkillIdsForCredential(
      accountId,
      credentialType,
      dto,
    );

    const fileIds = await this.assertFilesBelongToAccount(
      accountId,
      dto.fileIds ?? [],
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

      await this.createFileLinks(tx, created.id, fileIds);

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

    this.validateCredentialType(credentialType);
    if (credentialType !== credential.credentialType) {
      throw new BadRequestException(
        'credential type cannot be changed after creation',
      );
    }
    const staffSkillIds = await this.resolveSkillIdsForCredential(
      accountId,
      credentialType,
      dto,
    );

    const fileIds = await this.assertFilesBelongToAccount(
      accountId,
      dto.fileIds ?? credential.files.map((file) => file.fileAssetId),
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

      await this.createFileLinks(tx, created.id, fileIds);

      if (staffSkillIds.length) {
        await this.createSkillLinks(tx, created.id, staffSkillIds);
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
      staffSkillIds.forEach((id) => resolvedIds.add(id));
    }

    for (const category of staffSkillCategories) {
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

  private async createFileLinks(
    tx: any,
    credentialId: string,
    fileIds: string[],
  ) {
    if (fileIds.length === 0) {
      return;
    }

    await tx.staffCredentialFile.createMany({
      data: fileIds.map((fileId) => ({
        staffCredentialId: credentialId,
        fileAssetId: fileId,
        fileType: 'credential_image',
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
      badge: c.credentialBadge,
      credentialGroupId: c.credentialGroupId,
      skillLevel: c.skillLevel,
      version: c.version,
      isCurrent: c.isCurrent,
      remark: c.remark,
      fileUrl: c.files?.[0]?.fileAsset?.id
        ? `/api/app/files/${c.files[0].fileAsset.id}/preview`
        : undefined,
      files: (c.files || []).map((f: any) => ({
        id: f.id,
        fileType: f.fileType,
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
