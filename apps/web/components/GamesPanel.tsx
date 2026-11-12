"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BuilderGame } from "./games/BuilderGame";
import { ChainGame } from "./games/ChainGame";
import { ListenGame } from "./games/ListenGame";
import { MatchGame } from "./games/MatchGame";
import { AntonymGame, ClozeGame, DialogueGame, OddOneOutGame, VerbGame } from "./games/NewGames";
import { QuizGame } from "./games/QuizGame";
import { SentenceGame } from "./games/SentenceGame";
import { SuffixGame } from "./games/SuffixGame";
import { errorText, LEVELS, type GameProps, type Stats } from "./games/types";

type Row = { rank: number; name: string; xp: number; isMe: boolean };
type Key =
  | "quiz" | "match" | "builder" | "listen" | "antonym" | "odd"
  | "sentence" | "suffix" | "cloze" | "verb"
  | "dialogue" | "chain";

/** O'yin qaysi ko'nikmani mashq qiladi. Sahifa shu bo'yicha bo'linadi. */
type Family = "words" | "grammar" | "speech";

const FAMILIES: { key: Family; title: string; text: string }[] = [
  { key: "words", title: "So'z boyligi", text: "Yangi so'zlarni yodlash va takrorlash" },
  { key: "grammar", title: "Grammatika", text: "Qo'shimchalar, fe'l shakllari, gap tuzilishi" },
  { key: "speech", title: "Jonli til", text: "Suhbat va tezkor fikrlash" },
];

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

interface GameDef {
  key: Key;
  family: Family;
  title: string;
  text: string;
  /** Akssent rangi: bir oilaning o'yinlari bir xil ohangda */
  tone: string;
  icon: ReactNode;
  Comp: (p: GameProps) => ReactNode;
  isNew?: boolean;
}

const TONE = {
  words: "border-cobalt/45 text-cobalt",
  grammar: "border-brass/45 text-brass",
  speech: "border-turquoise/45 text-turquoise",
} as const;

const GAMES: GameDef[] = [
  // ── So'z boyligi ──
  {
    key: "quiz", family: "words", title: "So'z mashqi", text: "4 variantdan tarjimani toping",
    tone: TONE.words, Comp: QuizGame,
    icon: <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>,
  },
  {
    key: "match", family: "words", title: "Juftlikni top", text: "So'zni tarjimasi bilan bog'lang",
    tone: TONE.words, Comp: MatchGame,
    icon: <Icon><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></Icon>,
  },
  {
    key: "builder", family: "words", title: "Harflardan so'z", text: "Aralash harflardan so'zni yig'ing",
    tone: TONE.words, Comp: BuilderGame,
    icon: <Icon><rect x="3" y="5" width="7" height="7" rx="1.5" /><rect x="14" y="5" width="7" height="7" rx="1.5" /><path d="M5 18h14" /></Icon>,
  },
  {
    key: "listen", family: "words", title: "Tinglab yozish", text: "Eshiting va to'g'ri yozing",
    tone: TONE.words, Comp: ListenGame,
    icon: <Icon><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Icon>,
  },
  {
    key: "antonym", family: "words", title: "Zid ma'no", text: "Teskari ma'noli so'zni toping",
    tone: TONE.words, Comp: AntonymGame, isNew: true,
    icon: <Icon><path d="M7 7 4 10l3 3" /><path d="M4 10h16" /><path d="m17 17 3-3-3-3" /><path d="M20 14H4" /></Icon>,
  },
  {
    key: "odd", family: "words", title: "Ortiqcha so'z", text: "Mavzuga qo'shilmaydiganini toping",
    tone: TONE.words, Comp: OddOneOutGame, isNew: true,
    icon: <Icon><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><path d="M14 14h6v6h-6z" /></Icon>,
  },

  // ── Grammatika ──
  {
    key: "sentence", family: "grammar", title: "Gap tuzish", text: "Aralash so'zlardan gap yasang",
    tone: TONE.grammar, Comp: SentenceGame,
    icon: <Icon><path d="M4 7h16M4 12h10M4 17h13" /></Icon>,
  },
  {
    key: "suffix", family: "grammar", title: "Qo'shimchalar", text: "Unlilar moslashuvi va yumshash",
    tone: TONE.grammar, Comp: SuffixGame,
    icon: <Icon><path d="M7 8h10M12 8v9" /><circle cx="12" cy="19" r="1.6" /></Icon>,
  },
  {
    key: "cloze", family: "grammar", title: "Bo'shliqni to'ldir", text: "Jumladagi yetishmagan qismni toping",
    tone: TONE.grammar, Comp: ClozeGame, isNew: true,
    icon: <Icon><path d="M4 12h5" /><rect x="10" y="8" width="5" height="8" rx="1" strokeDasharray="3 2" /><path d="M16 12h4" /></Icon>,
  },
  {
    key: "verb", family: "grammar", title: "Fe'l shakli", text: "Shaxs va zamonga qarab o'zgartiring",
    tone: TONE.grammar, Comp: VerbGame, isNew: true,
    icon: <Icon><path d="M4 6h16" /><path d="M4 12h8" /><path d="m15 15 3 3 4-5" /></Icon>,
  },

  // ── Jonli til ──
  {
    key: "dialogue", family: "speech", title: "Suhbat", text: "To'g'ri javobni tanlang",
    tone: TONE.speech, Comp: DialogueGame, isNew: true,
    icon: <Icon><path d="M4 5h11v8H8l-4 4z" /><path d="M9 9h8v6h3l-3 3v-3" /></Icon>,
  },
  {
    key: "chain", family: "speech", title: "So'z zanjiri", text: "Oxirgi harfdan yangi so'z",
    tone: TONE.speech, Comp: ChainGame,
    icon: <Icon><path d="M9 12a3 3 0 0 1 3-3h1a3 3 0 0 1 0 6h-1" /><path d="M15 12a3 3 0 0 0-3-3h-1a3 3 0 0 0 0 6h1" /></Icon>,
  },
];

export function GamesPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [board, setBoard] = useState<Row[]>([]);
  const [game, setGame] = useState<Key | null>(null);
  const [level, setLevel] = useState(""); // "" = hamma daraja
  const [error, setError] = useState("");

  const fail = useCallback(
    (e: unknown) => {
      if (needs2fa(e)) router.push("/security");
      else setError(errorText(e));
    },
    [router],
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([api<Stats>("/games/me"), api<Row[]>("/games/leaderboard")])
      .then(([s, b]) => {
        if (cancelled) return;
        setStats(s);
        setBoard(b);
      })
      .catch((e) => !cancelled && fail(e));
    return () => { cancelled = true; };
  }, [user, fail]);

  async function exitGame() {
    setGame(null);
    try {
      setBoard(await api<Row[]>("/games/leaderboard"));
    } catch (e) {
      fail(e);
    }
  }

  async function toggleOptIn(optIn: boolean) {
    setError("");
    setStats((s) => (s ? { ...s, leaderboardOptIn: optIn } : s));
    try {
      await api("/games/leaderboard-optin", { method: "PATCH", body: { optIn } });
      setBoard(await api<Row[]>("/games/leaderboard"));
    } catch (e) {
      setStats((s) => (s ? { ...s, leaderboardOptIn: !optIn } : s));
      fail(e);
    }
  }

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const active = GAMES.find((g) => g.key === game);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid content-start gap-7">
        {stats && (
          <dl className="grid grid-cols-3 gap-px border border-cobalt/25 bg-cobalt/25">
            {([["XP", stats.xp, "text-brass"], ["Daraja", stats.level, "text-cobalt"], ["Seriya", stats.streak, "text-turquoise"]] as const).map(
              ([label, value, tone]) => (
                <div key={label} className="bg-ink px-4 py-5">
                  <dt className="text-[0.875rem] text-muted">{label}</dt>
                  <dd className={`t-num mt-1.5 text-[2.2rem] leading-none ${tone}`}>{value}</dd>
                </div>
              ),
            )}
          </dl>
        )}

        {error && <p className="alert-error" role="alert">{error}</p>}

        {!active && (
          <>
            <div className="grid gap-4">
              <div role="group" aria-label="Daraja tanlash" className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[0.9375rem] text-muted">Daraja:</span>
                {["", ...LEVELS].map((l) => (
                  <button key={l || "all"} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}
                    className="tab" data-on={level === l || undefined}>
                    {l || "Hammasi"}
                  </button>
                ))}
              </div>
              {stats && (
                <p className="text-[0.9375rem] text-muted">
                  Takrorlashga tayyor so&apos;zlar:{" "}
                  <strong className="font-semibold text-porcelain">{stats.dueWords}</strong> · O&apos;rganilgan:{" "}
                  <strong className="font-semibold text-porcelain">{stats.learnedWords}</strong>
                </p>
              )}
            </div>

            {/* O'yinlar ko'nikma bo'yicha guruhlangan: 12 tasini bitta
                uzun ro'yxatda ko'rsatish tanlashni qiyinlashtiradi. */}
            {FAMILIES.map((fam) => {
              const list = GAMES.filter((g) => g.family === fam.key);
              return (
                <section key={fam.key} aria-labelledby={`fam-${fam.key}`}>
                  <div className="mb-3">
                    <h2 id={`fam-${fam.key}`} className="font-display text-[1.25rem] font-semibold tracking-[-0.015em]">
                      {fam.title}
                    </h2>
                    <p className="text-[0.9375rem] text-muted">{fam.text}</p>
                  </div>
                  <ul className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2">
                    {list.map((g) => (
                      <li key={g.key} className="contents">
                        <button
                          type="button"
                          onClick={() => setGame(g.key)}
                          className="group relative block h-full w-full bg-ink p-5 text-left transition-colors hover:bg-cobalt/10"
                        >
                          {g.isNew && (
                            <span className="badge badge-ok absolute right-4 top-4">Yangi</span>
                          )}
                          <span className={`mb-3.5 grid size-10 place-items-center border ${g.tone}`}>{g.icon}</span>
                          <span className="block font-display text-[1.15rem] font-semibold tracking-[-0.015em]">
                            {g.title}
                          </span>
                          <span className="mt-1.5 block text-[0.9375rem] text-muted">{g.text}</span>
                        </button>
                      </li>
                    ))}
                    {/* Toq sonli ro'yxatda oxirgi katak bo'sh qolmasin */}
                    {list.length % 2 === 1 && <li aria-hidden className="hidden bg-ink sm:block" />}
                  </ul>
                </section>
              );
            })}
          </>
        )}

        {active && (
          <div className="grid gap-3">
            <button type="button" onClick={exitGame}
              className="justify-self-start text-[0.9375rem] text-muted transition-colors hover:text-porcelain">
              ← O&apos;yinlar
            </button>
            <active.Comp key={active.key} onStats={setStats} onFail={fail} onExit={exitGame} level={level} />
          </div>
        )}
      </div>

      {/* Reyting */}
      <aside className="content-start border border-cobalt/25 bg-cobalt/[0.05] p-6">
        <h2 className="text-[1.2rem]">Haftalik reyting</h2>
        {board.length === 0 ? (
          <p className="mt-2.5 text-[0.9375rem] text-muted">Birinchi javobdan keyin shu yerda paydo bo&apos;lasiz.</p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {board.map((r) => (
              <li key={r.rank}
                className={`flex justify-between px-3 py-2 text-[0.9375rem] ${r.isMe ? "bg-brass/15 font-semibold text-brass" : "bg-cobalt/10"}`}>
                <span>{r.rank}. {r.name}</span>
                <span>{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
        {stats && (
          <label className="mt-5 flex items-start gap-3 text-[0.9375rem]">
            <input type="checkbox" checked={stats.leaderboardOptIn} onChange={(e) => toggleOptIn(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-cobalt" />
            <span>Reytingda ismim ko&apos;rinsin (faqat &quot;Ism F.&quot; ko&apos;rinishida)</span>
          </label>
        )}
      </aside>
    </div>
  );
}
