import { Locale } from '@prisma/client';
import {
  Equals, IsDateString, IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MaxLength,
} from 'class-validator';

// Faqat harflar, ' ʻ - va bo'shliq (HTML/skript belgilariga yo'l yo'q)
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’ʻʼ\- ]*$/u;
const NAME_MSG = "Ism va familiyada faqat harflar bo'lsin";

export class RegisterDto {
  @IsString() @Length(2, 50) @Matches(NAME_RE, { message: NAME_MSG })
  firstName!: string;

  @IsString() @Length(2, 50) @Matches(NAME_RE, { message: NAME_MSG })
  lastName!: string;

  @IsOptional() @IsEmail() @MaxLength(254)
  email?: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  // Uzunlik qoidalari password.policy.ts da; bu yerda faqat argon2 uchun yuqori chegara
  @IsString() @MaxLength(128)
  password!: string;

  @IsDateString()
  birthDate!: string;

  @IsOptional() @IsEnum(Locale)
  locale?: Locale;

  @Equals(true, { message: 'Maxfiylik siyosati va foydalanish shartlariga rozilik kerak' })
  acceptTerms!: boolean;
}
