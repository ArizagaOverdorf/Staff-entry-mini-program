import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { BindPhoneDto } from './dto/bind-phone.dto';

@Controller('app/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code);
  }

  @Post('bind-phone')
  async bindPhone(@Body() dto: BindPhoneDto) {
    return this.authService.bindPhone(dto);
  }
}
