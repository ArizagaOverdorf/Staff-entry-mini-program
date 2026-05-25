import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async list(@Query() pagination: PaginationDto) {
    return this.adminUserService.list(pagination);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.adminUserService.detail(id);
  }

  @Post()
  async create(@Body() dto: CreateAdminUserDto) {
    return this.adminUserService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminUserService.update(id, dto);
  }
}
