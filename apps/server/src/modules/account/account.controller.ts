import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrivacyAgreeDto } from './dto/privacy-agree.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('app/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  async getMe(@CurrentUser('id') accountId: string) {
    return this.accountService.getMe(accountId);
  }

  @Post('privacy-agree')
  async agreePrivacy(
    @CurrentUser('id') accountId: string,
    @Body() _dto: PrivacyAgreeDto,
  ) {
    return this.accountService.agreePrivacy(accountId);
  }
}
