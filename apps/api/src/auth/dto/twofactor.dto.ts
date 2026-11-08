import { IsString, Length, MaxLength } from 'class-validator';

/** 6 xonali TOTP kodi yoki tiklash kodi (XXXXX-XXXXX) */
export class CodeDto {
  @IsString() @Length(6, 20)
  code!: string;
}

export class TwoFactorLoginDto extends CodeDto {
  @IsString() @MaxLength(1000)
  challenge!: string;
}

export class DisableTwoFactorDto extends CodeDto {
  @IsString() @MaxLength(128)
  password!: string;
}
