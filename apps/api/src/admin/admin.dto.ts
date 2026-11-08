import { Level, Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQuery {
  @IsOptional() @IsString() @MaxLength(80) q?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number;
}

export class CreateUserDto {
  @IsString() @Length(1, 60) firstName!: string;
  @IsString() @Length(1, 60) lastName!: string;
  @IsString() @Length(3, 254) identifier!: string; // email yoki telefon
  @IsString() @Length(10, 128) password!: string;
  @IsEnum(Role) role!: Role;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @Length(1, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum(Level) level?: Level;
}

export class ResetPasswordDto {
  @IsString() @Length(10, 128) newPassword!: string;
}
