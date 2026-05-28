import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListingService } from './listing.service';

@UseGuards(JwtAuthGuard)
@Controller('app/listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get('status')
  async getStatus(@CurrentUser('id') accountId: string) {
    return this.listingService.getStatus(accountId);
  }

  @Post('resume')
  async resume(@CurrentUser('id') accountId: string) {
    return this.listingService.resume(accountId);
  }

  @Post('pause')
  async pause(
    @CurrentUser('id') accountId: string,
    @Body('reason') reason?: string,
  ) {
    return this.listingService.pause(accountId, reason);
  }
}
