import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ServiceRecordService } from './service-record.service';

@UseGuards(JwtAuthGuard)
@Controller('app/service-records')
export class AppServiceRecordController {
  constructor(private readonly serviceRecordService: ServiceRecordService) {}

  @Get()
  async list(
    @CurrentUser('id') accountId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.serviceRecordService.listByAccount(
      accountId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }
}
