import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const TASKS = ['CHAT', 'GRAMMAR', 'EXPLAIN', 'EXERCISE'] as const;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export class AskDto {
  @IsIn(TASKS) task!: (typeof TASKS)[number];

  // Uzunlik vazifaga qarab xizmatda yana tekshiriladi (har vazifada boshqa
  // chegara bor). Bu yerdagi 3000 — mutlaq yuqori chegara.
  @IsString() @Length(1, 3000) message!: string;

  @IsOptional() @IsString() @Length(1, 40) conversationId?: string;

  /** Javob tilini darajaga moslash uchun. Majburiy emas. */
  @IsOptional() @IsIn(LEVELS) level?: (typeof LEVELS)[number];
}
