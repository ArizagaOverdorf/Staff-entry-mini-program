import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UpdateServiceAreasDto } from './dto/update-service-areas.dto';
import { maskPhone, maskIdNumber, maskName } from './staff.mask';
import { encrypt, decrypt } from '../../utils/crypto.util';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getProfile(accountId: string, staffId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { id: accountId },
      include: { profile: true, skills: true, serviceAreas: true },
    });
    if (!account) throw new NotFoundException('Staff not found');

    const encryptionKey = this.config.encryptionKey;
    const profile = account.profile as any;

    return {
      staffId: account.staffId,
      phone: account.phoneMasked,
      phoneFull: account.phoneEncrypted
        ? decrypt(account.phoneEncrypted, encryptionKey)
        : undefined,
      nickname: account.wechatNickname,
      profile: profile
        ? {
            name: profile.realNameEncrypted
              ? decrypt(profile.realNameEncrypted, encryptionKey)
              : undefined,
            nameMasked: profile.realNameMasked,
            idNumber: profile.idNumberEncrypted
              ? decrypt(profile.idNumberEncrypted, encryptionKey)
              : undefined,
            idNumberMasked: profile.idNumberMasked,
            // Reserved for Alibaba Cloud / Tencent Cloud real-name verification integration.
            identityVerified: !!profile.identityVerified,
            identityVerifyProvider: profile.identityVerifyProvider,
            identityVerifiedAt: profile.identityVerifiedAt,
            gender: profile.gender != null
              ? profile.gender === 1 ? 'male' : 'female'
              : undefined,
            birthday: profile.birthday
              ? profile.birthday.toISOString().slice(0, 10)
              : undefined,
            avatarUrl: profile.avatarUrl,
            address: profile.address,
            emergencyContact: profile.emergencyContactName,
            emergencyPhone: profile.emergencyContactPhone,
            serviceCategories: account.skills.map((s) => ({
              id: s.id,
              categoryId: s.categoryId,
              categoryName: s.categoryName,
              skillLevel: s.skillLevel,
              description: s.description,
            })),
            serviceAreas: account.serviceAreas.map((a) => ({
              province: a.province,
              city: a.city,
              district: a.district,
            })),
          }
        : null,
    };
  }

  async updateProfile(
    accountId: string,
    staffId: string,
    dto: UpdateProfileDto,
  ) {
    const encryptionKey = this.config.encryptionKey;
    const realName = dto.realName ?? dto.name;
    const emergencyContactName = dto.emergencyContactName ?? dto.emergencyContact;
    const emergencyContactPhone = dto.emergencyContactPhone ?? dto.emergencyPhone;

    const profileData: Record<string, any> = {};

    if (realName !== undefined) {
      profileData.realNameEncrypted = realName
        ? encrypt(realName, encryptionKey)
        : null;
      profileData.realNameMasked = realName ? maskName(realName) : null;
    }
    if (dto.idNumber !== undefined) {
      profileData.idNumberEncrypted = dto.idNumber
        ? encrypt(dto.idNumber, encryptionKey)
        : null;
      profileData.idNumberMasked = dto.idNumber
        ? maskIdNumber(dto.idNumber)
        : null;
    }
    if (dto.gender !== undefined) {
      profileData.gender = dto.gender === 'male' ? 1 : dto.gender === 'female' ? 2 : parseInt(dto.gender, 10) || null;
    }
    if (dto.birthday !== undefined)
      profileData.birthday = dto.birthday ? new Date(dto.birthday) : null;
    if (dto.avatarUrl !== undefined) profileData.avatarUrl = dto.avatarUrl;
    if (dto.address !== undefined) profileData.address = dto.address;

    // Promote avatar file to public so miniapp public-preview endpoint can serve it.
    if (dto.avatarUrl && !dto.avatarUrl.startsWith('http://') && !dto.avatarUrl.startsWith('https://')) {
      await this.prisma.fileAsset.updateMany({
        where: {
          id: dto.avatarUrl,
          uploadedByStaffAccountId: accountId,
        },
        data: { accessLevel: 'public' },
      });
    }

    if (emergencyContactName !== undefined)
      profileData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined)
      profileData.emergencyContactPhone = emergencyContactPhone;

    const result = await this.prisma.staffProfile.upsert({
      where: { staffAccountId: accountId },
      create: { ...profileData, staffAccountId: accountId, staffId },
      update: profileData,
    }) as any;

    return {
      name: result.realNameEncrypted
        ? decrypt(result.realNameEncrypted, encryptionKey)
        : undefined,
      nameMasked: result.realNameMasked,
      idNumber: result.idNumberEncrypted
        ? decrypt(result.idNumberEncrypted, encryptionKey)
        : undefined,
      idNumberMasked: result.idNumberMasked,
      identityVerified: result.identityVerified,
      identityVerifyProvider: result.identityVerifyProvider,
      identityVerifiedAt: result.identityVerifiedAt,
      gender: result.gender != null
        ? result.gender === 1 ? 'male' : 'female'
        : undefined,
      birthday: result.birthday
        ? result.birthday.toISOString().slice(0, 10)
        : undefined,
      avatarUrl: result.avatarUrl,
      address: result.address,
      emergencyContact: result.emergencyContactName,
      emergencyPhone: result.emergencyContactPhone,
    };
  }

  async updateSkills(accountId: string, dto: UpdateSkillsDto) {
    await this.prisma.staffSkill.deleteMany({
      where: { staffAccountId: accountId },
    });
    if (dto.skills.length > 0) {
      await this.prisma.staffSkill.createMany({
        data: dto.skills.map((s) => ({
          staffAccountId: accountId,
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          skillLevel: s.skillLevel,
          description: s.description,
        })),
      });
    }
    return this.prisma.staffSkill.findMany({
      where: { staffAccountId: accountId },
    });
  }

  async updateServiceAreas(accountId: string, dto: UpdateServiceAreasDto) {
    await this.prisma.staffServiceArea.deleteMany({
      where: { staffAccountId: accountId },
    });
    if (dto.areas.length > 0) {
      await this.prisma.staffServiceArea.createMany({
        data: dto.areas.map((a) => ({
          staffAccountId: accountId,
          province: a.province,
          city: a.city,
          district: a.district,
        })),
      });
    }
    return this.prisma.staffServiceArea.findMany({
      where: { staffAccountId: accountId },
    });
  }
}
