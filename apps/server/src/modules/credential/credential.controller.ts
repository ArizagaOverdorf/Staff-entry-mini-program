import { Controller, Get, Post, Put, Param, Body, Delete } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { UpsertCredentialDto } from './dto/upsert-credential.dto';

@Controller('app/credential')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get(':staffId')
  async listByStaff(@Param('staffId') staffId: string) {
    return this.credentialService.listByStaff(staffId);
  }

  @Post(':staffId')
  async create(@Param('staffId') staffId: string, @Body() dto: UpsertCredentialDto) {
    return this.credentialService.create(staffId, dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpsertCredentialDto) {
    return this.credentialService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.credentialService.remove(id);
  }
}
