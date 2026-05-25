import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}
