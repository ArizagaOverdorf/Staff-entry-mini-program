import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { DictService } from './dict.service';
import { QueryDictDto } from './dto/query-dict.dto';
import { CreateDictItemDto } from './dto/create-dict-item.dto';
import { UpdateDictItemDto } from './dto/update-dict-item.dto';

@Controller('admin/dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get()
  async list(@Query() query: QueryDictDto) {
    return this.dictService.list(query);
  }

  @Post()
  async create(@Body() dto: CreateDictItemDto) {
    return this.dictService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDictItemDto) {
    return this.dictService.update(id, dto);
  }
}
