import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DictService } from './dict.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('app/dicts')
export class DictAppController {
  constructor(private readonly dictService: DictService) {}

  @Get()
  async getForApp(@Query('groups') groups?: string) {
    return this.dictService.getForApp(groups);
  }
}
