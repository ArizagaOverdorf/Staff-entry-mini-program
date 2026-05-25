import { IsString, IsNotEmpty } from 'class-validator';

export class PrivacyAgreeDto {
  @IsString()
  @IsNotEmpty()
  staffAccountId: string;
}
