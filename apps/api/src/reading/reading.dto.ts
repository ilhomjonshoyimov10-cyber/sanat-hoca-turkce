import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const KINDS = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] as const;

export class ReadingQueryDto {
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
}

export class AnswerItemDto {
  @IsString() @Length(1, 40) questionId!: string;
  /** Variantli savol uchun tanlangan variant tartibi. */
  @IsOptional() @IsInt() @Min(0) choice?: number;
  /** Qisqa javobli savol uchun yozilgan matn. */
  @IsOptional() @IsString() @Length(0, 200) text?: string;
}

export class SubmitDto {
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}

// ───────────── Ustoz uchun ─────────────

export class CreateTextDto {
  @IsString() @Length(2, 200) title!: string;
  @IsIn(LEVELS) level!: (typeof LEVELS)[number];
  @IsString() @Length(50, 20000) body!: string;
  @IsOptional() @IsString() @Length(0, 20000) bodyUz?: string;
  @IsOptional() @IsString() @Length(1, 80) topic?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class UpdateTextDto {
  @IsOptional() @IsString() @Length(2, 200) title?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsString() @Length(50, 20000) body?: string;
  @IsOptional() @IsString() @Length(0, 20000) bodyUz?: string;
  @IsOptional() @IsString() @Length(1, 80) topic?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
  /** true = o'quvchilarga ko'rsatish, false = qoralamaga qaytarish. */
  @IsOptional() @IsIn([true, false]) published?: boolean;
}

export class CreateQuestionDto {
  @IsIn(KINDS) kind!: (typeof KINDS)[number];
  @IsString() @Length(3, 500) prompt!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @Length(1, 200, { each: true }) options?: string[];
  @IsOptional() @IsInt() @Min(0) correctIndex?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @Length(1, 200, { each: true }) correctText?: string[];
  @IsOptional() @IsString() @Length(1, 500) explanation?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class GlossaryItemDto {
  @IsString() @Length(1, 80) turkish!: string;
  @IsString() @Length(1, 120) uzbek!: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

/** Body ni massiv sifatida qabul qilmaymiz: global ValidationPipe ildizdagi
 *  massivni tekshirmaydi, ya'ni har qanday narsa o'tib ketardi. */
export class GlossaryDto {
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => GlossaryItemDto)
  items!: GlossaryItemDto[];
}
