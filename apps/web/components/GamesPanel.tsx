"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
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

// Nomlar va tavsiflar lug'atda: t.games.families / t.games.list
const FAMILIES: Family[] = ["words", "grammar", "speech"];

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

interface GameDef {
  key: Key;
  family: Family;
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
    key: "quiz", family: "words",
    tone: TONE.words, Comp: QuizGame,
    icon: <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>,
  },
  {
    key: "match", family: "words",
    tone: TONE.words, Comp: MatchGame,
    icon: <Icon><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></Icon>,
  },
  {
    key: "builder", family: "words",
    tone: TONE.words, Comp: BuilderGame,
    icon: <Icon><rect x="3" y="5" width="7" height="7" rx="1.5" /><rect x="14" y="5" width="7" height="7" rx="1.5" /><path d="M5 18h14" /></Icon>,
  },
  {
    key: "listen", family: "words",
    tone: TONE.words, Comp: ListenGame,
    icon: <Icon><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Icon>,
  },
  {
    key: "antonym", family: "words",
    tone: TONE.words, Comp: AntonymGame, isNew: true,
    icon: <Icon><path d="M7 7 4 10l3 3" /><path d="M4 10h16" /><path d="m17 17 3-3-3-3" /><path d="M20 14H4" /></Icon>,
  },
  {
    key: "odd", family: "words",
    tone: TONE.words, Comp: OddOneOutGame, isNew: true,
    icon: <Icon><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><path d="M14 14h6v6h-6z" /></Icon>,
  },

  // ── Grammatika ──
  {
    key: "sentence", family: "grammar",
    tone: TONE.grammar, Comp: SentenceGame,
    icon: <Icon><path d="M4 7h16M4 12h10M4 17h13" /></Icon>,
  },
  {
    key: "suffix", family: "grammar",
    tone: TONE.grammar, Comp: SuffixGame,
    icon: <Icon><path d="M7 8h10M12 8v9" /><circle cx="12" cy="19" r="1.6" /></Icon>,
  },
  {
    key: "cloze", family: "grammar",
    tone: TONE.grammar, Comp: ClozeGame, isNew: true,
    icon: <Icon><path d="M4 12h5" /><rect x="10" y="8" width="5" height="8" rx="1" strokeDasharray="3 2" /><path d="M16 12h4" /></Icon>,
  },
  {
    key: "verb", family: "grammar",
    tone: TONE.grammar, Comp: VerbGame, isNew: true,
    icon: <Icon><path d="M4 6h16" /><path d="M4 12h8" /><path d="m15 15 3 3 4-5" /></Icon>,
  },

  // ── Jonli til ──
  {
    key: "dialogue", family: "speech",
    tone: TONE.speech, Comp: DialogueGame, isNew: true,
    icon: <Icon><path d="M4 5h11v8H8l-4 4z" /><path d="M9 9h8v6h3l-3 3v-3" /></Icon>,
  },
  {
    key: "chain", family: "speech",
    tone: TONE.speech, Comp: ChainGame,
    icon: <Icon><path d="M9 12a3 3 0 0 1 3-3h1a3 3 0 0 1 0 6h-1" /><path d="M15 12a3 3 0 0 0-3-3h-1a3 3 0 0 0 0 6h1" /></Icon>,
  },
];

export function GamesPanel() {
  const { t } = useI18n();
  const g = t.games;
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

  if (loading || !user) return <p className="text-muted" role="status">{t.common.loading}</p>;

  const active = GAMES.find((g) => g.key === game);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid content-start gap-7">
        {stats && (
          <dl className="grid grid-cols-3 gap-px border border-cobalt/25 bg-cobalt/25">
            {([[g.xp, stats.xp, "text-brass"], [g.level, stats.level, "text-cobalt"], [g.streak, stats.streak, "text-turquoise"]] as const).map(
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
              <div role="group" aria-label={g.chooseLevel} className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[0.9375rem] text-muted">{g.levelLabel}</span>
                {["", ...LEVELS].map((l) => (
                  <button key={l || "all"} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}
                    className="tab" data-on={level === l || undefined}>
                    {l || t.common.all}
                  </button>
                ))}
              </div>
              {stats && (
                <p className="text-[0.9375rem] text-muted">
                  {g.due}{" "}
                  <strong className="font-semibold text-porcelain">{stats.dueWords}</strong> · {g.learned}{" "}
                  <strong className="font-semibold text-porcelain">{stats.learnedWords}</strong>
                </p>
              )}
            </div>

            {/* O'yinlar ko'nikma bo'yicha guruhlangan: 12 tasini bitta
                uzun ro'yxatda ko'rsatish tanlashni qiyinlashtiradi. */}
            {FAMILIES.map((fam) => {
              const list = GAMES.filter((x) => x.family === fam);
              return (
                <section key={fam} aria-labelledby={`fam-${fam}`}>
                  <div className="mb-3">
                    <h2 id={`fam-${fam}`} className="font-display text-[1.25rem] font-semibold tracking-[-0.015em]">
                      {g.families[fam].title}
                    </h2>
                    <p className="text-[0.9375rem] text-muted">{g.families[fam].text}</p>
                  </div>
                  <ul className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2">
                    {list.map((x) => (
                      <li key={x.key} className="contents">
                        <button
                          type="button"
                          onClick={() => setGame(x.key)}
                          className="group relative block h-full w-full bg-ink p-5 text-left transition-colors hover:bg-cobalt/10"
                        >
                          {x.isNew && (
                            <span className="badge badge-ok absolute right-4 top-4">{t.common.new}</span>
                          )}
                          <span className={`mb-3.5 grid size-10 place-items-center border ${x.tone}`}>{x.icon}</span>
                          <span className="block font-display text-[1.15rem] font-semibold tracking-[-0.015em]">
                            {g.list[x.key].title}
                          </span>
                          <span className="mt-1.5 block text-[0.9375rem] text-muted">{g.list[x.key].text}</span>
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
              {g.backToGames}
            </button>
            <active.Comp key={active.key} onStats={setStats} onFail={fail} onExit={exitGame} level={level} />
          </div>
        )}
      </div>

      {/* Reyting */}
      {/* self-start: ilgari bu blok sahifa bo'yi cho'zilib, bo'sh baland
          quti bo'lib turardi */}
      <aside className="self-start border border-cobalt/25 bg-cobalt/[0.05] p-6 lg:sticky lg:top-24">
        <h2 className="text-[1.2rem]">{g.board}</h2>
        {board.length === 0 ? (
          <p className="mt-2.5 text-[0.9375rem] text-muted">{g.boardEmpty}</p>
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
            <span>{g.optIn}</span>
          </label>
        )}
      </aside>
    </div>
  );
}
