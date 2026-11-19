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

/**
 * Gemini modellari navbati (2026-yil noyabr holati).
 *
 * NEGA O'ZGARDI: gemini-2.0-flash 2026-yil 1-iyunda butunlay o'chirildi,
 * gemini-2.5-* esa faqat oldindan ishlatgan loyihalarga ochiq. Eski navbat
 * ("2.5-flash, 2.0-flash") yangi kalitda HAR DOIM xato berardi — sayt
 * "AI javob bermadi" deyishining asosiy sababi shu edi.
 * Manba: https://ai.google.dev/gemini-api/docs/deprecations
 *
 * Navbat: arzon/tez modellar oldin. Nomi eskirgan model 404 qaytaradi —
 * u darhol o'tkazib yuboriladi (vaqt yemaydi). Hammasi 404 bo'lsa, kalitga
 * ochiq modellar ro'yxati Google'dan so'raladi (pastda: discoverGemini).
 */
export const GEMINI_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
];

const dedupe = (list: string[]) => [...new Set(list.map((m) => m.trim()).filter(Boolean))];

export function readAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const provider = (env.AI_PROVIDER ?? 'none').toLowerCase() as ProviderName;
  const defaults: Record<string, string> = {
    gemini: GEMINI_CHAIN[0],
    groq: 'openai/gpt-oss-120b',
    openai: 'gpt-5-mini',
    anthropic: 'claude-haiku-5-5',
  };
  const model = (env.AI_MODEL ?? defaults[provider] ?? '').trim();
  // .env dagi zaxiralar oldin, keyin standart navbat: .env da eskirgan nom
  // qolib ketgan bo'lsa ham, ishlaydigan model albatta navbatda bo'ladi.
  const fromEnv = (env.AI_FALLBACK_MODELS ?? '').split(',');
  const fallbacks = dedupe([...fromEnv, ...(provider === 'gemini' ? GEMINI_CHAIN : [])]).filter((m) => m !== model);
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
/** Model nomiga qarab "o'ylash" sozlamasi. Gemini 3 — daraja, 2.5 — byudjet. */
export function thinkingFor(model: string): Record<string, unknown> | undefined {
  if (/gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  // 3.8-flash "minimal" ni qabul qilmaydi, "low" — eng past daraja
  if (/gemini-3\.8-flash(?!-lite)/.test(model) || /pro/.test(model)) return { thinkingLevel: 'low' };
  if (/gemini-3|latest/.test(model)) return { thinkingLevel: 'minimal' };
  return { thinkingLevel: 'low' };
}

const isGemini3 = (model: string) => !/gemini-(1|2)\./.test(model);

async function callGemini({ config, system, messages, maxOutputChars }: CallArgs): Promise<AiReply> {
  const body = (thinking: Record<string, unknown> | undefined) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      // Gemini'da yordamchi roli "model" deb ataladi
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        // Gemini 3 uchun Google haroratni o'zgartirmaslikni tavsiya qiladi (1.0):
        // pastroq qiymatda model takrorlanib qolishi mumkin.
        ...(isGemini3(config.model) ? {} : { temperature: 0.4 }),
        maxOutputTokens: Math.max(4096, toTokens(maxOutputChars) * 6),
        ...(thinking ? { thinkingConfig: thinking } : {}),
      },
    });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
  const init = (thinking: Record<string, unknown> | undefined): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
    body: body(thinking),
  });

  // Sozlama rad etilsa (400 "thinking ...") — yumshoqrog'i, keyin sozlamasiz
  const first = thinkingFor(config.model);
  const tries: (Record<string, unknown> | undefined)[] = [first];
  if (first && first.thinkingLevel !== 'low') tries.push({ thinkingLevel: 'low' });
  tries.push(undefined);

  let data: unknown;
  for (let i = 0; i < tries.length; i++) {
    try {
      data = await postJson(url, init(tries[i]), config.timeoutMs);
      break;
    } catch (e) {
      const thinkingRejected = e instanceof AiProviderError && e.status === 400 && /thinking/i.test(e.detail);
      if (!thinkingRejected || i === tries.length - 1) throw e;
    }
  }
  const text = geminiText(data);
  if (!text) {
    const reason = textFromPath(data, ['candidates', 0, 'finishReason']) ?? textFromPath(data, ['promptFeedback', 'blockReason']) ?? 'EMPTY';
    throw new AiProviderError(502, `Gemini bo'sh javob qaytardi (${reason})`);
  }
  return { text: clip(text, maxOutputChars), model: config.model };
}

/**
 * Kalitga ochiq Gemini modellari (Google'ning o'z ro'yxati). Navbatdagi
 * hamma nom eskirgan bo'lsa ishlatiladi: kod yangilanmasa ham AI ishlayveradi.
 * 6 soatga eslab qolinadi.
 */
let discovered: { at: number; models: string[] } | null = null;
export async function discoverGemini(config: AiConfig): Promise<string[]> {
  if (discovered && Date.now() - discovered.at < 6 * 3600_000) return discovered.models;
  const data = (await postJson(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    { method: 'GET', headers: { 'x-goog-api-key': config.apiKey } },
    Math.min(config.timeoutMs, 8000),
  )) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
  const names = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => String(m.name ?? '').replace(/^models\//, ''))
    // Faqat matnli "flash" modellar: ovoz, rasm, jonli, embedding — kerak emas
    .filter((n) => /flash/.test(n) && !/tts|image|live|audio|embed|exp|thinking|computer|robot/.test(n));
  // Yangi versiya oldin; "lite" bir xil versiyada keyin
  const ver = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  names.sort((a, b) => ver(b) - ver(a) || Number(/lite/.test(a)) - Number(/lite/.test(b)));
  discovered = { at: Date.now(), models: names };
  return names;
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

/** Kalitning o'zi yaroqsiz bo'lsa — boshqa model ham yordam bermaydi. */
export function isKeyProblem(e: unknown): boolean {
  if (!(e instanceof AiProviderError)) return false;
  if (e.status === 401) return true;
  return /API_KEY_INVALID|API key not valid|API_KEY_SERVICE_BLOCKED|SERVICE_DISABLED|reported as leaked|API key expired/i.test(e.detail);
}

/** Model topilmadi / bu kalitga ochiq emas — keyingisiga darhol o'tamiz. */
function isModelMissing(e: unknown): boolean {
  if (!(e instanceof AiProviderError)) return false;
  if (e.status === 404) return true;
  return (e.status === 400 || e.status === 403) && /not found|not supported|no longer available|deprecated|not available|is not enabled/i.test(e.detail);
}

// Serverless nusxa yashab turguncha eslab qolinadi: oxirgi ishlagan model
// birinchi sinaladi, "yo'q" modellar 15 daqiqa chetlab o'tiladi.
let workingModel: string | null = null;
const missing = new Map<string, number>();
const MISSING_TTL = 15 * 60_000;

/** Testlar va admin tekshiruvi uchun: eslab qolinganlarni tozalaydi. */
export function resetAiMemory() {
  workingModel = null;
  missing.clear();
  discovered = null;
}

export function aiMemory() {
  return { workingModel, missing: [...missing.keys()] };
}

/**
 * Tanlangan provayderga so'rov yuboradi. Shaxsiy ma'lumot avval tozalanadi.
 *
 * Asosiy model ishlamasa (kvota tugadi, model nomi eskirdi, bo'sh javob)
 * — zaxira modellar navbat bilan sinab ko'riladi. Kalit noto'g'ri bo'lsa
 * — darhol xato. Umumiy vaqt Vercel chegarasidan (30 s) oshmaydi.
 */
export async function callAi(args: CallArgs): Promise<AiReply> {
  const chain = dedupe([workingModel ?? '', args.config.model, ...args.config.fallbackModels]);
  let last: unknown;
  let realAttempts = 0;
  let allMissing = true;
  const started = Date.now();
  const BUDGET = 22_000;

  const attempt = async (model: string): Promise<AiReply | null> => {
    const left = BUDGET - (Date.now() - started);
    if (left < 2500) return null;
    try {
      const r = await callOnce({ ...args, config: { ...args.config, model, timeoutMs: Math.min(args.config.timeoutMs, left) } });
      workingModel = model;
      missing.delete(model);
      return r;
    } catch (e) {
      last = e;
      if (isKeyProblem(e)) throw e;
      if (isModelMissing(e)) missing.set(model, Date.now());
      else {
        allMissing = false;
        realAttempts++;
      }
      if (workingModel === model) workingModel = null;
      return null;
    }
  };

  for (const model of chain) {
    const seen = missing.get(model);
    if (seen && Date.now() - seen < MISSING_TTL) continue;
    if (realAttempts >= 4) break;
    const r = await attempt(model);
    if (r) return r;
  }

  // Navbatdagi hamma nom eskirgan: Google'dan ochiq modellarni so'raymiz
  if (allMissing && args.config.provider === 'gemini') {
    try {
      const fresh = (await discoverGemini(args.config)).filter((m) => !chain.includes(m)).slice(0, 3);
      for (const model of fresh) {
        const r = await attempt(model);
        if (r) return r;
      }
    } catch (e) {
      if (isKeyProblem(e)) throw e;
    }
  }
  throw last instanceof Error ? last : new AiProviderError(503, String(last ?? 'AI javob bermadi'));
}

/**
 * Admin uchun tekshiruv: har bir model qisqa savol bilan sinaladi.
 * Natijada kalit yo'q — faqat model nomi, holat va qisqa xato matni.
 */
export async function diagnoseAi(config: AiConfig) {
  const started = Date.now();
  const results: { model: string; ok: boolean; ms: number; status?: number; error?: string; sample?: string }[] = [];
  let available: string[] | null = null;
  let listError: string | null = null;
  if (config.provider === 'gemini') {
    try {
      discovered = null;
      available = await discoverGemini(config);
    } catch (e) {
      listError = shortError(e);
    }
  }
  const chain = dedupe([config.model, ...config.fallbackModels]).slice(0, 6);
  for (const model of chain) {
    if (Date.now() - started > 22_000) break;
    const t = Date.now();
    try {
      const r = await callOnce({
        config: { ...config, model, timeoutMs: 8000 },
        system: "Qisqa javob ber.",
        messages: [{ role: 'user', content: "Turkchada 'salom' qanday? Bir so'z." }],
        maxOutputChars: 80,
      });
      results.push({ model, ok: true, ms: Date.now() - t, sample: r.text.slice(0, 60) });
      workingModel ??= model;
      // Bitta ishlaydigan topildi — qolganini tekshirish shart emas (kvota tejaladi)
      break;
    } catch (e) {
      results.push({
        model, ok: false, ms: Date.now() - t,
        status: e instanceof AiProviderError ? e.status : undefined,
        error: shortError(e),
      });
      if (isKeyProblem(e)) break;
    }
  }
  return {
    provider: config.provider,
    keyProblem: results.some((r) => r.status === 401) || /API_KEY|leaked|SERVICE_DISABLED/i.test(listError ?? ''),
    available: available?.slice(0, 20) ?? null,
    listError,
    results,
    workingModel,
  };
}

/** Xato matnidan qisqa, kalitsiz izoh. */
export function shortError(error: unknown): string {
  if (error instanceof AiProviderError) {
    const msg = /"message"\s*:\s*"([^"]{1,200})/.exec(error.detail)?.[1] ?? error.detail.slice(0, 200);
    return `${error.status}: ${msg}`.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[kalit]');
  }
  if (error instanceof Error && /timeout|aborted/i.test(error.name + error.message)) return 'Vaqt tugadi (javob kelmadi)';
  return String(error).slice(0, 200).replace(/AIza[0-9A-Za-z_-]{20,}/g, '[kalit]');
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
