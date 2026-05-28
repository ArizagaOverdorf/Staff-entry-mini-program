import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetManagementStatusDto {
  @IsString()
  @IsIn(['normal', 'paused', 'blacklisted'])
  status: 'normal' | 'paused' | 'blacklisted';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
