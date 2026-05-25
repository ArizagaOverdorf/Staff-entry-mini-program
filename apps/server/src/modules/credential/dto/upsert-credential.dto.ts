import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertCredentialDto {
  @IsString()
  @IsNotEmpty()
  credentialType: string;

  @IsString()
  @IsNotEmpty()
  credentialName: string;

  @IsString()
  @IsOptional()
  credentialNumber?: string;

  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;
}
