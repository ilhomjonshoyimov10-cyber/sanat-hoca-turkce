import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const LEAD_STATUSES = ['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED'] as const;

/**
 * Video havolasi.
 *
 * Faqat https. Nega: havola o'quvchining brauzerida ochiladi va bu
 * sahifaga admindan boshqa hech kim yoza olmasa ham, "javascript:" yoki
 * "data:" havolasi xato bilan kiritilsa zarar keltirishi mumkin.
 */
const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?$/;
const URL_MSG = 'Havola https:// bilan boshlanishi kerak';

export class CreateVideoDto {
  @IsString() @Length(2, 120) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: URL_MSG }) url!: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: URL_MSG }) coverUrl?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsInt() @Min(0) @Max(999) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  /** "Bepul 1-dars": bir tugma bilan yuboriladigan asosiy video */
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateVideoDto {
  @IsOptional() @IsString() @Length(2, 120) title?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: URL_MSG }) url?: string;
  @IsOptional() @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: URL_MSG }) coverUrl?: string;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsInt() @Min(0) @Max(999) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class AssignVideoDto {
  @IsString() @Length(1, 40) videoId!: string;
}

export class LeadStatusDto {
  @IsIn(LEAD_STATUSES) status!: (typeof LEAD_STATUSES)[number];
}

export class LeadMessageDto {
  @IsString() @Length(1, 2000) body!: string;
}

/** Arizani qo'lda hisobga bog'lash (raqam boshqacha yozilgan bo'lsa). */
export class LinkLeadDto {
  @IsString() @Length(1, 40) userId!: string;
}
