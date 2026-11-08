import { IsDateString, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString() @Length(2, 120) title!: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
}

export class UpdateLessonDto {
  @IsOptional() @IsString() @Length(2, 120) title?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsInt() @Min(10) @Max(300) durationMin?: number;
}
