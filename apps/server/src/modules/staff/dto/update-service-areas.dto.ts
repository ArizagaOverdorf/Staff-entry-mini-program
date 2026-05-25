import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceAreaItem {
  @IsString()
  province: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  district?: string;
}

export class UpdateServiceAreasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAreaItem)
  areas: ServiceAreaItem[];
}
