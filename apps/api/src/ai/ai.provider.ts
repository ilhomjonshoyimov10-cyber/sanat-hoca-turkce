// AI provayderi bilan aloqa.
//
// LOYIHA QARORI — nega bitta provayderga bog'lanmaymiz:
//
// Bepul tierlar tez o'zgaradi va shartlari ham bir xil emas. Masalan Google
// Gemini bepul tierida yuborilgan matnni "mahsulotlarini yaxshilash" uchun
// ishlatadi (pullik tierida ishlatmaydi). Maktab uchun bu muhim: o'quvchi
// yozgan mashq uchinchi tomonga o'qitish uchun ketadi.
//
// Shuning uchun provayder .env dagi BITTA qator bilan almashadi. Bugun
// bepul Gemini, ertaga pullik Gemini yoki Groq — kodga tegilmaydi.
//
// Kalit faqat shu serverda qoladi: brauzerga HECH QACHON yuborilmaydi.

export type AiChatMessage = { role: 'user' | 'assistant'; content: string };

export type AiReply = { text: string; model: string };

export type ProviderName = 'gemini' | 'groq' | 'openai' | 'anthropic' | 'none';

/** Provayder sozlamalari: .env dan o'qiladi, ilova ishga tushganda bir marta. */
export type AiConfig = {
  provider: ProviderName;
  apiKey: string;
  model: string;
  /** Asosiy model ishlamasa — navbat bilan shular sinab ko'riladi. */
  fallbackModels: string[];
  /** So'rov necha millisekundda bekor qilinadi. AI sekin bo'lsa sayt kutib qolmasin. */
  timeoutMs: number;
};

export function readAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const provider = (env.AI_PROVIDER ?? 'none').toLowerCase() as ProviderName;
  const defaults: Record<string, string> = {
    gemini: 'gemini-flash-latest',
    groq: 'openai/gpt-oss-120b',
    openai: 'gpt-5-mini',
    anthropic: 'claude-haiku-5-5',
  };
  const fallbackDefaults: Record<string, string> = {
    // Bepul tierda har bir model uchun kvota alohida: biri tugasa, boshqasi ishlaydi
    gemini: 'gemini-2.5-flash,gemini-2.0-flash',
  };
  const model = env.AI_MODEL ?? defaults[provider] ?? '';
  const fallbacks = (env.AI_FALLBACK_MODELS ?? fallbackDefaults[provider] ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m && m !== model);
  return {
    provider,
    apiKey: env.AI_API_KEY ?? '',
    model,
    fallbackModels: fallbacks,
    // Vercel funksiyasi 30 soniyada uziladi — bitta urinish 12 soniyadan oshmasin
    timeoutMs: Number(env.AI_TIMEOUT_MS ?? 12_000),
  };
}

/** AI yoqilganmi: provayder ham, kalit ham bo'lishi shart. */
export const aiEnabled = (c: AiConfig) => c.provider !== 'none' && c.apiKey.length > 0;

// ───────────────────────── Shaxsiy ma'lumotni tozalash ─────────────────────────

// Hatto provayder ma'lumotni saqlamasligini aytsa ham, kerak bo'lmagan
// narsani yubormaslik eng ishonchli yo'l. Bu funksiya AI ga ketadigan
// matndan email, telefon va uzun raqamlarni olib tashlaydi.
//
// E'tibor bering: bu "tsenzura" emas — o'quvchining turkcha mashqi
// o'zgarmaydi. Faqat shaxsni aniqlaydigan bo'laklar almashtiriladi.

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
// +998 90 123 45 67, 901234567, (90) 123-45-67 kabi shakllar
const PHONE = /(?:\+?\d[\d\s()-]{7,}\d)/g;
// 12 va undan ortiq raqam: karta, pasport, hisob raqami
const LONG_DIGITS = /\b\d{12,}\b/g;

export function stripPersonalData(text: string): string {
  return text
    .replace(EMAIL, '[email olib tashlandi]')
    .replace(PHONE, '[raqam olib tashlandi]')
    .replace(LONG_DIGITS, '[raqam olib tashlandi]');
}

// ───────────────────────── Provayderlar ─────────────────────────

type CallArgs = { config: AiConfig; system: string; messages: AiChatMessage[]; maxOutputChars: number };

/** Javob uzunligini belgi emas, token bilan chegaralaymiz (taxminan 4 belgi = 1 token). */
const toTokens = (chars: number) => Math.max(64, Math.ceil(chars / 3));

async function postJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    // Provayderning xato matnini jurnalga chiqaramiz, lekin foydalanuvchiga
    // uzatmaymiz: unda kalit yoki ichki ma'lumot bo'lishi mumkin.
    const detail = typeof body === 'object' && body ? JSON.stringify(body).slice(0, 500) : String(res.status);
    throw new AiProviderError(res.status, detail);
  }
  return body;
}

export class AiProviderError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`AI provayder xatosi: ${status}`);
  }
}

function textFromPath(data: unknown, path: (string | number)[]): string | undefined {
  let node: unknown = data;
  for (const key of path) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string | number, unknown>)[key];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Gemini javobidagi matn: "o'ylash" (thought) qismlarisiz, barcha qismlar birga. */
function geminiText(data: unknown): string | undefined {
  const parts = (data as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('').trim();
  return text || undefined;
}

/**
 * Gemini.
 *
 * MUHIM XATO TUZATILDI: yangi "flash" modellari javob berishdan oldin
 * "o'ylaydi" va bu o'ylash tokenlari javob chegarasidan (maxOutputTokens)
 * yeyiladi. Chegara kichik bo'lsa (300 token), hamma token o'ylashga
 * ketib, javob BO'SH qaytardi — sayt "AI javob bermadi" der edi.
 * Endi: o'ylash o'chiriladi (model qo'llasa), chegara keng beriladi,
 * uzunlikni esa o'zimiz qirqamiz.
 */
async function callGemini({ config, system, messages, maxOutputChars }: CallArgs): Promise<AiReply> {
  const body = (thinking: boolean) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      // Gemini'da yordamchi roli "model" deb ataladi
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: Math.max(2048, toTokens(maxOutputChars) * 4),
        ...(thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
  const init = (thinking: boolean): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
    body: body(thinking),
  });

  let data: unknown;
  try {
    data = await postJson(url, init(true), config.timeoutMs);
  } catch (e) {
    // Ba'zi modellar o'ylashni o'chirishga ruxsat bermaydi — sozlamasiz qayta
    if (e instanceof AiProviderError && e.status === 400 && /thinking/i.test(e.detail)) {
      data = await postJson(url, init(false), config.timeoutMs);
    } else {
      throw e;
    }
  }
  const text = geminiText(data);
  if (!text) {
    const reason = textFromPath(data, ['candidates', 0, 'finishReason']) ?? textFromPath(data, ['promptFeedback', 'blockReason']) ?? 'EMPTY';
    throw new AiProviderError(502, `Gemini bo'sh javob qaytardi (${reason})`);
  }
  return { text: clip(text, maxOutputChars), model: config.model };
}

/** Javob juda uzun bo'lsa — gap oxirida qirqamiz (chegaraning 2 barobari). */
function clip(text: string, maxChars: number): string {
  const limit = maxChars * 2;
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'));
  return (end > limit * 0.6 ? cut.slice(0, end + 1) : cut) + ' …';
}

/** Groq va OpenAI bir xil (OpenAI-mos) so'rov shaklini ishlatadi. */
async function callOpenAiCompatible({ config, system, messages, maxOutputChars }: CallArgs): Promise<AiReply> {
  const base = config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
  const data = await postJson(
    `${base}/chat/completions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.4,
        max_tokens: toTokens(maxOutputChars),
      }),
    },
    config.timeoutMs,
  );
  const text = textFromPath(data, ['choices', 0, 'message', 'content']);
  if (!text) throw new AiProviderError(502, 'Provayder bo\'sh javob qaytardi');
  return { text, model: config.model };
}

async function callAnthropic({ config, system, messages, maxOutputChars }: CallArgs): Promise<AiReply> {
  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        system,
        messages,
        max_tokens: toTokens(maxOutputChars),
        temperature: 0.4,
      }),
    },
    config.timeoutMs,
  );
  const text = textFromPath(data, ['content', 0, 'text']);
  if (!text) throw new AiProviderError(502, 'Anthropic bo\'sh javob qaytardi');
  return { text, model: config.model };
}

/**
 * Tanlangan provayderga so'rov yuboradi. Shaxsiy ma'lumot avval tozalanadi.
 *
 * Asosiy model ishlamasa (kvota tugadi, model nomi eskirdi, bo'sh javob)
 * — zaxira modellar navbat bilan sinab ko'riladi. Kalit noto'g'ri
 * bo'lsa (401/403) — boshqa model ham yordam bermaydi, darhol xato.
 * Umumiy vaqt Vercel chegarasidan (30 s) oshmasligi uchun 2 tagacha zaxira.
 */
export async function callAi(args: CallArgs): Promise<AiReply> {
  const models = [args.config.model, ...args.config.fallbackModels].slice(0, 3);
  let last: unknown;
  const started = Date.now();
  for (const model of models) {
    if (Date.now() - started > 20_000) break;
    try {
      return await callOnce({ ...args, config: { ...args.config, model } });
    } catch (e) {
      last = e;
      if (e instanceof AiProviderError && (e.status === 401 || e.status === 403)) throw e;
    }
  }
  throw last instanceof Error ? last : new AiProviderError(503, String(last));
}

async function callOnce(args: CallArgs): Promise<AiReply> {
  const clean: CallArgs = {
    ...args,
    messages: args.messages.map((m) => ({ role: m.role, content: stripPersonalData(m.content) })),
  };
  switch (args.config.provider) {
    case 'gemini':
      return callGemini(clean);
    case 'groq':
    case 'openai':
      return callOpenAiCompatible(clean);
    case 'anthropic':
      return callAnthropic(clean);
    default:
      throw new AiProviderError(503, 'AI provayder sozlanmagan');
  }
}
