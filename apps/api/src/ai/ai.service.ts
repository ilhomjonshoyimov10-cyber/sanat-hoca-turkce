import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AskDto } from './ai.dto.js';
import { MAX_INPUT_CHARS, MAX_OUTPUT_CHARS, systemPrompt, type PromptTask } from './ai.prompts.js';
import { AiProviderError, aiEnabled, callAi, readAiConfig, type AiChatMessage, type AiConfig } from './ai.provider.js';

/** Kunlik so'rov chegarasi. Bepul tierda butun markazga umumiy kvota bor,
 *  shuning uchun bitta foydalanuvchi hammaning kvotasini yeb qo'ymasligi kerak. */
const DAILY_LIMIT: Record<string, number> = {
  STUDENT: 30,
  PARENT: 10,
  TEACHER: 120,
  ADMIN: 120,
};

/** AI ga yuborilayotgan suhbat tarixi uzunligi. Uzun tarix = qimmat so'rov. */
const CONTEXT_MESSAGES = 10;

/** EXERCISE vazifasi faqat ustoz va admin uchun. */
const TEACHER_ONLY: PromptTask[] = ['EXERCISE'];

@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);
  private readonly config: AiConfig = readAiConfig();

  constructor(private readonly prisma: PrismaService) {}

  /** Frontend AI tugmasini ko'rsatish/yashirish uchun shu ma'lumotni oladi. */
  async status(userId: string, role: string) {
    const used = await this.usedToday(userId);
    return {
      enabled: aiEnabled(this.config),
      provider: aiEnabled(this.config) ? this.config.provider : null,
      model: aiEnabled(this.config) ? this.config.model : null,
      dailyLimit: DAILY_LIMIT[role] ?? 0,
      usedToday: used,
      canUseExercise: role === 'TEACHER' || role === 'ADMIN',
    };
  }

  /** Bugungi kun (UTC yarim tunidan). AiUsage.day = DATE turida. */
  private today(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  private async usedToday(userId: string): Promise<number> {
    const row = await this.prisma.aiUsage.findUnique({
      where: { userId_day: { userId, day: this.today() } },
    });
    return row?.requests ?? 0;
  }

  async conversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, task: true, updatedAt: true },
    });
  }

  async messages(userId: string, conversationId: string) {
    // Egasi bo'lmasa 404: boshqa odamning suhbati BORLIGI ham bilinmasin.
    const convo = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true, title: true, task: true },
    });
    if (!convo) throw new NotFoundException('Suhbat topilmadi');
    const rows = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return { ...convo, messages: rows };
  }

  async remove(userId: string, conversationId: string) {
    const convo = await this.prisma.aiConversation.findFirst({ where: { id: conversationId, userId }, select: { id: true } });
    if (!convo) throw new NotFoundException('Suhbat topilmadi');
    await this.prisma.aiConversation.delete({ where: { id: conversationId } });
    return { ok: true };
  }

  async ask(userId: string, role: string, level: string | undefined, dto: AskDto) {
    if (!aiEnabled(this.config)) {
      throw new ServiceUnavailableException({
        message: "AI yordamchi hozir yoqilmagan. Ustoz yoki administrator sozlashi kerak",
        code: 'AI_DISABLED',
      });
    }

    const task = dto.task as PromptTask;
    if (TEACHER_ONLY.includes(task) && role !== 'TEACHER' && role !== 'ADMIN') {
      throw new BadRequestException('Bu funksiya faqat ustozlar uchun');
    }

    const text = dto.message.trim();
    if (!text) throw new BadRequestException("Matn bo'sh");
    if (text.length > MAX_INPUT_CHARS[task]) {
      throw new BadRequestException(`Matn juda uzun. Ko'pi bilan ${MAX_INPUT_CHARS[task]} belgi`);
    }

    // ── Kunlik limit ──
    const limit = DAILY_LIMIT[role] ?? 0;
    const used = await this.usedToday(userId);
    if (used >= limit) {
      throw new BadRequestException({
        message: `Bugunga AI limiti tugadi (${limit} so'rov). Ertaga yangilanadi`,
        code: 'AI_LIMIT',
      });
    }

    // ── Suhbatni topish yoki yaratish ──
    const convo = dto.conversationId
      ? await this.prisma.aiConversation.findFirst({ where: { id: dto.conversationId, userId }, select: { id: true, task: true } })
      : null;
    if (dto.conversationId && !convo) throw new NotFoundException('Suhbat topilmadi');

    const conversationId =
      convo?.id ??
      (
        await this.prisma.aiConversation.create({
          data: { userId, task, title: text.slice(0, 60) },
          select: { id: true },
        })
      ).id;

    // ── AI ga yuboriladigan tarix ──
    // Faqat CHAT da tarix kerak: grammatika tuzatish va tushuntirish
    // har safar mustaqil so'rov, tarix ularda faqat xarajat qo'shadi.
    let history: AiChatMessage[] = [];
    if (task === 'CHAT') {
      const prev = await this.prisma.aiMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: CONTEXT_MESSAGES,
        select: { role: true, content: true },
      });
      history = prev
        .reverse()
        .map((m) => ({ role: m.role === 'ASSISTANT' ? ('assistant' as const) : ('user' as const), content: m.content }));
    }

    // ── So'rov ──
    let reply: { text: string; model: string };
    try {
      reply = await callAi({
        config: this.config,
        system: systemPrompt(task, level),
        messages: [...history, { role: 'user', content: text }],
        maxOutputChars: MAX_OUTPUT_CHARS[task],
      });
    } catch (error) {
      // Provayderning xato matnida kalit bo'lishi mumkin — faqat jurnalga.
      if (error instanceof AiProviderError) {
        this.log.error(`AI ${this.config.provider} ${error.status}: ${error.detail}`);
        if (error.status === 429) {
          throw new ServiceUnavailableException({
            message: "AI xizmati hozir band (kunlik umumiy kvota). Birozdan keyin urinib ko'ring",
            code: 'AI_BUSY',
          });
        }
      } else {
        this.log.error(`AI so'rovi muvaffaqiyatsiz: ${String(error)}`);
      }
      throw new ServiceUnavailableException({
        message: "AI javob bermadi. Birozdan keyin qayta urinib ko'ring",
        code: 'AI_FAILED',
      });
    }

    // ── Saqlash va hisob ──
    // Hisobni so'rov MUVAFFAQIYATLI bo'lganda oshiramiz: AI ishlamasa
    // foydalanuvchining limiti behuda yo'qolmasin.
    const [, , usage] = await this.prisma.$transaction([
      this.prisma.aiMessage.createMany({
        data: [
          { conversationId, role: 'USER', content: text },
          { conversationId, role: 'ASSISTANT', content: reply.text, model: reply.model },
        ],
      }),
      this.prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
      this.prisma.aiUsage.upsert({
        where: { userId_day: { userId, day: this.today() } },
        create: { userId, day: this.today(), requests: 1, chars: text.length + reply.text.length },
        update: { requests: { increment: 1 }, chars: { increment: text.length + reply.text.length } },
      }),
    ]);

    return {
      conversationId,
      answer: reply.text,
      model: reply.model,
      usedToday: usage.requests,
      dailyLimit: limit,
    };
  }
}
