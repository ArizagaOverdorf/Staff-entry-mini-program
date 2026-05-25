import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { BindPhoneDto } from './dto/bind-phone.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('app/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat-login')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bind-phone')
  async bindPhone(
    @CurrentUser('id') accountId: string,
    @Body() dto: BindPhoneDto,
  ) {
    return this.authService.bindPhone(accountId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: 'ok' };
  }
}
