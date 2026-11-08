"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, needs2fa } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BuilderGame } from "./games/BuilderGame";
import { ChainGame } from "./games/ChainGame";
import { ListenGame } from "./games/ListenGame";
import { MatchGame } from "./games/MatchGame";
import { QuizGame } from "./games/QuizGame";
import { SentenceGame } from "./games/SentenceGame";
import { SuffixGame } from "./games/SuffixGame";
import { errorText, LEVELS, type GameProps, type Stats } from "./games/types";

type Row = { rank: number; name: string; xp: number; isMe: boolean };
type Key = "quiz" | "match" | "builder" | "listen" | "sentence" | "suffix" | "chain";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const GAMES: { key: Key; title: string; text: string; icon: ReactNode; Comp: (p: GameProps) => ReactNode }[] = [
  { key: "quiz", title: "So'z mashqi", text: "4 variantdan tarjimani toping", icon: <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>, Comp: QuizGame },
  { key: "match", title: "Juftlikni top", text: "Turkcha so'zni tarjimasi bilan bog'lang", icon: <Icon><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></Icon>, Comp: MatchGame },
  { key: "builder", title: "Harflardan so'z", text: "Aralash harflardan so'zni yig'ing", icon: <Icon><rect x="3" y="5" width="7" height="7" rx="1.5" /><rect x="14" y="5" width="7" height="7" rx="1.5" /><path d="M5 18h14" /></Icon>, Comp: BuilderGame },
  { key: "listen", title: "Tinglab yozish", text: "Eshiting va to'g'ri yozing", icon: <Icon><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Icon>, Comp: ListenGame },
  { key: "sentence", title: "Gap tuzish", text: "Aralash so'zlardan gap yasang", icon: <Icon><path d="M4 7h16M4 12h10M4 17h13" /></Icon>, Comp: SentenceGame },
  { key: "suffix", title: "Qo'shimchalar", text: "Unlilar moslashuvi va yumshash", icon: <Icon><path d="M7 8h10M12 8v9" /><circle cx="12" cy="19" r="1.6" /></Icon>, Comp: SuffixGame },
  { key: "chain", title: "So'z zanjiri", text: "Oxirgi harfdan yangi so'z", icon: <Icon><path d="M9 12a3 3 0 0 1 3-3h1a3 3 0 0 1 0 6h-1" /><path d="M15 12a3 3 0 0 0-3-3h-1a3 3 0 0 0 0 6h1" /></Icon>, Comp: ChainGame },
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

  // Ma'lumotlarni yuklash: state faqat javob kelgandan keyin o'zgaradi
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
    return () => {
      cancelled = true;
    };
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
    setStats((s) => (s ? { ...s, leaderboardOptIn: optIn } : s)); // darhol ko'rsatamiz
    try {
      await api("/games/leaderboard-optin", { method: "PATCH", body: { optIn } });
      setBoard(await api<Row[]>("/games/leaderboard"));
    } catch (e) {
      setStats((s) => (s ? { ...s, leaderboardOptIn: !optIn } : s)); // xato: qaytaramiz
      fail(e);
    }
  }

  if (loading || !user) return <p className="text-muted" role="status">Yuklanmoqda...</p>;

  const active = GAMES.find((g) => g.key === game);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid content-start gap-6">
        {stats && (
          <dl className="grid grid-cols-3 gap-px border border-cobalt/25 bg-cobalt/25">
            {([["XP", stats.xp, "text-brass"], ["Daraja", stats.level, "text-cobalt"], ["Seriya", stats.streak, "text-turquoise"]] as const).map(([label, value, tone]) => (
              <div key={label} className="bg-ink px-4 py-5">
                <dt className="text-[0.875rem] text-muted">{label}</dt>
                <dd className={`t-num mt-1.5 text-[2.2rem] leading-none ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {error && <p className="alert-error" role="alert">{error}</p>}

        {!active && (
          <div className="grid gap-5">
            <div role="group" aria-label="Daraja tanlash" className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[0.9375rem] text-muted">Daraja:</span>
              {["", ...LEVELS].map((l) => (
                <button key={l || "all"} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className="tab" data-on={level === l || undefined}>
                  {l || "Hammasi"}
                </button>
              ))}
            </div>
            {stats && <p className="text-[0.9375rem] text-muted">Takrorlashga tayyor so&apos;zlar: <strong className="font-semibold text-porcelain">{stats.dueWords}</strong> · O&apos;rganilgan: <strong className="font-semibold text-porcelain">{stats.learnedWords}</strong></p>}
            <ul className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-2">
              {GAMES.map((g, i) => (
                <li key={g.key} className="contents">
                  <button type="button" onClick={() => setGame(g.key)} className="block h-full w-full bg-ink p-6 text-left transition-colors hover:bg-cobalt/10">
                    <span className={`mb-4 grid size-10 place-items-center border ${["border-cobalt/45 text-cobalt", "border-turquoise/45 text-turquoise", "border-brass/45 text-brass", "border-porcelain/35 text-porcelain"][i]}`}>{g.icon}</span>
                    <span className="block font-display text-[1.2rem] font-semibold tracking-[-0.015em]">{g.title}</span>
                    <span className="mt-1.5 block text-[0.9375rem] text-muted">{g.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {active && (
          <div className="grid gap-3">
            <button type="button" onClick={exitGame} className="justify-self-start text-[0.9375rem] text-muted transition-colors hover:text-porcelain">← O&apos;yinlar</button>
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
              <li key={r.rank} className={`flex justify-between px-3 py-2 text-[0.9375rem] ${r.isMe ? "bg-brass/15 font-semibold text-brass" : "bg-cobalt/10"}`}>
                <span>{r.rank}. {r.name}</span>
                <span>{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
        {stats && (
          <label className="mt-5 flex items-start gap-3 text-[0.9375rem]">
            <input type="checkbox" checked={stats.leaderboardOptIn} onChange={(e) => toggleOptIn(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-cobalt" />
            <span>Reytingda ismim ko&apos;rinsin (faqat &quot;Ism F.&quot; ko&apos;rinishida)</span>
          </label>
        )}
      </aside>
    </div>
  );
}
