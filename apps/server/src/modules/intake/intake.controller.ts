import { Controller, Post, Get, Param } from '@nestjs/common';
import { IntakeService } from './intake.service';

@Controller('app/intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post(':staffId/submit')
  async submit(@Param('staffId') staffId: string) {
    return this.intakeService.submit(staffId);
  }

  @Get(':staffId/status')
  async status(@Param('staffId') staffId: string) {
    return this.intakeService.getStatus(staffId);
  }
}
