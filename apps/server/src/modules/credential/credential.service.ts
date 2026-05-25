import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';
import { CredentialType, CredentialTypeLabels } from './credential.constants';

@Injectable()
export class CredentialService {
  constructor(private readonly prisma: PrismaService) {}

  async listByAccount(accountId: string) {
    const credentials = await this.prisma.staffCredential.findMany({
      where: { staffAccountId: accountId },
      include: { files: { include: { fileAsset: true } } },
      orderBy: [{ isCurrent: 'desc' }, { version: 'desc' }],
    });
    return { list: credentials.map((c) => this.formatCredential(c)) };
  }

  async create(accountId: string, dto: UpsertCredentialDto) {
    const credentialType = dto.credentialType ?? dto.typeId;
    const credentialName = dto.credentialName ?? dto.name ?? dto.typeName;
    const expiryDate = dto.expiryDate ?? dto.expireDate;

    if (!credentialType) {
      throw new BadRequestException('credentialType is required');
    }
    if (!credentialName) {
      throw new BadRequestException('credentialName is required');
    }
    this.validateCredentialType(credentialType);

    const fileIds = await this.assertFilesBelongToAccount(
      accountId,
      dto.fileIds ?? [],
    );
    const nextVersion = await this.getNextVersion(accountId, credentialType);

    const credential = await this.prisma.$transaction(async (tx) => {
      await tx.staffCredential.updateMany({
        where: {
          staffAccountId: accountId,
          credentialType,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      const created = await tx.staffCredential.create({
        data: {
          staffAccountId: accountId,
          credentialType,
          credentialName,
          credentialNumber: dto.credentialNumber,
          issuingAuthority: dto.issuingAuthority,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          credentialStatus: 'pending',
          version: nextVersion,
          isCurrent: true,
          remark: dto.remark,
        },
      });

      await this.createFileLinks(tx, created.id, fileIds);

      return created;
    });

    const created = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id: credential.id },
      include: { files: { include: { fileAsset: true } } },
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

    const fileIds = await this.assertFilesBelongToAccount(
      accountId,
      dto.fileIds ?? credential.files.map((file) => file.fileAssetId),
    );
    const nextVersion = await this.getNextVersion(accountId, credentialType);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.staffCredential.updateMany({
        where: {
          staffAccountId: accountId,
          credentialType,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      if (credential.credentialType !== credentialType) {
        await tx.staffCredential.update({
          where: { id },
          data: { isCurrent: false },
        });
      }

      const created = await tx.staffCredential.create({
        data: {
          staffAccountId: accountId,
          credentialType,
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
          version: nextVersion,
          isCurrent: true,
          remark: dto.remark !== undefined ? dto.remark : credential.remark,
        },
      });

      await this.createFileLinks(tx, created.id, fileIds);

      return created;
    });

    const current = await this.prisma.staffCredential.findUniqueOrThrow({
      where: { id: updated.id },
      include: { files: { include: { fileAsset: true } } },
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

  private formatCredential(c: any) {
    const expiryDate = c.expiryDate
      ? new Date(c.expiryDate).toISOString().slice(0, 10)
      : undefined;
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
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    };
  }
}
