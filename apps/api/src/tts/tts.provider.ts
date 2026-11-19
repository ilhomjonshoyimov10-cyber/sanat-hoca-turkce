// Turkcha ovoz (matndan nutq) — Gemini TTS orqali.
//
// NEGA KERAK: "Tinglab yozish" o'yini oldin faqat brauzerning ichki
// ovoziga tayanardi. Windows'dagi Chrome va ko'p telefonlarda turkcha ovoz
// O'RNATILMAGAN — o'quvchi hech narsa eshitmasdi. Endi ovozni server
// yaratadi va hamma qurilmada bir xil, tabiiy ovoz eshitiladi.
//
// Gemini TTS javobi: base64 "audio/L16;codec=pcm;rate=24000" — xom PCM
// (16-bit, mono). Brauzer uni o'ynata olmaydi, shuning uchun oldiga 44
// baytlik WAV sarlavhasi qo'shamiz.
// Manba: https://ai.google.dev/gemini-api/docs/speech-generation

import { AiProviderError, isKeyProblem, type AiConfig } from '../ai/ai.provider.js';

export const TTS_CHAIN = [
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-preview-tts',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-flash-lite-preview-tts',
];

export type TtsAudio = { audio: Buffer; mime: string; model: string };

/** 16-bit mono PCM -> WAV fayl. */
export function pcmToWav(pcm: Buffer, sampleRate = 24_000, channels = 1, bits = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt bo'lagi uzunligi
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** "audio/L16;codec=pcm;rate=24000" -> 24000 */
const rateOf = (mime: string) => Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24_000);

async function post(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof body === 'object' && body ? JSON.stringify(body).slice(0, 500) : String(res.status);
    throw new AiProviderError(res.status, detail);
  }
  return body;
}

async function geminiSpeak(config: AiConfig, model: string, text: string, voice: string, timeoutMs: number): Promise<TtsAudio> {
  const data = (await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({
        // Ko'rsatma ingliz tilida (hujjatdagi kabi), matn — turkcha.
        // Bitta qisqa so'zni model boshqa tilda o'qib yubormasligi uchun tilni aytamiz.
        contents: [{ parts: [{ text: `Read aloud in Turkish, slowly and clearly, with standard Istanbul pronunciation:\n${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
    timeoutMs,
  )) as { candidates?: { finishReason?: string; content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[] };

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) {
    throw new AiProviderError(502, `Ovoz kelmadi (${data.candidates?.[0]?.finishReason ?? 'EMPTY'})`);
  }
  const raw = Buffer.from(part.inlineData.data, 'base64');
  const mime = part.inlineData.mimeType ?? 'audio/L16;rate=24000';
  // Xom PCM bo'lsa — WAV ga o'raymiz; tayyor format kelsa — o'zicha
  if (/L16|pcm/i.test(mime)) return { audio: pcmToWav(raw, rateOf(mime)), mime: 'audio/wav', model };
  return { audio: raw, mime: mime.split(';')[0], model };
}

let discovered: { at: number; models: string[] } | null = null;

/** Kalitga ochiq TTS modellari (nomlar o'zgarsa ham kod ishlayveradi). */
async function discoverTts(config: AiConfig): Promise<string[]> {
  if (discovered && Date.now() - discovered.at < 6 * 3600_000) return discovered.models;
  const data = (await post(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    { method: 'GET', headers: { 'x-goog-api-key': config.apiKey } },
    8000,
  )) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
  const ver = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  const models = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => String(m.name ?? '').replace(/^models\//, ''))
    .filter((n) => /tts/.test(n) && !/pro/.test(n))
    .sort((a, b) => ver(b) - ver(a) || Number(/lite/.test(b)) - Number(/lite/.test(a)));
  discovered = { at: Date.now(), models };
  return models;
}

let workingTts: string | null = null;
const missingTts = new Set<string>();

export function resetTtsMemory() {
  workingTts = null;
  missingTts.clear();
  discovered = null;
}

/**
 * Matnni ovozga aylantiradi. Model topilmasa (404) — keyingisi; kalit
 * yaroqsiz bo'lsa — darhol xato. Umumiy vaqt 25 soniyadan oshmaydi.
 */
export async function synthesize(config: AiConfig, text: string, voice: string, extra: string[] = []): Promise<TtsAudio> {
  if (config.provider !== 'gemini' || !config.apiKey) throw new AiProviderError(503, 'Ovoz xizmati sozlanmagan');
  const started = Date.now();
  const BUDGET = 25_000;
  let last: unknown;
  const tried = new Set<string>();

  const attempt = async (model: string): Promise<TtsAudio | null> => {
    tried.add(model);
    const left = BUDGET - (Date.now() - started);
    if (left < 3000) return null;
    try {
      const r = await geminiSpeak(config, model, text, voice, Math.min(15_000, left));
      workingTts = model;
      return r;
    } catch (e) {
      last = e;
      if (isKeyProblem(e)) throw e;
      if (e instanceof AiProviderError && (e.status === 404 || /not found|not supported/i.test(e.detail))) missingTts.add(model);
      if (workingTts === model) workingTts = null;
      return null;
    }
  };

  const chain = [...new Set([workingTts ?? '', ...extra, ...TTS_CHAIN].filter(Boolean))].filter((m) => !missingTts.has(m));
  for (const model of chain.slice(0, 4)) {
    const r = await attempt(model);
    if (r) return r;
  }
  try {
    for (const model of (await discoverTts(config)).filter((m) => !tried.has(m) && !missingTts.has(m)).slice(0, 2)) {
      const r = await attempt(model);
      if (r) return r;
    }
  } catch (e) {
    if (isKeyProblem(e)) throw e;
    last ??= e;
  }
  throw last instanceof Error ? last : new AiProviderError(503, 'Ovoz yaratilmadi');
}
