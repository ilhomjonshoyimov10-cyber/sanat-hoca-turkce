/**
 * Jitsi xonasiga kirish havolasi (meet.jit.si — bepul ommaviy server).
 *
 * MUHIM — nega sayt ichida (iframe) emas, yangi oynada:
 * meet.jit.si boshqa saytga joylashtirilganda qo'ng'iroqni 5 daqiqadan
 * keyin uzadi (ularning bepul server qoidasi), kamera/mikrofon ruxsati esa
 * iframe ichida ko'p brauzerda (ayniqsa telefonda) ishlamaydi. Yangi oynada
 * cheklov yo'q.
 *
 * O'quvchilar mikrofon va kamera O'CHIQ holda kiradi: 100 kishilik darsda
 * hamma bir vaqtda gapirsa, hech narsa eshitilmaydi. Ustoz — yoqiq.
 */
export const JITSI_HOST = 'meet.jit.si';

export function jitsiUrl(roomName: string, displayName: string, isHost: boolean): string {
  const q = (k: string, v: string | boolean) => `${k}=${encodeURIComponent(typeof v === 'string' ? JSON.stringify(v) : String(v))}`;
  const hash = [
    q('userInfo.displayName', displayName.slice(0, 60)),
    q('config.prejoinConfig.enabled', true),
    q('config.disableDeepLinking', true),
    q('config.startWithAudioMuted', !isHost),
    q('config.startWithVideoMuted', !isHost),
  ].join('&');
  return `https://${JITSI_HOST}/${encodeURIComponent(roomName)}#${hash}`;
}
