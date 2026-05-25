import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpsertCredentialDto {
  @IsString()
  @IsOptional()
  credentialType?: string;

  @IsString()
  @IsOptional()
  typeId?: string;

  @IsString()
  @IsOptional()
  credentialName?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  typeName?: string;

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

  @IsString()
  @IsOptional()
  expireDate?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
