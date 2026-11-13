// Kino va musiqa bo'limi uchun umumiy turlar va xavfsiz embed manzil.

export const MEDIA_KINDS = ["SERIES", "FILM", "MUSIC", "KIDS", "LESSON"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  description: string;
  /** Boshqa tillardagi tavsif (ixtiyoriy): { ru, en, tr } */
  descI18n: Partial<Record<"ru" | "en" | "tr", string>> | null;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | null;
  videoId: string | null;
  playlistId: string | null;
  channel: string | null;
  ytTitle: string | null;
  thumbnail: string | null;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{12,64}$/;

/**
 * youtube-nocookie.com: video bosilmaguncha YouTube kuzatuv cookie'lari
 * qo'yilmaydi. ID lar server tomonda tekshirilgan, lekin bu yerda ham
 * qat'iy tekshiramiz — iframe manziliga hech qachon "xom" matn tushmasin.
 */
export function embedUrl(m: Pick<MediaItem, "videoId" | "playlistId">, opts: { subtitles: boolean; hl: string }): string | null {
  const v = m.videoId && VIDEO_ID.test(m.videoId) ? m.videoId : null;
  const list = m.playlistId && PLAYLIST_ID.test(m.playlistId) ? m.playlistId : null;
  if (!v && !list) return null;
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
    hl: opts.hl,
  });
  if (list) params.set("list", list);
  if (opts.subtitles) {
    params.set("cc_load_policy", "1");
    params.set("cc_lang_pref", "tr");
  }
  return `https://www.youtube-nocookie.com/embed/${v ?? "videoseries"}?${params}`;
}

export function watchUrl(m: Pick<MediaItem, "videoId" | "playlistId">): string {
  if (m.videoId) return `https://www.youtube.com/watch?v=${m.videoId}${m.playlistId ? `&list=${m.playlistId}` : ""}`;
  return `https://www.youtube.com/playlist?list=${m.playlistId}`;
}

/** Tavsifni interfeys tiliga qarab tanlaydi; yo'q bo'lsa — o'zbekcha. */
export function describe(m: Pick<MediaItem, "description" | "descI18n">, locale: string, toCyr: (s: string) => string): string {
  if (locale === "ru" || locale === "en" || locale === "tr") return m.descI18n?.[locale] || m.description;
  if (locale === "oz") return toCyr(m.description);
  return m.description;
}
