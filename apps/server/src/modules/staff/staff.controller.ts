import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StaffService } from './staff.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UpdateServiceAreasDto } from './dto/update-service-areas.dto';

@UseGuards(JwtAuthGuard)
@Controller('app/profile')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async getProfile(@CurrentUser() user: { id: string; staffId: string }) {
    return this.staffService.getProfile(user.id, user.staffId);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.staffService.updateProfile(user.id, user.staffId, dto);
  }

  @Put('skills')
  async updateSkills(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpdateSkillsDto,
  ) {
    return this.staffService.updateSkills(user.id, dto);
  }

  @Put('service-areas')
  async updateServiceAreas(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpdateServiceAreasDto,
  ) {
    return this.staffService.updateServiceAreas(user.id, dto);
  }
}
