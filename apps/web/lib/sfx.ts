// O'yin ovoz effektlari — fayl yuklanmaydi, brauzerning o'zida (WebAudio)
// sintez qilinadi: tez, internet sarflamaydi, mualliflik muammosi yo'q.
// Ovozni o'chirish tugmasi bor; tanlov shu brauzerda eslab qolinadi.

type Kind = "correct" | "wrong" | "combo" | "level" | "goal";

const KEY = "sh-sfx";
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* maxfiy rejim: shu sahifa ochiq turguncha amal qiladi */
  }
  window.dispatchEvent(new Event("sh-sfx-change"));
}

export function subscribeSound(cb: () => void) {
  window.addEventListener("sh-sfx-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("sh-sfx-change", cb);
    window.removeEventListener("storage", cb);
  };
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Bitta yumshoq nota: tez ko'tariladi, sekin so'nadi (qulog'ga tegmaydi). */
function note(ac: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ac.destination);
  o.start(at);
  o.stop(at + dur + 0.05);
}

export function playSfx(kind: Kind) {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  switch (kind) {
    case "correct": // ikki nota yuqoriga: "ding-ding"
      note(ac, 784, t, 0.16, "triangle");
      note(ac, 1175, t + 0.08, 0.24, "triangle");
      break;
    case "wrong": // past, qisqa, yumshoq — jazo emas, ishora
      note(ac, 220, t, 0.18, "sine", 0.1);
      note(ac, 196, t + 0.09, 0.22, "sine", 0.08);
      break;
    case "combo": // ketma-ket 3/5/10 to'g'ri javob — arpedjio
      [659, 784, 988, 1319].forEach((f, i) => note(ac, f, t + i * 0.06, 0.2, "triangle", 0.1));
      break;
    case "goal": // kunlik maqsad bajarildi
      [523, 659, 784, 1047].forEach((f, i) => note(ac, f, t + i * 0.09, 0.32, "sine", 0.11));
      break;
    case "level": // yangi daraja — kichik fanfar
      [392, 523, 659, 784].forEach((f, i) => note(ac, f, t + i * 0.1, 0.3, "square", 0.05));
      note(ac, 1047, t + 0.42, 0.6, "triangle", 0.12);
      break;
  }
}
