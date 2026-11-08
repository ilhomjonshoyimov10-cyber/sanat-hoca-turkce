import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizePhone } from '../auth/auth.utils.js';
import { CreateLeadDto } from './leads.dto.js';

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    // Bot to'ldirgan bo'lsa: jim "muvaffaqiyat" qaytaramiz, hech narsa saqlamaymiz
    if (dto.website) return { ok: true };

    const phone = normalizePhone(dto.phone);
    if (!phone) throw new BadRequestException("Telefon raqam noto'g'ri. Namuna: +998901234567");

    // Bir raqamdan 24 soat ichida takroriy ariza saqlanmaydi (spam va ikki marta bosishdan himoya).
    // Javob har doim bir xil, shuning uchun raqam bazada bor-yo'qligini bilib bo'lmaydi.
    const duplicate = await this.prisma.lead.findFirst({
      where: { phone, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
      select: { id: true },
    });
    if (!duplicate) {
      await this.prisma.lead.create({
        data: {
          name: dto.name.trim(),
          phone,
          level: dto.level,
          message: dto.message?.trim() || undefined,
        },
      });
    }
    return { ok: true };
  }

  list() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
