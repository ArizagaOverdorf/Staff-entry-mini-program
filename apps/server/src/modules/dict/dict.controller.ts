import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DictService } from './dict.service';
import { QueryDictDto } from './dto/query-dict.dto';
import { CreateDictItemDto } from './dto/create-dict-item.dto';
import { UpdateDictItemDto } from './dto/update-dict-item.dto';
import { AdminJwtAuthGuard } from '../admin/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../admin/guards/permissions.guard';
import { RequirePermissions } from '../admin/decorators/permissions.decorator';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@RequirePermissions('dict.manage')
@Controller('admin')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('dicts')
  async list(@Query() query: QueryDictDto) {
    return this.dictService.list(query);
  }

  @Post('dicts')
  async create(@Body() dto: CreateDictItemDto) {
    return this.dictService.create(dto);
  }

  @Put('dicts/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateDictItemDto) {
    return this.dictService.update(id, dto);
  }

  @Get('dict/groups')
  async listGroups() {
    return this.dictService.listGroups();
  }

  @Get('dict/groups/:dictGroup/items')
  async listItemsByGroup(@Param('dictGroup') dictGroup: string) {
    return this.dictService.listByGroup(dictGroup);
  }
}
