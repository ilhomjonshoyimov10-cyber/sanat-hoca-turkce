import { Level } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class QuizQueryDto {
  @IsOptional() @IsEnum(Level)
  level?: Level;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)
  limit?: number;
}

export class AnswerDto {
  @IsString() @MaxLength(800)
  token!: string;

  @IsInt() @Min(0) @Max(3)
  choice!: number;
}

export class OptInDto {
  @IsBoolean()
  optIn!: boolean;
}

export class SetQueryDto {
  @IsOptional() @IsEnum(Level)
  level?: Level;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10)
  limit?: number;
}

export class PairDto {
  @IsInt() @Min(0) @Max(5) left!: number;
  @IsInt() @Min(0) @Max(5) right!: number;
}

export class MatchAnswerDto {
  @IsString() @MaxLength(1200)
  token!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => PairDto)
  pairs!: PairDto[];
}

/** "Harflardan so'z yig'ish" va "Tinglab yozish" uchun */
export class TypedAnswerDto {
  @IsString() @MaxLength(800)
  token!: string;

  @IsString() @MaxLength(40)
  answer!: string;
}

// ───────────── Yangi o'yinlar ─────────────

export class DrillQueryDto {
  @IsOptional() @IsEnum(Level)
  level?: Level;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10)
  limit?: number;

  /** Qo'shimcha mashqini qoida bo'yicha filtrlash (masalan "locative"). */
  @IsOptional() @IsString() @MaxLength(40)
  rule?: string;
}

/** Gap tuzish va qo'shimcha mashqi uchun javob. */
export class TextAnswerDto {
  @IsString() @MaxLength(1200)
  token!: string;

  @IsString() @MaxLength(300)
  answer!: string;
}

/** So'z zanjiri: oldingi so'zning oxirgi harfidan boshlanadigan so'z. */
export class ChainAnswerDto {
  @IsString() @MaxLength(2000)
  token!: string;

  @IsString() @MaxLength(40)
  answer!: string;
}

/** Variant tanlanadigan o'yinlar uchun javob (bo'shliq, suhbat, zid ma'no, ortiqcha so'z). */
export class ChoiceAnswerDto {
  @IsString() @MaxLength(1200)
  token!: string;

  @IsInt() @Min(0) @Max(9)
  choice!: number;
}
