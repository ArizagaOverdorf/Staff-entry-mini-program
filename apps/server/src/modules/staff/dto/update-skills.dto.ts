import { IsArray, IsString, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SkillItem {
  @IsString()
  categoryId: string;

  @IsString()
  categoryName: string;

  @IsInt()
  @IsOptional()
  skillLevel?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSkillsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillItem)
  skills: SkillItem[];
}
