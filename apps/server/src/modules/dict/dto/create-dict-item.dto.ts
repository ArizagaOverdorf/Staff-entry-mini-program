import { IsString, IsNotEmpty, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateDictItemDto {
  @IsString()
  @IsNotEmpty()
  dictGroup: string;

  @IsString()
  @IsNotEmpty()
  dictKey: string;

  @IsString()
  @IsNotEmpty()
  dictValue: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
