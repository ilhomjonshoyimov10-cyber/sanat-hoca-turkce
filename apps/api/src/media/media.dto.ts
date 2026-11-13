import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export const MEDIA_KINDS = ['SERIES', 'FILM', 'MUSIC', 'KIDS', 'LESSON'] as const;
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export class CreateMediaDto {
  /** Har qanday shakldagi YouTube havolasi — server ID ni o'zi ajratadi */
  @IsString()
  @Length(10, 400)
  url!: string;

  @IsIn(MEDIA_KINDS)
  kind!: (typeof MEDIA_KINDS)[number];

  /** Bo'sh qoldirilsa — YouTube'dagi sarlavha olinadi */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsIn([...LEVELS, null])
  level?: (typeof LEVELS)[number] | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  position?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateMediaDto {
  @IsOptional()
  @IsIn(MEDIA_KINDS)
  kind?: (typeof MEDIA_KINDS)[number];

  @IsOptional()
  @IsString()
  @Length(1, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsIn([...LEVELS, null])
  level?: (typeof LEVELS)[number] | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  position?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
