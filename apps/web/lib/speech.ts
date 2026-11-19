// Turkcha ovoz: avval SERVER ovozi (Gemini TTS, hamma qurilmada bir xil),
// u ishlamasa — brauzerning ichki ovozi (SpeechSynthesis).
//
// Nega server birinchi: Windows'dagi Chrome va ko'p telefonlarda turkcha
// ovoz o'rnatilmagan — "Tinglab yozish" o'yinida o'quvchi hech narsa
// eshitmasdi. Server ovozi bir marta yaratiladi va keshda saqlanadi.

import { api } from "./api";

// ───────────────────────── Brauzer ovozi ─────────────────────────

export function turkishVoiceAvailable(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("tr"));
}

export function subscribeVoices(cb: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

export function speakTurkish(text: string, rate = 0.9, onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  u.rate = rate;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  try {
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("tr"));
    if (voice) u.voice = voice;
  } catch {
    /* ovoz tanlab bo'lmadi: standart (tr-TR) ovoz ishlatiladi */
  }
  try {
    synth.speak(u);
  } catch {
    /* ovoz sintezi mavjud emas yoki ruxsat yo'q */
  }
}

// ───────────────────────── Server ovozi ─────────────────────────

// Bo'sh WAV: iPhone Safari ovozni faqat bosish paytida "ochadi". Bosilgan
// zahoti shu sukunatni o'ynatib qo'yamiz — keyin (fayl kelgach) shu
// element bilan haqiqiy ovozni o'ynatish ruxsat etiladi.
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

let audioEl: HTMLAudioElement | null = null;
let unlocked = false;
const urls = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
/** Server ovozi ishlamasa — 60 soniya qayta urinmaymiz (har bosishda kutib qolmasin) */
let serverDownUntil = 0;

const norm = (t: string) => t.normalize("NFC").replace(/\s+/g, " ").trim();

function audio(): HTMLAudioElement {
  audioEl ??= new Audio();
  audioEl.preload = "auto";
  return audioEl;
}

/** Bosish paytida chaqiriladi (sinxron): iPhone'da keyingi o'ynatishga ruxsat ochiladi. */
function unlock() {
  if (unlocked) return;
  const el = audio();
  el.src = SILENT;
  void el.play().then(() => { unlocked = true; }).catch(() => undefined);
}

export function serverVoiceUsable(): boolean {
  return Date.now() > serverDownUntil;
}

/** Matnning ovoz faylini oladi (keshdan yoki serverdan). */
export function fetchVoice(text: string): Promise<string> {
  const key = norm(text);
  const ready = urls.get(key);
  if (ready) return Promise.resolve(ready);
  const running = pending.get(key);
  if (running) return running;
  const job = api<{ url: string }>("/tts", { method: "POST", body: { text: key } })
    .then((r) => {
      urls.set(key, r.url);
      return r.url;
    })
    .catch((e: unknown) => {
      serverDownUntil = Date.now() + 60_000;
      throw e;
    })
    .finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}

/** O'yin boshlanganda hamma so'zlarni oldindan tayyorlab qo'yadi (navbat bilan). */
export async function prefetchVoices(texts: string[]): Promise<boolean> {
  let ok = true;
  for (const t of texts) {
    try {
      await fetchVoice(t);
    } catch {
      ok = false;
      break;
    }
  }
  return ok;
}

export function stopSpeech() {
  try { window.speechSynthesis?.cancel(); } catch { /* jim */ }
  if (audioEl) {
    audioEl.onended = null;
    audioEl.pause();
  }
}

export type VoiceSource = "server" | "browser" | "none";

/**
 * Turkcha matnni o'qiydi. Avval server ovozi, bo'lmasa brauzer ovozi.
 * Qaytaradi: qaysi ovoz ishlatildi ("none" — hech biri ishlamadi).
 * `rate`: 0.9 — oddiy, 0.55 — sekin (server ovozida tezlik shunga mos).
 */
export async function playTurkish(
  text: string,
  { rate = 0.9, server = true, onEnd }: { rate?: number; server?: boolean; onEnd?: () => void } = {},
): Promise<VoiceSource> {
  stopSpeech();
  if (server && serverVoiceUsable()) {
    unlock(); // await'dan OLDIN — bosish "issiq" turganda
    try {
      const url = await fetchVoice(text);
      const el = audio();
      el.src = url;
      // Server ovozi o'zi sekin-aniq aytadi: 0.9 -> 1.0x, 0.55 -> 0.6x
      el.playbackRate = Math.min(1.2, Math.max(0.5, rate / 0.9));
      el.preservesPitch = true;
      el.onended = onEnd ?? null;
      await el.play();
      return "server";
    } catch {
      /* server ovozi yo'q — brauzer ovoziga o'tamiz */
    }
  }
  if (turkishVoiceAvailable()) {
    speakTurkish(text, rate, onEnd);
    return "browser";
  }
  onEnd?.();
  return "none";
}

/** Uzun matnni (bob) gap-gap bo'laklarga ajratadi — har biri serverga sig'adi. */
export function chunkText(text: string, max = 380): string[] {
  const sentences = norm(text).match(/[^.!?…]+[.!?…]*["»”’)]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    if (s.length > max) {
      // Juda uzun gap: vergul yoki bo'shliqdan bo'lamiz
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}
