import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AuditIntakeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class AuditCredentialDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
