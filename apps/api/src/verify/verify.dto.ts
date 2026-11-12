import { IsString, Matches } from 'class-validator';

export class ConfirmCodeDto {
  /**
   * Faqat 6 raqam. Uzunlikni ham, shaklni ham shu yerda tekshiramiz:
   * xizmatga noto'g'ri shakldagi qiymat yetib bormaydi.
   */
  @IsString()
  @Matches(/^\d{6}$/, { message: "Kod 6 raqamdan iborat bo'lishi kerak" })
  code!: string;
}
