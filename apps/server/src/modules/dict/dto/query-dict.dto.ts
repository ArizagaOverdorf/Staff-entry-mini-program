import { IsString, IsOptional } from 'class-validator';

export class QueryDictDto {
  @IsString()
  @IsOptional()
  dictGroup?: string;
}
