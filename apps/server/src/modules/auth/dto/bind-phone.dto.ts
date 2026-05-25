import { IsString, IsNotEmpty } from 'class-validator';

export class BindPhoneDto {
  @IsString()
  @IsNotEmpty()
  staffAccountId: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
