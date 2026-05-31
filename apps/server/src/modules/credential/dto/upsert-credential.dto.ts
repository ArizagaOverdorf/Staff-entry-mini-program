import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CredentialFileItemDto {
  @IsString()
  fileId: string;

  @IsString()
  @IsOptional()
  fileSide?: string;
}

class StaffSkillCategoryDto {
  @IsString()
  categoryId: string;

  @IsString()
  categoryName: string;
}

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
  skillLevel?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialFileItemDto)
  @IsOptional()
  files?: CredentialFileItemDto[];

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  staffSkillIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffSkillCategoryDto)
  @IsOptional()
  staffSkillCategories?: StaffSkillCategoryDto[];
}
