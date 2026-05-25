import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { StaffService } from './staff.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UpdateServiceAreasDto } from './dto/update-service-areas.dto';

@Controller('app/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get(':staffId')
  async getProfile(@Param('staffId') staffId: string) {
    return this.staffService.getProfile(staffId);
  }

  @Put(':staffId/profile')
  async updateProfile(@Param('staffId') staffId: string, @Body() dto: UpdateProfileDto) {
    return this.staffService.updateProfile(staffId, dto);
  }

  @Put(':staffId/skills')
  async updateSkills(@Param('staffId') staffId: string, @Body() dto: UpdateSkillsDto) {
    return this.staffService.updateSkills(staffId, dto);
  }

  @Put(':staffId/service-areas')
  async updateServiceAreas(@Param('staffId') staffId: string, @Body() dto: UpdateServiceAreasDto) {
    return this.staffService.updateServiceAreas(staffId, dto);
  }
}
