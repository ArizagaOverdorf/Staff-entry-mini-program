import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';

@Injectable()
export class CredentialService {
  constructor(private readonly prisma: PrismaService) {}

  async listByStaff(staffId: string) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    return this.prisma.staffCredential.findMany({
      where: { staffAccountId: account.id },
      include: { files: { include: { fileAsset: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(staffId: string, dto: UpsertCredentialDto) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    return this.prisma.staffCredential.create({
      data: {
        staffAccountId: account.id,
        credentialType: dto.credentialType,
        credentialName: dto.credentialName,
        credentialNumber: dto.credentialNumber,
        issuingAuthority: dto.issuingAuthority,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async update(id: string, dto: UpsertCredentialDto) {
    const credential = await this.prisma.staffCredential.findUniqueOrThrow({ where: { id } });
    return this.prisma.staffCredential.update({
      where: { id },
      data: {
        credentialType: dto.credentialType,
        credentialName: dto.credentialName,
        credentialNumber: dto.credentialNumber,
        issuingAuthority: dto.issuingAuthority,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.staffCredential.findUniqueOrThrow({ where: { id } });
    await this.prisma.staffCredential.delete({ where: { id } });
  }
}
