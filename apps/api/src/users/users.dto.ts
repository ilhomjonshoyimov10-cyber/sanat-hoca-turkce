import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @Length(1, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  /** IANA vaqt mintaqasi, masalan "Asia/Tashkent" */
  @IsOptional() @IsString() @Matches(/^[A-Za-z]+\/[A-Za-z_+-]+$/) @MaxLength(60) timezone?: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(200) currentPassword!: string;
  @IsString() @Length(10, 128) newPassword!: string;
}
