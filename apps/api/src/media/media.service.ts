import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MediaItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateMediaDto, UpdateMediaDto } from './media.dto.js';
import { oembed, parseYoutube, type YoutubeRef } from './youtube.js';

/** Qayta tekshirish oralig'i: video o'chirilgan yoki yopilgan bo'lishi mumkin. */
const RECHECK_MS = 7 * 24 * 60 * 60 * 1000;
/** Bitta so'rovda nechta eski yozuvni qayta tekshiramiz (so'rov sekinlashmasin) */
const RECHECK_BATCH = 3;

const fallbackThumb = (videoId: string | null) => (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

/** Brauzerga boradigan ko'rinish: ichki maydonlarsiz. */
function view(m: MediaItem) {
  return {
    id: m.id,
    kind: m.kind,
    title: m.title,
    description: m.description,
    descI18n: (m.descI18n as Record<string, string> | null) ?? null,
    level: m.level,
    videoId: m.videoId,
    playlistId: m.playlistId,
    channel: m.channel,
    ytTitle: m.ytTitle,
    thumbnail: m.thumbnail ?? fallbackThumb(m.videoId),
  };
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Saytdagi ro'yxat: faqat e'lon qilingan va tekshiruvdan o'tganlar. */
  async list() {
    const rows = await this.prisma.mediaItem.findMany({
      where: { published: true, checkNote: null },
      // Tartib — admin belgilaganicha (kichik raqam oldinda)
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    // Eskirgan bir nechtasini fonda qayta tekshiramiz — javobni kutmaymiz
    void this.recheckStale().catch(() => undefined);
    return rows.map(view);
  }

  /** Admin ro'yxati: hammasi, tekshiruv natijasi bilan. */
  async manage() {
    const rows = await this.prisma.mediaItem.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((m) => ({ ...view(m), published: m.published, position: m.position, checkNote: m.checkNote, checkedAt: m.checkedAt }));
  }

  async create(userId: string, dto: CreateMediaDto) {
    const ref = parseYoutube(dto.url);
    if (!ref) {
      throw new BadRequestException({
        message: "YouTube havolasi tanilmadi. Video yoki pleylist havolasini qo'ying",
        code: 'BAD_YOUTUBE_URL',
      });
    }
    // Qo'shishdan OLDIN YouTube'dan tekshiramiz: mavjud emas yoki boshqa
    // saytda ko'rsatish taqiqlangan videoni saytga qo'yib bo'lmaydi.
    const check = await oembed(ref);
    if (!check.ok && check.reason === 'not_found') {
      throw new BadRequestException({ message: 'Video topilmadi yoki yopiq (private)', code: 'YT_NOT_FOUND' });
    }
    if (!check.ok && check.reason === 'not_embeddable') {
      throw new BadRequestException({
        message: "Bu video egasi boshqa saytlarda ko'rsatishni taqiqlagan — qo'shib bo'lmaydi",
        code: 'YT_NOT_EMBEDDABLE',
      });
    }

    const title = dto.title?.trim() || (check.ok ? check.title : '') || 'YouTube';
    const created = await this.prisma.mediaItem.create({
      data: {
        kind: dto.kind,
        title,
        description: dto.description?.trim() ?? '',
        level: dto.level ?? null,
        videoId: ref.videoId,
        playlistId: ref.playlistId,
        // Tartib berilmasa — ro'yxat oxiriga
        position: dto.position ?? (await this.nextPosition()),
        published: dto.published ?? true,
        createdById: userId,
        ...(check.ok
          ? { channel: check.channel, ytTitle: check.title, thumbnail: check.thumbnail, checkedAt: new Date() }
          : {}), // tarmoq xatosi: keyinroq fonda tekshiriladi
      },
    });
    return view(created);
  }

  async update(id: string, dto: UpdateMediaDto) {
    await this.mustExist(id);
    const data: Prisma.MediaItemUpdateInput = {};
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.published !== undefined) data.published = dto.published;
    return view(await this.prisma.mediaItem.update({ where: { id }, data }));
  }

  async remove(id: string) {
    await this.mustExist(id);
    await this.prisma.mediaItem.delete({ where: { id } });
    return { ok: true };
  }

  /** Admin "qayta tekshirish" tugmasi. */
  async recheck(id: string) {
    const m = await this.mustExist(id);
    await this.applyCheck(m);
    return this.manage();
  }

  private async nextPosition() {
    const last = await this.prisma.mediaItem.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });
    return (last?.position ?? -1) + 1;
  }

  private async mustExist(id: string) {
    const m = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!m) throw new NotFoundException({ message: 'Topilmadi', code: 'NOT_FOUND' });
    return m;
  }

  /** Bir yozuvni YouTube'dan tekshirib, natijani saqlaydi. */
  async applyCheck(m: Pick<MediaItem, 'id' | 'videoId' | 'playlistId'>) {
    const ref: YoutubeRef = { videoId: m.videoId, playlistId: m.playlistId };
    const r = await oembed(ref);
    if (!r.ok && r.reason === 'network') return; // vaqtinchalik — tegmaymiz
    // Kanalning "barcha videolari" pleylisti (UU...) uchun oEmbed ba'zan
    // 404 qaytaradi, garchi pleyerda ishlasa ham. Shuning uchun pleylistni
    // faqat "embed taqiqlangan" bo'lsa yashiramiz.
    if (!r.ok && r.reason === 'not_found' && !ref.videoId) {
      await this.prisma.mediaItem.update({ where: { id: m.id }, data: { checkedAt: new Date() } });
      return;
    }
    await this.prisma.mediaItem.update({
      where: { id: m.id },
      data: r.ok
        ? { channel: r.channel, ytTitle: r.title, thumbnail: r.thumbnail, checkedAt: new Date(), checkNote: null }
        : { checkedAt: new Date(), checkNote: r.reason },
    });
  }

  private rechecking = false;

  /** Hech tekshirilmagan yoki eskirgan yozuvlarni oz-ozdan tekshiradi. */
  async recheckStale() {
    if (this.rechecking) return;
    this.rechecking = true;
    try {
      const stale = await this.prisma.mediaItem.findMany({
        where: { OR: [{ checkedAt: null }, { checkedAt: { lt: new Date(Date.now() - RECHECK_MS) } }] },
        orderBy: { checkedAt: { sort: 'asc', nulls: 'first' } },
        take: RECHECK_BATCH,
        select: { id: true, videoId: true, playlistId: true },
      });
      for (const m of stale) await this.applyCheck(m);
    } finally {
      this.rechecking = false;
    }
  }
}
