import { IsString, IsOptional } from 'class-validator';

export class BindPhoneDto {
  @IsString()
  @IsOptional()
  encryptedData?: string;

  @IsString()
  @IsOptional()
  iv?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
