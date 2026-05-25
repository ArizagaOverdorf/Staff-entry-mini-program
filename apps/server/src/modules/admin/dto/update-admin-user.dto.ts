import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminUserDto {
  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
