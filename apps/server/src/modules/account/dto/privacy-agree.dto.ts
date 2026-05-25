import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PrivacyAgreeDto {
  @IsBoolean()
  @IsNotEmpty()
  agreed: boolean;
}
