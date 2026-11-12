import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const TOPICS = ['PROFILE', 'LESSON', 'PAYMENT', 'TECHNICAL', 'OTHER'] as const;
const STATUSES = ['OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED'] as const;

export class CreateSupportDto {
  @IsOptional() @IsIn(TOPICS) topic?: (typeof TOPICS)[number];
  @IsString() @Length(3, 120) subject!: string;
  @IsString() @Length(5, 2000) body!: string;
}

export class ReplyDto {
  @IsString() @Length(1, 2000) body!: string;
}

export class SetStatusDto {
  @IsIn(STATUSES) status!: (typeof STATUSES)[number];
}
