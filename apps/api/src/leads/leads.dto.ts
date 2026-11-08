import { Level } from '@prisma/client';
import { Equals, IsEnum, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’ʻʼ\- ]*$/u;

export class CreateLeadDto {
  @IsString() @Length(2, 80) @Matches(NAME_RE, { message: "Ismda faqat harflar bo'lsin" })
  name!: string;

  @IsString() @MaxLength(20)
  phone!: string;

  @IsOptional() @IsEnum(Level)
  level?: Level;

  @IsOptional() @IsString() @MaxLength(500)
  message?: string;

  /** Tuzoq (honeypot) maydon: odam ko'rmaydi, botlar to'ldiradi */
  @IsOptional() @IsString() @MaxLength(200)
  website?: string;

  @Equals(true, { message: "Ma'lumotlarni qayta ishlashga rozilik kerak" })
  consent!: boolean;
}
