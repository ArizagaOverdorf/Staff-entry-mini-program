import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'ok' };
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('me')
  async getMe(@CurrentAdmin('id') adminUserId: string) {
    return this.adminAuthService.getMe(adminUserId);
  }
}
