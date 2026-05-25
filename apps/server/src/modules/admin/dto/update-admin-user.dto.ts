import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roleIds?: string[];
}
