import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
      const intakeStatusMap: Record<string, string> = {
        pending: 'pending_review',
        info_required: 'needs_more_info',
      };
      where.intakeStatus = {
        intakeStatus: intakeStatusMap[intakeStatus] ?? intakeStatus,
      };
    }
    if (listingStatus) {
      const listingStatusMap: Record<string, string> = {
        listed: 'on',
        unlisted: 'off',
      };
      where.listingStatus = {
        listingStatus: listingStatusMap[listingStatus] ?? listingStatus,
      };
    }

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
            select: { intakeStatus: true },
          },
          listingStatus: {
            select: { listingStatus: true, isAvailable: true, pauseReason: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      list: items.map((item) => {
        const dbListingStatus = item.listingStatus?.listingStatus ?? 'offline';
        const listingStatusMap: Record<string, string> = {
          on: 'listed',
          offline: 'unlisted',
        };
        return {
          staffId: item.staffId,
          name: item.profile?.realNameMasked ?? item.wechatNickname ?? '-',
          phone: item.phoneMasked,
          gender: item.profile?.gender != null
            ? item.profile.gender === 1
              ? '男'
              : '女'
            : undefined,
          avatar: item.profile?.avatarUrl,
          intakeStatus: (() => {
            const s = item.intakeStatus?.intakeStatus ?? 'draft';
            const map: Record<string, string> = {
              pending_review: 'pending',
              needs_more_info: 'info_required',
            };
            return map[s] ?? s;
          })(),
          listingStatus: listingStatusMap[dbListingStatus] ?? dbListingStatus,
          isAvailable: item.listingStatus?.isAvailable ?? false,
          pauseReason: item.listingStatus?.pauseReason,
          createdAt: item.createdAt?.toISOString(),
        };
      }),
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
      },
    });
    if (!account) throw new NotFoundException('Staff not found');

    return {
      staffId: account.staffId,
      name: account.profile?.realNameMasked ?? account.wechatNickname ?? '-',
      phone: account.phoneMasked,
      nickname: account.wechatNickname,
      avatar: account.profile?.avatarUrl,
      gender: account.profile?.gender != null
        ? account.profile.gender === 1
          ? '男'
          : '女'
        : undefined,
      idNumber: account.profile?.idNumberMasked,
      address: account.profile?.address,
      emergencyContact: account.profile?.emergencyContactName,
      emergencyPhone: account.profile?.emergencyContactPhone,
      serviceCategories: account.skills.map((s) => s.categoryName),
      serviceAreas: account.serviceAreas.map(
        (a) => `${a.province} ${a.city} ${a.district ?? ''}`.trim(),
      ),
      intakeStatus: (() => {
        const s = account.intakeStatus?.intakeStatus ?? 'draft';
        const map: Record<string, string> = {
          pending_review: 'pending',
          needs_more_info: 'info_required',
        };
        return map[s] ?? s;
      })(),
      listingStatus: (() => {
        const s = account.listingStatus?.listingStatus ?? 'offline';
        const map: Record<string, string> = { on: 'listed', offline: 'unlisted' };
        return map[s] ?? s;
      })(),
      isAvailable: account.listingStatus?.isAvailable ?? false,
      pauseReason: account.listingStatus?.pauseReason,
      privacyAgreed: account.privacyAgreed,
      createdAt: account.createdAt?.toISOString(),
    };
  }

  async credentials(staffId: string) {
    const account = await this.prisma.staffAccount.findFirst({
      where: { staffId, deletedAt: null },
    });
    if (!account) throw new NotFoundException('Staff not found');

    const credentials = await this.prisma.staffCredential.findMany({
      where: { staffAccountId: account.id },
      include: { files: { include: { fileAsset: true } } },
      orderBy: [{ isCurrent: 'desc' }, { version: 'desc' }],
    });

    return credentials.map((c) => ({
      id: c.id,
      credentialType: c.credentialType,
      credentialName: c.credentialName,
      credentialNumber: c.credentialNumber,
      issuingAuthority: c.issuingAuthority,
      issueDate: c.issueDate?.toISOString?.() ?? c.issueDate,
      expiryDate: c.expiryDate?.toISOString?.() ?? c.expiryDate,
      status: c.credentialStatus,
      badge: c.credentialBadge,
      version: c.version,
      isCurrent: c.isCurrent,
      remark: c.remark,
      files: c.files.map((f) => ({
        id: f.id,
        fileType: f.fileType,
        fileAsset: {
          id: f.fileAsset.id,
          originalName: f.fileAsset.originalName,
          mimeType: f.fileAsset.mimeType,
          size: Number(f.fileAsset.size),
        },
      })),
    }));
  }
}
