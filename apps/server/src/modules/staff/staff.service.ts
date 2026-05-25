import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UpdateServiceAreasDto } from './dto/update-service-areas.dto';
import { maskPhone, maskIdNumber, maskName } from './staff.mask';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(staffId: string) {
    const account = await this.prisma.staffAccount.findUnique({
      where: { staffId },
      include: { profile: true, skills: true, serviceAreas: true },
    });
    if (!account) throw new NotFoundException('Staff not found');
    return {
      staffId: account.staffId,
      phone: account.phoneMasked,
      nickname: account.wechatNickname,
      profile: account.profile
        ? {
            realName: account.profile.realNameMasked,
            idNumber: account.profile.idNumberMasked,
            gender: account.profile.gender,
            birthday: account.profile.birthday,
            avatarUrl: account.profile.avatarUrl,
            address: account.profile.address,
            emergencyContactName: account.profile.emergencyContactName,
            emergencyContactPhone: account.profile.emergencyContactPhone,
          }
        : null,
      skills: account.skills,
      serviceAreas: account.serviceAreas,
    };
  }

  async updateProfile(staffId: string, dto: UpdateProfileDto) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    const profileData = {
      realNameEncrypted: dto.realName,
      realNameMasked: dto.realName ? maskName(dto.realName) : undefined,
      idNumberEncrypted: dto.idNumber,
      idNumberMasked: dto.idNumber ? maskIdNumber(dto.idNumber) : undefined,
      gender: dto.gender,
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      avatarUrl: dto.avatarUrl,
      address: dto.address,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
    };
    return this.prisma.staffProfile.upsert({
      where: { staffAccountId: account.id },
      create: { ...profileData, staffAccountId: account.id, staffId: account.staffId },
      update: profileData,
    });
  }

  async updateSkills(staffId: string, dto: UpdateSkillsDto) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    await this.prisma.staffSkill.deleteMany({ where: { staffAccountId: account.id } });
    if (dto.skills.length > 0) {
      await this.prisma.staffSkill.createMany({
        data: dto.skills.map((s) => ({
          staffAccountId: account.id,
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          skillLevel: s.skillLevel,
          description: s.description,
        })),
      });
    }
    return this.prisma.staffSkill.findMany({ where: { staffAccountId: account.id } });
  }

  async updateServiceAreas(staffId: string, dto: UpdateServiceAreasDto) {
    const account = await this.prisma.staffAccount.findUniqueOrThrow({ where: { staffId } });
    await this.prisma.staffServiceArea.deleteMany({ where: { staffAccountId: account.id } });
    if (dto.areas.length > 0) {
      await this.prisma.staffServiceArea.createMany({
        data: dto.areas.map((a) => ({
          staffAccountId: account.id,
          province: a.province,
          city: a.city,
          district: a.district,
        })),
      });
    }
    return this.prisma.staffServiceArea.findMany({ where: { staffAccountId: account.id } });
  }
}
