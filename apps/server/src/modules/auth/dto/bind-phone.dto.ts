import { IsString, IsOptional } from 'class-validator';

export class BindPhoneDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  encryptedData?: string;

  @IsString()
  @IsOptional()
  iv?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  smsCode?: string;
}
