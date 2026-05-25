import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryDictDto } from './dto/query-dict.dto';
import { CreateDictItemDto } from './dto/create-dict-item.dto';
import { UpdateDictItemDto } from './dto/update-dict-item.dto';

export interface DictTreeNode {
  id: string;
  dictGroup: string;
  dictKey: string;
  dictValue: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  remark: string | null;
  children?: DictTreeNode[];
}

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryDictDto) {
    const where: any = {};
    if (query.dictGroup) where.dictGroup = query.dictGroup;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.dictItem.findMany({
      where,
      orderBy: [{ dictGroup: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getForApp(groups?: string) {
    const groupList = groups
      ? groups.split(',').map((g) => g.trim()).filter(Boolean)
      : undefined;

    const where: any = { isActive: true };
    if (groupList?.length) where.dictGroup = { in: groupList };

    const items = await this.prisma.dictItem.findMany({
      where,
      orderBy: [{ dictGroup: 'asc' }, { sortOrder: 'asc' }],
    });

    const result: Record<string, DictTreeNode[]> = {};
    for (const item of items) {
      if (!result[item.dictGroup]) result[item.dictGroup] = [];
      result[item.dictGroup].push({
        id: item.id,
        dictGroup: item.dictGroup,
        dictKey: item.dictKey,
        dictValue: item.dictValue,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        remark: item.remark,
      });
    }

    // Build tree for each group
    for (const group of Object.keys(result)) {
      result[group] = buildTree(result[group]);
    }

    return result;
  }

  async create(dto: CreateDictItemDto) {
    return this.prisma.dictItem.create({
      data: {
        dictGroup: dto.dictGroup,
        dictKey: dto.dictKey,
        dictValue: dto.dictValue,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder,
        remark: dto.remark,
      },
    });
  }

  async update(id: string, dto: UpdateDictItemDto) {
    return this.prisma.dictItem.update({
      where: { id },
      data: {
        ...(dto.dictValue !== undefined && { dictValue: dto.dictValue }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.remark !== undefined && { remark: dto.remark }),
      },
    });
  }

  async listGroups() {
    const groups = await this.prisma.dictItem.groupBy({
      by: ['dictGroup'],
      _count: { id: true },
    });

    return groups.map((g) => ({
      id: g.dictGroup,
      name: g.dictGroup,
      code: g.dictGroup,
      description: `${g._count.id} items`,
      itemCount: g._count.id,
    }));
  }

  async listByGroup(dictGroup: string) {
    return this.prisma.dictItem.findMany({
      where: { dictGroup },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

function buildTree(items: DictTreeNode[]): DictTreeNode[] {
  const map = new Map<string, DictTreeNode>();
  const roots: DictTreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(item);
    } else {
      roots.push(item);
    }
  }

  // Clean up empty children arrays
  for (const item of map.values()) {
    if (!item.children?.length) delete item.children;
  }

  return roots;
}
