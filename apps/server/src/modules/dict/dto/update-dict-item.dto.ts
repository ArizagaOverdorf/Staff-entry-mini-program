import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDictItemDto {
  @IsString()
  @IsOptional()
  dictValue?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  remark?: string;
}
