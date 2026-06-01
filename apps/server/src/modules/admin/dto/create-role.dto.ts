import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '角色编码只能包含字母、数字、下划线和连字符' })
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
