import { Level } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, Length, Matches,
  Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

const URL_OPTS = { protocols: ['https'], require_protocol: true }; // "javascript:" kabi havolalar rad etiladi

export class CreateGroupDto {
  @IsString() @Length(2, 80) name!: string;
  @IsEnum(Level) level!: Level;
  @IsOptional() @IsString() @MaxLength(120) schedule?: string;
  @IsOptional() @IsUrl(URL_OPTS) @MaxLength(300) meetingUrl?: string;
  /** Faqat ADMIN uchun: guruhni boshqa ustozga biriktirish */
  @IsOptional() @IsString() @MaxLength(40) teacherId?: string;
}

export class UpdateGroupDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;
  @IsOptional() @IsEnum(Level) level?: Level;
  @IsOptional() @IsString() @MaxLength(120) schedule?: string;
  @IsOptional() @IsUrl(URL_OPTS) @MaxLength(300) meetingUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AddMemberDto {
  /** O'quvchining email yoki telefon raqami */
  @IsString() @Length(3, 254) identifier!: string;
  /** 18 yoshgacha bo'lgan o'quvchi uchun: ota-ona roziligi olinganini ustoz tasdiqlaydi */
  @IsOptional() @IsBoolean() confirmParentConsent?: boolean;
}

export class CreateHomeworkDto {
  @IsString() @Length(2, 120) title!: string;
  @IsString() @Length(1, 3000) description!: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000) maxScore?: number;
}

export class SubmitDto {
  @IsString() @Length(1, 5000) text!: string;
}

export class GradeDto {
  @IsOptional() @IsInt() @Min(0) @Max(1000) score?: number;
  @IsOptional() @IsString() @MaxLength(1000) feedback?: string;
  /** true bo'lsa: baho qo'yilmaydi, o'quvchiga qayta ishlash uchun qaytariladi */
  @IsOptional() @IsBoolean() returnForRevision?: boolean;
}

export class AttendanceRecordDto {
  @IsString() @MaxLength(40) userId!: string;
  @IsBoolean() present!: boolean;
}

export class AttendanceDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana YYYY-MM-DD ko'rinishida bo'lsin" }) date!: string;
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}

export class AddMemberByIdDto {
  @IsString() @Length(1, 40) userId!: string;
  @IsOptional() @IsBoolean() confirmParentConsent?: boolean;
}

export class JoinByCodeDto {
  @IsString() @Length(4, 20) code!: string;
}
