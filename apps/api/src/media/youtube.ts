// YOUTUBE HAVOLALARI.
//
// Admin har xil shaklda havola qo'yadi: youtube.com/watch?v=..,
// youtu.be/.., m.youtube.com, /shorts/.., /embed/.., /playlist?list=..
// Biz faqat ID ni saqlaymiz va o'zimiz xavfsiz embed manzil yasaymiz —
// admin kiritgan matn hech qachon iframe src ga to'g'ridan-to'g'ri
// tushmaydi.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^(PL|UU|OL|FL|LL|RD|UL)[A-Za-z0-9_-]{10,60}$/;
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

export interface YoutubeRef {
  videoId: string | null;
  playlistId: string | null;
}

/** Havoladan ID larni ajratadi. Noto'g'ri havola bo'lsa — null. */
export function parseYoutube(raw: string): YoutubeRef | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  let videoId: string | null = null;

  if (host === 'youtu.be') videoId = parts[0] ?? null;
  else if (parts[0] === 'watch') videoId = url.searchParams.get('v');
  else if (['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? '')) videoId = parts[1] ?? null;

  if (videoId === 'videoseries') videoId = null;
  const list = url.searchParams.get('list');

  const v = videoId && VIDEO_ID.test(videoId) ? videoId : null;
  const p = list && PLAYLIST_ID.test(list) ? list : null;
  if (!v && !p) return null;
  return { videoId: v, playlistId: p };
}

/** Kanalning barcha videolari pleylisti: UCxxxx -> UUxxxx (YouTube qoidasi). */
export function uploadsPlaylist(channelId: string): string | null {
  return /^UC[A-Za-z0-9_-]{22}$/.test(channelId) ? `UU${channelId.slice(2)}` : null;
}

export function watchUrl(ref: YoutubeRef): string {
  if (ref.videoId) {
    return `https://www.youtube.com/watch?v=${ref.videoId}${ref.playlistId ? `&list=${ref.playlistId}` : ''}`;
  }
  return `https://www.youtube.com/playlist?list=${ref.playlistId}`;
}

export type OembedResult =
  | { ok: true; title: string; channel: string; thumbnail: string | null }
  | { ok: false; reason: 'not_found' | 'not_embeddable' | 'network' };

/**
 * YouTube'ning o'zidan tekshiradi (oEmbed): video bormi, boshqa saytda
 * ko'rsatishga ruxsat bormi, kanal nomi va sarlavhasi qanday.
 *
 * 401/403 — egasi embed'ni o'chirgan; 404/400 — video yo'q yoki yopiq.
 * Tarmoq xatosi — "network": bunda video o'chirilmaydi, keyinroq qayta
 * tekshiriladi (vaqtinchalik nosozlik sabab kontent yo'qolmasin).
 */
export async function oembed(ref: YoutubeRef, timeoutMs = 6000): Promise<OembedResult> {
  const target = encodeURIComponent(watchUrl(ref));
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${target}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'not_embeddable' };
    if (res.status === 404 || res.status === 400) return { ok: false, reason: 'not_found' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const j = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    const thumb = j.thumbnail_url && /^https:\/\/i\.ytimg\.com\//.test(j.thumbnail_url) ? j.thumbnail_url : null;
    return { ok: true, title: String(j.title ?? '').slice(0, 300), channel: String(j.author_name ?? '').slice(0, 120), thumbnail: thumb };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
