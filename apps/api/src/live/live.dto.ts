import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const PROVIDERS = ['JITSI', 'EXTERNAL'] as const;

/** Faqat https: Zoom, Google Meet, Telegram video chat va h.k. */
const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s<>"']*)?$/;

export class CreateLiveDto {
  @IsString() @Length(3, 120) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
  /** Bo'sh bo'lsa — barcha darajalar uchun. */
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  /** Berilsa — faqat shu guruh a'zolari ko'radi va kiradi. */
  @IsOptional() @IsString() @Length(1, 40) groupId?: string;
  @IsOptional() @IsIn(PROVIDERS) provider?: (typeof PROVIDERS)[number];
  @IsOptional() @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: "Havola https:// bilan boshlanishi kerak" })
  externalUrl?: string;
  @IsOptional() @IsInt() @Min(2) @Max(300) maxParticipants?: number;
}

export class UpdateLiveDto {
  @IsOptional() @IsString() @Length(3, 120) title?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsBoolean() clearLevel?: boolean;
  @IsOptional() @IsString() @MaxLength(500) @Matches(HTTPS_URL, { message: "Havola https:// bilan boshlanishi kerak" })
  externalUrl?: string;
  @IsOptional() @IsInt() @Min(2) @Max(300) maxParticipants?: number;
}
