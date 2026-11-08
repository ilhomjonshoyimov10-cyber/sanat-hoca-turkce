import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString() @Length(1, 2000) content!: string;
  /** E'lon: ustoz yuboradi, yuqorida turadi va bildirishnoma boradi. */
  @IsOptional() @IsBoolean() isAnnouncement?: boolean;
}

export class HistoryQuery {
  /** Shu xabar id sidan KEYINGI xabarlar (jonli yangilanish uchun). */
  @IsOptional() @IsString() @MaxLength(40) after?: string;
  /** Shu xabardan OLDINGI xabarlar (eski tarixni yuklash). */
  @IsOptional() @IsString() @MaxLength(40) before?: string;
}
