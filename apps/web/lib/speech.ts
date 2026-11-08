// Brauzerning ichki ovoz sintezi (SpeechSynthesis): internet va fayl kerak emas.
// Turkcha ovoz hamma qurilmada ham bo'lmasligi mumkin, shuning uchun mavjudligi tekshiriladi.

export function turkishVoiceAvailable(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("tr"));
}

export function subscribeVoices(cb: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

export function speakTurkish(text: string, rate = 0.9): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  u.rate = rate;
  try {
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("tr"));
    if (voice) u.voice = voice;
  } catch {
    /* ovoz tanlab bo'lmadi: standart (tr-TR) ovoz ishlatiladi */
  }
  try {
    synth.speak(u);
  } catch {
    /* ovoz sintezi mavjud emas yoki ruxsat yo'q: o'yin matn bilan davom etadi */
  }
}
