import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SkillEntryFileItemDto {
  @IsString()
  fileId: string;
}

export class UpsertSkillEntryDto {
  @IsInt()
  entryIndex: number;

  @IsString()
  @IsOptional()
  skillName?: string;

  @IsString()
  @IsOptional()
  skillLevel?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  workDurationMonths?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedServiceSkills?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillEntryFileItemDto)
  @IsOptional()
  files?: SkillEntryFileItemDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[];
}

export class UpsertIndependentSkillsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndependentSkillItemDto)
  skills: IndependentSkillItemDto[];
}

class IndependentSkillItemDto {
  @IsString()
  skillKey: string;

  @IsBoolean()
  isSelected: boolean;
}
