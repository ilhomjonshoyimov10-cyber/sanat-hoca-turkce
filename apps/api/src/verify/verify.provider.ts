// Tasdiqlash xabarlarini yuborish.
//
// AI moduli bilan bir xil mantiq: provayder .env dagi bitta qator bilan
// almashadi va kalit faqat shu serverda qoladi.
//
// MUHIM — SMS YO'Q. Nega:
//   SMS provayderi pullik va O'zbekistonda operator bilan shartnoma
//   talab qiladi. Shuning uchun telefon raqami TASDIQLANMAYDI: u faqat
//   ustoz qo'ng'iroq qilishi uchun saqlanadi. Buni foydalanuvchiga ham
//   ochiq aytamiz — "tasdiqlangan" degan yolg'on belgi qo'ymaymiz.

export type VerifyChannelName = 'EMAIL' | 'TELEGRAM';

export type VerifyConfig = {
  /** Resend API kaliti (email uchun). Bo'sh bo'lsa email kanali o'chiq. */
  emailApiKey: string;
  /** Xat kimdan keladi, masalan "Sanat Hoca <salom@domen.uz>". */
  emailFrom: string;
  /** Telegram bot tokeni (@BotFather beradi). Bo'sh bo'lsa kanal o'chiq. */
  telegramBotToken: string;
  /** Botning foydalanuvchi nomi (@ belgisiz) — havola yasash uchun. */
  telegramBotUsername: string;
  /** Webhook manzilidagi maxfiy qism: faqat Telegram biladi. */
  telegramWebhookSecret: string;
  timeoutMs: number;
};

export function readVerifyConfig(env: NodeJS.ProcessEnv = process.env): VerifyConfig {
  return {
    emailApiKey: env.RESEND_API_KEY ?? '',
    emailFrom: env.EMAIL_FROM ?? '',
    telegramBotToken: env.TELEGRAM_BOT_TOKEN ?? '',
    telegramBotUsername: env.TELEGRAM_BOT_USERNAME ?? '',
    telegramWebhookSecret: env.TELEGRAM_WEBHOOK_SECRET ?? '',
    timeoutMs: Number(env.VERIFY_TIMEOUT_MS ?? 15_000),
  };
}

export const emailEnabled = (c: VerifyConfig) => c.emailApiKey.length > 0 && c.emailFrom.length > 0;
export const telegramEnabled = (c: VerifyConfig) =>
  c.telegramBotToken.length > 0 && c.telegramBotUsername.length > 0;

export class VerifySendError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`Tasdiqlash xabarini yuborib bo'lmadi: ${status}`);
  }
}

async function post(url: string, init: RequestInit, timeoutMs: number): Promise<void> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    // Provayderning javobi jurnalga tushadi, foydalanuvchiga EMAS:
    // unda kalit yoki ichki ma'lumot bo'lishi mumkin.
    const body = await res.text().catch(() => '');
    throw new VerifySendError(res.status, body.slice(0, 400));
  }
}

/** HTML emas, oddiy matn: xat ishonchli yetib boradi va spamga tushmaydi. */
export async function sendEmailCode(c: VerifyConfig, to: string, code: string): Promise<void> {
  const text = [
    'Sanat Hoca Türkçe',
    '',
    `Tasdiqlash kodingiz: ${code}`,
    '',
    "Kod 10 daqiqa ishlaydi. Agar bu so'rovni siz yubormagan bo'lsangiz,",
    "bu xatni e'tiborsiz qoldiring — hisobingizga hech narsa bo'lmaydi.",
  ].join('\n');

  await post(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.emailApiKey}` },
      body: JSON.stringify({
        from: c.emailFrom,
        to: [to],
        subject: `Tasdiqlash kodi: ${code}`,
        text,
      }),
    },
    c.timeoutMs,
  );
}

/** Telegram botga bog'lanish havolasi. Foydalanuvchi bosadi -> bot /start oladi. */
export function telegramLink(c: VerifyConfig, token: string): string {
  return `https://t.me/${c.telegramBotUsername}?start=${token}`;
}

export async function sendTelegramMessage(c: VerifyConfig, chatId: string, text: string): Promise<void> {
  await post(
    `https://api.telegram.org/bot${c.telegramBotToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    },
    c.timeoutMs,
  );
}
