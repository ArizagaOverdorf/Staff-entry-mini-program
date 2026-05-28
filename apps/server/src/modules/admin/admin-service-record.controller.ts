import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { ServiceRecordService } from '../service-record/service-record.service';
import { CreateServiceRecordDto, UpdateServiceRecordDto } from './dto/service-record.dto';

@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@RequirePermissions('staff.view')
@Controller('admin/service-records')
export class AdminServiceRecordController {
  constructor(private readonly serviceRecordService: ServiceRecordService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('staffKeyword') staffKeyword?: string,
    @Query('serviceProject') serviceProject?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('isDisputed') isDisputed?: string,
  ) {
    return this.serviceRecordService.list({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      staffKeyword,
      serviceProject,
      dateFrom,
      dateTo,
      isDisputed: isDisputed !== undefined ? isDisputed === 'true' : undefined,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.serviceRecordService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateServiceRecordDto) {
    return this.serviceRecordService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceRecordDto,
  ) {
    return this.serviceRecordService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.serviceRecordService.delete(id);
  }
}
