import { IsIn, IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const KINDS = ['TEXTBOOK', 'READER', 'WORKBOOK', 'GRAMMAR', 'EXAM_PREP', 'OTHER'] as const;
const VISIBILITY = ['PRIVATE', 'GROUP', 'LEVEL', 'PUBLIC'] as const;

/** Havola faqat https bo'lsin: http bo'lsa brauzer bloklaydi va fayl ochilmaydi. */
const URL_RULES = { protocols: ['https'], require_protocol: true };

export class CreateBookDto {
  @IsString() @Length(2, 200) title!: string;
  @IsOptional() @IsString() @Length(1, 120) author?: string;
  @IsOptional() @IsString() @Length(1, 2000) description?: string;
  @IsIn(LEVELS) level!: (typeof LEVELS)[number];
  @IsOptional() @IsIn(KINDS) kind?: (typeof KINDS)[number];
  @IsOptional() @IsIn(VISIBILITY) visibility?: (typeof VISIBILITY)[number];

  /** Yuklangan fayl manzili (Blob) yoki tashqi havola. */
  @IsOptional() @IsUrl(URL_RULES) @Length(5, 1000) fileUrl?: string;
  @IsOptional() @IsString() @Length(1, 255) fileName?: string;
  @IsOptional() @IsInt() @Min(0) fileSize?: number;
  @IsOptional() @IsString() @Length(1, 120) mimeType?: string;
  @IsOptional() @IsInt() @Min(1) pageCount?: number;
  @IsOptional() @IsUrl(URL_RULES) @Length(5, 1000) coverUrl?: string;

  /** visibility = GROUP bo'lsa majburiy (xizmatda tekshiriladi). */
  @IsOptional() @IsString() @Length(1, 40) groupId?: string;
}

export class UpdateBookDto {
  @IsOptional() @IsString() @Length(2, 200) title?: string;
  @IsOptional() @IsString() @Length(1, 120) author?: string;
  @IsOptional() @IsString() @Length(1, 2000) description?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsIn(KINDS) kind?: (typeof KINDS)[number];
  @IsOptional() @IsIn(VISIBILITY) visibility?: (typeof VISIBILITY)[number];
  @IsOptional() @IsInt() @Min(1) pageCount?: number;
  @IsOptional() @IsUrl(URL_RULES) @Length(5, 1000) coverUrl?: string;
  @IsOptional() @IsString() @Length(1, 40) groupId?: string;
}

export class BookQueryDto {
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsIn(KINDS) kind?: (typeof KINDS)[number];
  @IsOptional() @IsString() @Length(1, 80) q?: string;
}

export class ProgressDto {
  @IsInt() @Min(1) lastPage!: number;
  /** true = tugatdim deb belgilash, false = belgini olib tashlash. */
  @IsOptional() @IsIn([true, false]) finished?: boolean;
}

export class ChapterDto {
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsInt() @Min(1) startPage?: number;
}
