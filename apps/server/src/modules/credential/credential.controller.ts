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

@UseGuards(JwtAuthGuard)
@Controller('app/credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Get()
  async list(@CurrentUser() user: { id: string; staffId: string }) {
    return this.credentialService.listByAccount(user.id);
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
