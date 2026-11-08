import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const PARTS = [
  'NOUN',
  'VERB',
  'ADJECTIVE',
  'ADVERB',
  'PRONOUN',
  'NUMBER',
  'CONJUNCTION',
  'POSTPOSITION',
  'INTERJECTION',
  'PHRASE',
] as const;

export class WordQueryDto {
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsString() @Length(1, 60) category?: string;
  @IsOptional() @IsString() @Length(1, 60) q?: string;
  /** "1" = faqat tasdiqlangan, "0" = faqat tasdiqlanmagan, yo'q = hammasi. */
  @IsOptional() @IsIn(['0', '1']) verified?: '0' | '1';
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) take?: number;
}

export class CreateWordDto {
  @IsString() @Length(1, 80) turkish!: string;
  @IsString() @Length(1, 120) uzbek!: string;
  @IsOptional() @IsString() @Length(1, 120) russian?: string;
  @IsIn(LEVELS) level!: (typeof LEVELS)[number];

  @IsOptional() @IsString() @Length(1, 300) exampleTr?: string;
  @IsOptional() @IsString() @Length(1, 300) exampleUz?: string;
  @IsOptional() @IsString() @Length(1, 300) exampleRu?: string;
  @IsOptional() @IsIn(PARTS) partOfSpeech?: (typeof PARTS)[number];
  @IsOptional() @IsString() @Length(1, 120) pronunciation?: string;
  @IsOptional() @IsString() @Length(1, 60) category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @Length(1, 40, { each: true }) tags?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) frequency?: number;
  @IsOptional() @IsString() @Length(1, 500) notes?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class UpdateWordDto {
  @IsOptional() @IsString() @Length(1, 80) turkish?: string;
  @IsOptional() @IsString() @Length(1, 120) uzbek?: string;
  @IsOptional() @IsString() @Length(1, 120) russian?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsString() @Length(1, 300) exampleTr?: string;
  @IsOptional() @IsString() @Length(1, 300) exampleUz?: string;
  @IsOptional() @IsString() @Length(1, 300) exampleRu?: string;
  @IsOptional() @IsIn(PARTS) partOfSpeech?: (typeof PARTS)[number];
  @IsOptional() @IsString() @Length(1, 120) pronunciation?: string;
  @IsOptional() @IsString() @Length(1, 60) category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @Length(1, 40, { each: true }) tags?: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) frequency?: number;
  @IsOptional() @IsString() @Length(1, 500) notes?: string;
  @IsOptional() @IsBoolean() verified?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class CreateSetDto {
  @IsString() @Length(2, 120) title!: string;
  @IsOptional() @IsString() @Length(1, 500) description?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}

export class SetWordsDto {
  /** To'plamdagi so'zlar — ro'yxat butunlay almashtiriladi. */
  @IsArray() @IsString({ each: true }) @Length(1, 40, { each: true }) wordIds!: string[];
}
