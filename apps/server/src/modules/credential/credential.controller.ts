import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CredentialService } from './credential.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';
import { UpsertSkillEntryDto, UpsertIndependentSkillsDto } from './dto/skill-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('app/credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get()
  async list(@CurrentUser() user: { id: string; staffId: string }) {
    return this.credentialService.listByAccount(user.id);
  }

  @Get('independent-skills')
  async getIndependentSkills(@CurrentUser() user: { id: string; staffId: string }) {
    return this.credentialService.getIndependentSkills(user.id);
  }

  @Put('independent-skills')
  async upsertIndependentSkills(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpsertIndependentSkillsDto,
  ) {
    return this.credentialService.upsertIndependentSkills(user.id, dto);
  }

  @Get('skill-entries')
  async getSkillEntries(@CurrentUser() user: { id: string; staffId: string }) {
    return this.credentialService.getSkillEntries(user.id);
  }

  @Put('skill-entries')
  async upsertSkillEntry(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpsertSkillEntryDto,
  ) {
    return this.credentialService.upsertSkillEntry(user.id, dto);
  }

  @Get(':id')
  async detail(
    @CurrentUser() user: { id: string; staffId: string },
    @Param('id') id: string,
  ) {
    return this.credentialService.findById(user.id, id);
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string; staffId: string },
    @Body() dto: UpsertCredentialDto,
  ) {
    return this.credentialService.create(user.id, dto);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { id: string; staffId: string },
    @Param('id') id: string,
    @Body() dto: UpsertCredentialDto,
  ) {
    return this.credentialService.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: { id: string; staffId: string },
    @Param('id') id: string,
  ) {
    return this.credentialService.remove(user.id, id);
  }
}
