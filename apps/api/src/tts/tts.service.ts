import { createHash } from 'node:crypto';
import { BadRequestException, HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { put } from '@vercel/blob';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiProviderError, isKeyProblem, readAiConfig, shortError } from '../ai/ai.provider.js';
import { synthesize } from './tts.provider.js';

/** Bitta so'rovdagi matn chegarasi. So'z/gap uchun yetarli, butun kitob uchun emas. */
export const TTS_MAX_CHARS = 420;

/** Kuniga YANGI yaratiladigan ovozlar soni (keshdagilar hisobga kirmaydi). */
const DAILY_NEW: Record<string, number> = { STUDENT: 150, PARENT: 40, TEACHER: 600, ADMIN: 600 };

/** Matnni bir xil ko'rinishga keltiradi: "  Ev " va "Ev" bir xil fayl bo'lsin. */
export function normalizeTts(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Ovoz fayllari: har bir matn BIR MARTA yaratiladi va Vercel Blob'da
 * saqlanadi. Keyingi safar hamma o'quvchi tayyor faylni oladi — AI kvotasi
 * tejaladi, ovoz darhol chiqadi.
 *
 * Blob kaliti bo'lmasa (lokal ishlab chiqish) — fayl xotirada saqlanadi
 * va data: URL qaytariladi.
 */
@Injectable()
export class TtsService {
  private readonly log = new Logger(TtsService.name);
  private readonly config = readAiConfig();
  private readonly voice = process.env.AI_TTS_VOICE ?? 'Kore';
  private readonly extraModels = (process.env.AI_TTS_MODEL ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  /** Bir xil matn bir vaqtda ikki marta so'ralsa — bitta yaratish */
  private readonly inflight = new Map<string, Promise<string>>();
  /** Blob yo'q bo'lganda (lokal) — oxirgi 300 ta fayl xotirada */
  private readonly memory = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  get enabled() {
    return this.config.provider === 'gemini' && this.config.apiKey.length > 0;
  }

  keyOf(text: string) {
    return createHash('sha256').update(`v1|${this.voice}|${text}`).digest('hex').slice(0, 40);
  }

  async speak(userId: string, role: string, rawText: string): Promise<{ url: string; cached: boolean }> {
    const text = normalizeTts(rawText ?? '');
    if (!text) throw new BadRequestException('Matn bo\'sh');
    if (text.length > TTS_MAX_CHARS) throw new BadRequestException(`Matn juda uzun (ko'pi bilan ${TTS_MAX_CHARS} belgi)`);
    if (!this.enabled) throw new ServiceUnavailableException({ message: 'Ovoz xizmati yoqilmagan', code: 'TTS_OFF' });

    const id = this.keyOf(text);
    const mem = this.memory.get(id);
    if (mem) return { url: mem, cached: true };
    const row = await this.prisma.ttsClip.findUnique({ where: { id } });
    if (row) return { url: row.url, cached: true };

    // Kunlik chegara — faqat yangi fayllar uchun
    const since = new Date(Date.now() - 24 * 3600_000);
    const made = await this.prisma.ttsClip.count({ where: { createdById: userId, createdAt: { gte: since } } });
    if (made >= (DAILY_NEW[role] ?? 40)) {
      throw new HttpException({ message: "Bugungi ovoz chegarasi tugadi. Ertaga davom eting", code: 'TTS_LIMIT' }, 429);
    }

    const running = this.inflight.get(id);
    if (running) return { url: await running, cached: true };
    const job = this.create(id, text, userId).finally(() => this.inflight.delete(id));
    this.inflight.set(id, job);
    return { url: await job, cached: false };
  }

  private async create(id: string, text: string, userId: string): Promise<string> {
    let audio: Awaited<ReturnType<typeof synthesize>>;
    try {
      audio = await synthesize(this.config, text, this.voice, this.extraModels);
    } catch (e) {
      this.log.error(`TTS: ${e instanceof AiProviderError ? `${e.status} ${e.detail}` : String(e)}`);
      throw new ServiceUnavailableException({
        message: isKeyProblem(e) ? 'Ovoz xizmati kaliti ishlamayapti (admin xabardor)' : "Ovoz hozir yaratilmadi. Birozdan keyin urinib ko'ring",
        code: 'TTS_FAILED',
        detail: shortError(e),
      });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      const url = `data:${audio.mime};base64,${audio.audio.toString('base64')}`;
      this.memory.set(id, url);
      if (this.memory.size > 300) this.memory.delete(this.memory.keys().next().value as string);
      return url;
    }

    const ext = audio.mime === 'audio/wav' ? 'wav' : audio.mime.split('/')[1] || 'bin';
    const blob = await put(`tts/${id}.${ext}`, audio.audio, {
      access: 'public',
      contentType: audio.mime,
      addRandomSuffix: false,
      allowOverwrite: true,
      // Fayl nomi matndan olinadi va hech qachon o'zgarmaydi — bir yil keshlansin
      cacheControlMaxAge: 365 * 24 * 3600,
      token,
    });
    await this.prisma.ttsClip
      .upsert({
        where: { id },
        create: { id, text, url: blob.url, bytes: audio.audio.length, model: audio.model, createdById: userId },
        update: {},
      })
      .catch((e: unknown) => this.log.warn(`TTS yozuvi saqlanmadi: ${String(e)}`));
    return blob.url;
  }
}
