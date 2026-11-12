import { IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { AVATAR_MAX_BYTES, BLOB_URL } from './avatar.js';

export class UpdateProfileDto {
  @IsOptional() @IsString() @Length(1, 60) firstName?: string;
  @IsOptional() @IsString() @Length(1, 60) lastName?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  /** IANA vaqt mintaqasi, masalan "Asia/Tashkent" */
  @IsOptional() @IsString() @Matches(/^[A-Za-z]+\/[A-Za-z_+-]+$/) @MaxLength(60) timezone?: string;
}

export class AvatarTokenDto {
  @IsString() @Length(1, 255) fileName!: string;
  @IsString() @Length(3, 60) contentType!: string;
  @IsInt() @Min(1) @Max(AVATAR_MAX_BYTES) size!: number;
}

export class SetAvatarDto {
  /** Yuklash tugagach brauzer qaytargan manzil. Faqat o'z omborimiz. */
  @IsString()
  @MaxLength(500)
  @Matches(BLOB_URL, { message: "Rasm manzili noto'g'ri" })
  url!: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(200) currentPassword!: string;
  @IsString() @Length(10, 128) newPassword!: string;
}
