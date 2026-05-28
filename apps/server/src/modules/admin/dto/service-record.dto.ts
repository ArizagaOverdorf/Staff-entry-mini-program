import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateServiceRecordDto {
  @IsString()
  staffAccountId: string;

  @IsOptional()
  @IsString()
  serviceDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalOrderNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  serviceProject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  serviceDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceDesc?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isDisputed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  disputeResult?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  disputeRemark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  recordSource?: string;
}

export class UpdateServiceRecordDto {
  @IsOptional()
  @IsString()
  serviceDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalOrderNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  serviceProject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  serviceDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceDesc?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isDisputed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  disputeResult?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  disputeRemark?: string;
}
