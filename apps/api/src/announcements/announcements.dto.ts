import {
  IsBoolean,
  IsInt,
  Max,
  Min,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const KINDS = ['INFO', 'PROMO', 'EVENT', 'WARNING'] as const;
const AUDIENCES = ['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS'] as const;

/**
 * Havola tekshiruvi.
 *
 * NEGA SHUNCHAKI URL EMAS: e'lon butun saytda har bir foydalanuvchiga
 * ko'rinadi. Agar admin hisobi buzilsa yoki admin xato qo'ysa,
 * "javascript:" yoki "data:" havolasi brauzerda kod ishga tushirishi
 * mumkin. Shuning uchun faqat IKKI shakl ruxsat etiladi:
 *   • sayt ichidagi yo'l:  /kurslar
 *   • https havola:        https://t.me/turkcem_tr
 * "http://" ham rad etiladi — shifrlanmagan havola.
 */
export const SAFE_LINK =
  /^(\/[A-Za-z0-9\-_/?=&.%#]*|https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s]*)?)$/;

/**
 * Rasm faqat o'zimizning fayl omborimizdan bo'lsin.
 * Begona saytdagi rasm har bir foydalanuvchining IP manzilini o'sha
 * saytga oshkor qiladi — bu bizning o'quvchilarimiz, shuning uchun yo'q.
 */
export const BLOB_IMAGE = /^https:\/\/[A-Za-z0-9.-]+\.(?:public\.)?blob\.vercel-storage\.com\/[^\s]+$/;

const LINK_MSG = "Havola sayt ichidagi yo'l (/kurslar) yoki https:// bilan boshlanishi kerak";
const IMAGE_MSG = "Rasm faqat saytning o'z fayl omboridan bo'lishi mumkin";

/** Reklama rasmini yuklash uchun token so'rovi. */
export class ImageTokenDto {
  @IsString() @Length(1, 255) fileName!: string;
  @IsString() @Length(3, 60) contentType!: string;
  @IsInt() @Min(1) @Max(5 * 1024 * 1024) size!: number;
}

export class CreateAnnouncementDto {
  @IsOptional() @IsIn(KINDS) kind?: (typeof KINDS)[number];
  @IsOptional() @IsIn(AUDIENCES) audience?: (typeof AUDIENCES)[number];

  @IsString() @Length(3, 120) title!: string;
  @IsString() @Length(1, 2000) body!: string;

  @IsOptional() @IsString() @MaxLength(500) @Matches(BLOB_IMAGE, { message: IMAGE_MSG })
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(500) @Matches(SAFE_LINK, { message: LINK_MSG })
  linkUrl?: string;

  @IsOptional() @IsString() @MaxLength(40) linkLabel?: string;

  @IsOptional() @IsBoolean() dismissible?: boolean;
  @IsOptional() @IsBoolean() pinned?: boolean;

  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** Tahrirlashda hamma maydon ixtiyoriy — faqat o'zgargani yuboriladi. */
export class UpdateAnnouncementDto {
  @IsOptional() @IsIn(KINDS) kind?: (typeof KINDS)[number];
  @IsOptional() @IsIn(AUDIENCES) audience?: (typeof AUDIENCES)[number];

  @IsOptional() @IsString() @Length(3, 120) title?: string;
  @IsOptional() @IsString() @Length(1, 2000) body?: string;

  @IsOptional() @IsString() @MaxLength(500) @Matches(BLOB_IMAGE, { message: IMAGE_MSG })
  imageUrl?: string;

  @IsOptional() @IsString() @MaxLength(500) @Matches(SAFE_LINK, { message: LINK_MSG })
  linkUrl?: string;

  @IsOptional() @IsString() @MaxLength(40) linkLabel?: string;

  @IsOptional() @IsBoolean() dismissible?: boolean;
  @IsOptional() @IsBoolean() pinned?: boolean;

  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
