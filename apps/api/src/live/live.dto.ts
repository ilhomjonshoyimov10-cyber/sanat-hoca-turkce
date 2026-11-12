import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export class CreateLiveDto {
  @IsString() @Length(3, 120) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
  /** Bo'sh bo'lsa — barcha darajalar uchun. */
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
}

export class UpdateLiveDto {
  @IsOptional() @IsString() @Length(3, 120) title?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
  @IsOptional() @IsBoolean() clearLevel?: boolean;
}
