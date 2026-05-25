import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryDictDto } from './dto/query-dict.dto';
import { CreateDictItemDto } from './dto/create-dict-item.dto';
import { UpdateDictItemDto } from './dto/update-dict-item.dto';

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryDictDto) {
    return this.prisma.dictItem.findMany({
      where: query.dictGroup ? { dictGroup: query.dictGroup } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreateDictItemDto) {
    return this.prisma.dictItem.create({ data: dto });
  }

  async update(id: string, dto: UpdateDictItemDto) {
    return this.prisma.dictItem.update({ where: { id }, data: dto });
  }
}
