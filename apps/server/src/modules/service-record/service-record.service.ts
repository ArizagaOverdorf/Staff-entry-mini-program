import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ServiceRecordListParams {
  page: number;
  pageSize: number;
  staffKeyword?: string;
  serviceProject?: string;
  dateFrom?: string;
  dateTo?: string;
  isDisputed?: boolean;
  staffId?: string;
}

export interface CreateServiceRecordInput {
  staffAccountId: string;
  serviceDate?: string;
  externalOrderNo?: string;
  serviceProject?: string;
  serviceAddress?: string;
  serviceDurationMinutes?: number;
  serviceAmount?: number;
  customerName?: string;
  serviceDesc?: string;
  rating?: number;
  isDisputed?: boolean;
  disputeResult?: string;
  disputeRemark?: string;
  recordSource?: string;
}

export interface UpdateServiceRecordInput {
  serviceDate?: string;
  externalOrderNo?: string;
  serviceProject?: string;
  serviceAddress?: string;
  serviceDurationMinutes?: number;
  serviceAmount?: number;
  customerName?: string;
  serviceDesc?: string;
  rating?: number;
  isDisputed?: boolean;
  disputeResult?: string;
  disputeRemark?: string;
}

@Injectable()
export class ServiceRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ServiceRecordListParams) {
    const { page, pageSize, staffKeyword, serviceProject, dateFrom, dateTo, isDisputed } = params;
    const where: Record<string, any> = {};

    if (staffKeyword) {
      where.staffAccount = {
        OR: [
          { staffId: { contains: staffKeyword } },
          { phoneMasked: { contains: staffKeyword } },
          {
            profile: {
              realNameMasked: { contains: staffKeyword },
            },
          },
        ],
      };
    }
    if (serviceProject) {
      where.serviceProject = { contains: serviceProject };
    }
    if (dateFrom || dateTo) {
      where.serviceDate = {};
      if (dateFrom) where.serviceDate.gte = new Date(dateFrom);
      if (dateTo) where.serviceDate.lte = new Date(dateTo);
    }
    if (isDisputed !== undefined && isDisputed !== null) {
      where.isDisputed = isDisputed;
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(pageSize, 100)
      : 10;

    const [total, items] = await Promise.all([
      this.prisma.staffServiceRecord.count({ where }),
      this.prisma.staffServiceRecord.findMany({
        where,
        include: {
          staffAccount: {
            select: {
              id: true,
              staffId: true,
              phoneMasked: true,
              profile: {
                select: { realNameMasked: true },
              },
            },
          },
        },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { serviceDate: 'desc' },
      }),
    ]);

    return {
      list: items.map((item) => this.formatRecord(item)),
      total,
    };
  }

  async listByAccount(accountId: string, page: number, pageSize: number) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(pageSize, 20)
      : 10;

    const where = { staffAccountId: accountId };

    const [total, items] = await Promise.all([
      this.prisma.staffServiceRecord.count({ where }),
      this.prisma.staffServiceRecord.findMany({
        where,
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { serviceDate: 'desc' },
      }),
    ]);

    return {
      list: items.map((item) => this.formatRecord(item)),
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }

  async findById(id: string) {
    const record = await this.prisma.staffServiceRecord.findUnique({
      where: { id },
      include: {
        staffAccount: {
          select: {
            id: true,
            staffId: true,
            phoneMasked: true,
            profile: {
              select: { realNameMasked: true },
            },
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Service record not found');
    return this.formatRecord(record);
  }

  async create(input: CreateServiceRecordInput) {
    const record = await this.prisma.staffServiceRecord.create({
      data: {
        staffAccountId: input.staffAccountId,
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : undefined,
        externalOrderNo: input.externalOrderNo,
        serviceProject: input.serviceProject,
        serviceAddress: input.serviceAddress,
        serviceDurationMinutes: input.serviceDurationMinutes,
        serviceAmount: input.serviceAmount,
        customerName: input.customerName,
        serviceDesc: input.serviceDesc,
        rating: input.rating,
        isDisputed: input.isDisputed ?? false,
        disputeResult: input.disputeResult,
        disputeRemark: input.disputeRemark,
        recordSource: input.recordSource ?? 'manual',
      },
    });
    return this.formatRecord(record);
  }

  async update(id: string, input: UpdateServiceRecordInput) {
    await this.findById(id);

    const data: Record<string, any> = {};
    if (input.serviceDate !== undefined) data.serviceDate = input.serviceDate ? new Date(input.serviceDate) : null;
    if (input.externalOrderNo !== undefined) data.externalOrderNo = input.externalOrderNo;
    if (input.serviceProject !== undefined) data.serviceProject = input.serviceProject;
    if (input.serviceAddress !== undefined) data.serviceAddress = input.serviceAddress;
    if (input.serviceDurationMinutes !== undefined) data.serviceDurationMinutes = input.serviceDurationMinutes;
    if (input.serviceAmount !== undefined) data.serviceAmount = input.serviceAmount;
    if (input.customerName !== undefined) data.customerName = input.customerName;
    if (input.serviceDesc !== undefined) data.serviceDesc = input.serviceDesc;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.isDisputed !== undefined) data.isDisputed = input.isDisputed;
    if (input.disputeResult !== undefined) data.disputeResult = input.disputeResult;
    if (input.disputeRemark !== undefined) data.disputeRemark = input.disputeRemark;

    const record = await this.prisma.staffServiceRecord.update({
      where: { id },
      data,
    });
    return this.formatRecord(record);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.staffServiceRecord.delete({ where: { id } });
    return { success: true };
  }

  private formatRecord(record: any) {
    return {
      id: record.id,
      staffAccountId: record.staffAccountId,
      staffId: record.staffAccount?.staffId,
      staffName: record.staffAccount?.profile?.realNameMasked ?? '-',
      staffPhone: record.staffAccount?.phoneMasked ?? '-',
      serviceDate: record.serviceDate?.toISOString?.() ?? record.serviceDate,
      externalOrderNo: record.externalOrderNo,
      serviceProject: record.serviceProject,
      serviceAddress: record.serviceAddress,
      serviceDurationMinutes: record.serviceDurationMinutes,
      serviceAmount: record.serviceAmount != null ? Number(record.serviceAmount) : undefined,
      amount: record.serviceAmount != null ? Number(record.serviceAmount) : undefined,
      customerName: record.customerName,
      serviceDesc: record.serviceDesc,
      rating: record.rating,
      isDisputed: record.isDisputed,
      disputeResult: record.disputeResult,
      disputeRemark: record.disputeRemark,
      recordSource: record.recordSource,
      createdAt: record.createdAt?.toISOString?.() ?? record.createdAt,
      updatedAt: record.updatedAt?.toISOString?.() ?? record.updatedAt,
    };
  }
}
