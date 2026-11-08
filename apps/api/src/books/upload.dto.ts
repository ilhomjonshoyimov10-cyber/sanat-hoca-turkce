import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class UploadTokenDto {
  @IsString() @Length(1, 255) fileName!: string;
  @IsString() @Length(3, 120) contentType!: string;
  /** Brauzer aytgan hajm. Haqiqiy chegara tokenning ichida — bu faqat
   *  foydalanuvchiga darhol tushunarli xato berish uchun. */
  @IsInt() @Min(1) @Max(60 * 1024 * 1024) size!: number;
}
