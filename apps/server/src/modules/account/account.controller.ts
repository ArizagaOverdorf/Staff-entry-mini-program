import { Controller, Post, Body } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrivacyAgreeDto } from './dto/privacy-agree.dto';

@Controller('app/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('privacy-agree')
  async agreePrivacy(@Body() dto: PrivacyAgreeDto) {
    return this.accountService.agreePrivacy(dto);
  }
}
