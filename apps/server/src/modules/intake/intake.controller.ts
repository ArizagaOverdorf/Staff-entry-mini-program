import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IntakeService } from './intake.service';

@UseGuards(JwtAuthGuard)
@Controller('app/intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Get('preview')
  async preview(@CurrentUser() user: { id: string; staffId: string }) {
    return this.intakeService.preview(user.id, user.staffId);
  }

  @Get('status')
  async status(@CurrentUser() user: { id: string; staffId: string }) {
    return this.intakeService.getStatus(user.id);
  }

  @Post('submit')
  async submit(@CurrentUser() user: { id: string; staffId: string }) {
    return this.intakeService.submit(user.id, user.staffId);
  }
}
