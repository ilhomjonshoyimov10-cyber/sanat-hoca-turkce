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

/** Admin uchun: AI oxirgi marta qachon ishladi / nima xato berdi (xotirada). */
const health = { lastOkAt: null as Date | null, lastErrorAt: null as Date | null, lastError: null as string | null };

/** Provayder xatosidan admin uchun qisqa, kalitsiz izoh. */
function describeError(error: unknown): string {
  if (error instanceof AiProviderError) {
    const msg = /"message"\s*:\s*"([^"]{1,200})/.exec(error.detail)?.[1] ?? error.detail.slice(0, 200);
    return `${error.status}: ${msg}`.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[kalit]');
  }
  return String(error).slice(0, 200);
}

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
      ...(role === 'ADMIN' ? { health: { ...health, fallbackModels: this.config.fallbackModels } } : {}),
    };
  }

  // ───────────────────────── Admin: barcha suhbatlar ─────────────────────────

  /**
   * Admin hamma foydalanuvchining AI suhbatlarini ko'radi (qidiruv, sahifa).
   * Bu o'quv markazi qoidasi: AI dars vositasi, shuning uchun ustoz va
   * admin nimalar so'ralganini biladi. Maxfiylik siyosatida yozilgan.
   */
  async adminConversations(q: { search?: string; userId?: string; failed?: boolean; page?: number }) {
    const take = 30;
    const page = Math.max(0, Math.min(1000, Number(q.page ?? 0) || 0));
    const term = q.search?.trim();
    const where = {
      ...(q.userId ? { userId: q.userId } : {}),
      ...(q.failed ? { messages: { some: { error: { not: null } } } } : {}),
      ...(term
        ? {
            OR: [
              { title: { contains: term, mode: 'insensitive' as const } },
              { messages: { some: { content: { contains: term, mode: 'insensitive' as const } } } },
              { user: { OR: [
                { firstName: { contains: term, mode: 'insensitive' as const } },
                { lastName: { contains: term, mode: 'insensitive' as const } },
              ] } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: page * take,
        take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } },
          _count: { select: { messages: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { role: true, content: true, error: true, createdAt: true } },
        },
      }),
      this.prisma.aiConversation.count({ where }),
    ]);
    return {
      total,
      page,
      pages: Math.ceil(total / take),
      items: rows.map((c) => ({
        id: c.id,
        title: c.title,
        task: c.task,
        updatedAt: c.updatedAt,
        user: { id: c.user.id, name: `${c.user.firstName} ${c.user.lastName}`, role: c.user.role },
        messages: c._count.messages,
        last: c.messages[0] ?? null,
      })),
    };
  }

  async adminConversation(id: string) {
    const c = await this.prisma.aiConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        messages: { orderBy: { createdAt: 'asc' }, select: { id: true, role: true, content: true, error: true, model: true, createdAt: true } },
      },
    });
    if (!c) throw new NotFoundException('Suhbat topilmadi');
    return {
      id: c.id, title: c.title, task: c.task, createdAt: c.createdAt, updatedAt: c.updatedAt,
      user: { id: c.user.id, name: `${c.user.firstName} ${c.user.lastName}`, role: c.user.role },
      messages: c.messages,
    };
  }

  async adminDelete(id: string) {
    const c = await this.prisma.aiConversation.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Suhbat topilmadi');
    await this.prisma.aiConversation.delete({ where: { id } });
    return { ok: true };
  }

  async adminStats() {
    const today = this.today();
    const [conversations, messages, failedToday, usage] = await Promise.all([
      this.prisma.aiConversation.count(),
      this.prisma.aiMessage.count({ where: { role: 'USER' } }),
      this.prisma.aiMessage.count({ where: { error: { not: null }, createdAt: { gte: today } } }),
      this.prisma.aiUsage.findMany({ where: { day: today }, select: { requests: true } }),
    ]);
    return {
      enabled: aiEnabled(this.config),
      provider: this.config.provider,
      model: this.config.model,
      fallbackModels: this.config.fallbackModels,
      conversations,
      questions: messages,
      today: { answered: usage.reduce((n, u) => n + u.requests, 0), users: usage.length, failed: failedToday },
      health,
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
      select: { id: true, role: true, content: true, error: true, createdAt: true },
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
        where: { conversationId, error: null, content: { not: '' } },
        orderBy: { createdAt: 'desc' },
        take: CONTEXT_MESSAGES,
        select: { role: true, content: true },
      });
      // Javobsiz qolgan savollar ketma-ket ikki "user" qatorini beradi —
      // ba'zi provayderlar buni rad etadi, shuning uchun birlashtiramiz.
      for (const m of prev.reverse()) {
        const role = m.role === 'ASSISTANT' ? ('assistant' as const) : ('user' as const);
        const last = history[history.length - 1];
        if (last && last.role === role) last.content += `\n\n${m.content}`;
        else history.push({ role, content: m.content });
      }
      // Joriy savol ham "user" — oxirgi tarix qatori user bo'lsa, tashlab yuboramiz.
      if (history[history.length - 1]?.role === 'user') history.pop();
    }

    // ── Savol DARHOL saqlanadi ──
    // AI javob bermasa ham, o'quvchi nima so'ragani yo'qolmasin (admin
    // ko'radi, ustoz qiyinchilikni biladi).
    await this.prisma.aiMessage.create({ data: { conversationId, role: 'USER', content: text } });

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
      health.lastErrorAt = new Date();
      health.lastError = describeError(error);
      await this.prisma.aiMessage
        .create({ data: { conversationId, role: 'ASSISTANT', content: '', error: health.lastError, model: this.config.model } })
        .catch(() => undefined);
      await this.prisma.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }).catch(() => undefined);
      // Provayderning xato matnida kalit bo'lishi mumkin — faqat jurnalga.
      if (error instanceof AiProviderError) {
        this.log.error(`AI ${this.config.provider} ${error.status}: ${error.detail}`);
        if (error.status === 429) {
          throw new ServiceUnavailableException({
            message: "AI xizmati hozir band (kunlik umumiy kvota). Birozdan keyin urinib ko'ring",
            code: 'AI_BUSY',
            conversationId,
          });
        }
      } else {
        this.log.error(`AI so'rovi muvaffaqiyatsiz: ${String(error)}`);
      }
      throw new ServiceUnavailableException({
        message: "AI javob bermadi. Birozdan keyin qayta urinib ko'ring",
        code: 'AI_FAILED',
        conversationId,
      });
    }

    // ── Saqlash va hisob ──
    // Hisobni so'rov MUVAFFAQIYATLI bo'lganda oshiramiz: AI ishlamasa
    // foydalanuvchining limiti behuda yo'qolmasin.
    health.lastOkAt = new Date();
    const [, , usage] = await this.prisma.$transaction([
      this.prisma.aiMessage.create({
        data: { conversationId, role: 'ASSISTANT', content: reply.text, model: reply.model },
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
