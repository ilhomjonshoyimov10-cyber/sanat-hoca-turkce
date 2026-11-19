"use client";

// Admin boshqaruv paneli: davr bo'yicha ko'rsatkichlar, kunlik grafik,
// o'yinlar reytingi, arizalar voronkasi, faollik xaritasi.
// Har bir ko'rsatkich kartasi — tugma: bosilsa, katta grafik shu o'lchovni ko'rsatadi.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/datetime";
import { errorText } from "../groups/shared";
import { BarList, compact, dayLabel, Delta, Funnel, Heatmap, Sparkline, TrendChart } from "../charts/charts";

type Pair = [number, number];
interface Dash {
  days: number; from: string; generatedAt: string;
  kpi: {
    newUsers: Pair; activeUsers: Pair; plays: Pair; xp: Pair; aiQuestions: Pair; aiFailed: number; leads: Pair;
    openSupport: number; ungraded: number; upcomingLive: number; totalXp: number;
  };
  series: { day: string; users: number; plays: number; xp: number; ai: number; leads: number; active: number }[];
  games: { game: string; plays: number; players: number; xp: number }[];
  funnel: { key: string; label: string; count: number }[];
  levels: { level: string; students: number }[];
  heat: number[][];
  top: { id: string; name: string; xp: number }[];
}

export const GAME_LABEL: Record<string, string> = {
  FLASHCARDS: "Kartochkalar", MATCH_PAIRS: "Juftini top", WORD_BUILDER: "So'z yig'ish", LISTEN_AND_WRITE: "Tinglab yozish",
  SENTENCE_BUILDER: "Gap tuzish", SUFFIX_TRAINER: "Qo'shimchalar", DAILY_WORD: "Kun so'zi", WORD_CHAIN: "So'z zanjiri",
  SPEED_REVIEW: "Tezkor takror", READING_QUIZ: "O'qish testi", FILL_GAP: "Bo'shliqni to'ldirish", VERB_FORM: "Fe'l shakli",
  DIALOGUE: "Suhbat", ANTONYM: "Zid ma'no", ODD_ONE_OUT: "Ortiqchasini top",
};

type Metric = "active" | "users" | "plays" | "xp" | "ai" | "leads";
const METRICS: { key: Metric; label: string; kpi: keyof Dash["kpi"]; color: string; note: string }[] = [
  { key: "active", label: "Faol foydalanuvchilar", kpi: "activeUsers", color: "var(--turquoise)", note: "o'ynagan yoki AI dan foydalangan" },
  { key: "users", label: "Yangi ro'yxatdan o'tish", kpi: "newUsers", color: "var(--cobalt)", note: "yangi akkaunt" },
  { key: "plays", label: "O'yin javoblari", kpi: "plays", color: "var(--cobalt)", note: "to'g'ri javoblar soni" },
  { key: "xp", label: "Yig'ilgan XP", kpi: "xp", color: "var(--brass)", note: "o'yinlardan" },
  { key: "ai", label: "AI savollar", kpi: "aiQuestions", color: "var(--cobalt)", note: "yordamchiga berilgan" },
  { key: "leads", label: "Yangi arizalar", kpi: "leads", color: "var(--bole)", note: "bepul darsga" },
];

export function Dashboard({ onError }: { onError: (m: string) => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Dash | null>(null);
  const [busy, setBusy] = useState(true);
  const [metric, setMetric] = useState<Metric>("active");
  const [table, setTable] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData(await api<Dash>(`/admin/dashboard?days=${days}`));
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, [days, onError]);

  useEffect(() => { void load(); }, [load]);
  // Ochiq turgan panel har 2 daqiqada o'zi yangilanadi
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) void load(); }, 120_000);
    return () => clearInterval(t);
  }, [load]);

  const m = METRICS.find((x) => x.key === metric)!;
  const values = data?.series.map((s) => s[metric]) ?? [];
  const daysKeys = data?.series.map((s) => s.day) ?? [];

  const attention = data
    ? [
        { n: data.kpi.openSupport, text: "javobsiz murojaat", href: "?tab=support", tone: "text-bole" },
        { n: data.kpi.ungraded, text: "baholanmagan uy vazifasi", href: null, tone: "text-brass" },
        { n: data.kpi.aiFailed, text: "AI javob bermagan savol", href: "?tab=ai", tone: "text-danger" },
        { n: data.funnel.find((f) => f.key === "ALL")!.count - data.funnel.find((f) => f.key === "CONTACTED")!.count, text: "bog'lanilmagan ariza", href: "?tab=free", tone: "text-bole" },
      ].filter((a) => a.n > 0)
    : [];

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[1.5rem]">Boshqaruv paneli</h2>
          <p className="text-[0.875rem] text-muted">
            {data ? <>Oxirgi {data.days} kun · {dayLabel(data.series[0]?.day ?? "")} — bugun · yangilandi {formatTime(data.generatedAt)}</> : "Yuklanmoqda..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="segment" role="tablist" aria-label="Davr">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" role="tab" aria-selected={days === d} onClick={() => setDays(d)}>{d} kun</button>
            ))}
          </div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => void load()} disabled={busy} aria-label="Yangilash">
            <svg viewBox="0 0 24 24" className={`size-4 ${busy ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {!data ? (
        <div className="grid gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      ) : (
        <>
          {/* KPI kartalari — har biri grafikni almashtiradi */}
          <div className="grid grid-cols-2 gap-px border border-cobalt/25 bg-cobalt/25 sm:grid-cols-3 xl:grid-cols-6" role="tablist" aria-label="Ko'rsatkichlar">
            {METRICS.map((x) => {
              const [cur, prev] = data.kpi[x.kpi] as Pair;
              const on = metric === x.key;
              return (
                <button
                  key={x.key} type="button" role="tab" aria-selected={on} onClick={() => setMetric(x.key)}
                  className={`group relative grid gap-2 bg-ink p-4 text-left transition-colors hover:bg-cobalt/[0.07] ${on ? "bg-cobalt/[0.09]" : ""}`}
                >
                  <span className={`absolute inset-x-0 top-0 h-0.5 transition-opacity ${on ? "opacity-100" : "opacity-0"}`} style={{ background: x.color }} aria-hidden="true" />
                  <span className="text-[0.8125rem] text-muted">{x.label}</span>
                  <span className="t-num text-[1.9rem] leading-none text-porcelain">{compact(cur)}</span>
                  <Delta cur={cur} prev={prev} />
                  <Sparkline values={data.series.map((s) => s[x.key])} color={x.color} />
                </button>
              );
            })}
          </div>

          {/* Katta grafik */}
          <section aria-labelledby="trend-h" className="border border-cobalt/25 bg-ink p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h3 id="trend-h" className="text-[1.125rem]">{m.label}</h3>
                <p className="text-[0.8125rem] text-muted">Kunlik · {m.note}</p>
              </div>
              <button type="button" className="btn btn-quiet btn-sm" aria-pressed={table} onClick={() => setTable((t) => !t)}>
                {table ? "Grafik" : "Jadval"}
              </button>
            </div>
            {table ? (
              <div className="max-h-[17rem] overflow-auto">
                <table className="table">
                  <thead><tr><th>Kun</th><th className="text-right">{m.label}</th></tr></thead>
                  <tbody>
                    {[...data.series].reverse().map((s) => (
                      <tr key={s.day}><td>{dayLabel(s.day)}</td><td className="t-num text-right">{s[metric]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <TrendChart days={daysKeys} values={values} label={m.label} color={m.color} />
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <section aria-labelledby="games-h" className="self-start border border-cobalt/25 bg-ink p-5">
              <h3 id="games-h" className="text-[1.125rem]">Eng ko&apos;p o&apos;ynalgan o&apos;yinlar</h3>
              <p className="mb-4 text-[0.8125rem] text-muted">To&apos;g&apos;ri javoblar · o&apos;yinchilar soni</p>
              <BarList
                valueLabel="javob"
                rows={data.games.slice(0, 8).map((g) => ({ key: g.game, label: GAME_LABEL[g.game] ?? g.game, value: g.plays, note: `${g.players} kishi` }))}
                empty="Bu davrda o'yin o'ynalmagan"
              />
            </section>

            <div className="grid content-start gap-6">
              <section aria-labelledby="att-h" className="border border-cobalt/25 bg-ink p-5">
                <h3 id="att-h" className="mb-3 text-[1.125rem]">Diqqat talab qiladi</h3>
                {attention.length === 0 ? (
                  <p className="flex items-center gap-2 text-[0.9375rem] text-turquoise">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" /></svg>
                    Hammasi joyida
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {attention.map((a) => (
                      <li key={a.text} className="flex items-center gap-3">
                        <span className={`t-num w-10 text-right text-[1.4rem] leading-none ${a.tone}`}>{a.n}</span>
                        {a.href ? <Link href={a.href} className="text-[0.9375rem] text-porcelain underline decoration-cobalt/50 underline-offset-4 hover:decoration-porcelain">{a.text} →</Link> : <span className="text-[0.9375rem]">{a.text}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {data.kpi.upcomingLive > 0 && (
                  <p className="mt-3 text-[0.875rem] text-muted">Rejadagi jonli darslar: <b className="text-porcelain">{data.kpi.upcomingLive}</b></p>
                )}
              </section>

              <section aria-labelledby="funnel-h" className="border border-cobalt/25 bg-ink p-5">
                <h3 id="funnel-h" className="text-[1.125rem]">Arizalar voronkasi</h3>
                <p className="mb-4 text-[0.8125rem] text-muted">Butun vaqt davomida</p>
                <Funnel steps={data.funnel} />
              </section>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section aria-labelledby="heat-h" className="self-start border border-cobalt/25 bg-ink p-5">
              <h3 id="heat-h" className="text-[1.125rem]">Qachon o&apos;qishadi</h3>
              <p className="mb-4 text-[0.8125rem] text-muted">O&apos;yin javoblari: hafta kuni va soat bo&apos;yicha — dars va e&apos;lon vaqtini tanlash uchun</p>
              <Heatmap grid={data.heat} label="javob" />
            </section>

            <div className="grid content-start gap-6">
              <section aria-labelledby="top-h" className="border border-cobalt/25 bg-ink p-5">
                <h3 id="top-h" className="mb-3 text-[1.125rem]">Davrning faollari</h3>
                {data.top.length === 0 ? (
                  <p className="text-[0.9375rem] text-muted">Hali hech kim o&apos;ynamagan.</p>
                ) : (
                  <ol className="grid gap-2">
                    {data.top.map((t, i) => (
                      <li key={t.id} className="flex items-center gap-3">
                        <span className={`grid size-7 place-items-center rounded-full text-[0.8125rem] font-semibold ${i === 0 ? "bg-brass/20 text-brass" : "bg-cobalt/15 text-muted"}`}>{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{t.name}</span>
                        <span className="t-num text-brass">{compact(t.xp)} XP</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section aria-labelledby="lv-h" className="border border-cobalt/25 bg-ink p-5">
                <h3 id="lv-h" className="text-[1.125rem]">Guruhlardagi o&apos;quvchilar</h3>
                <p className="mb-4 text-[0.8125rem] text-muted">Faol guruhlar, daraja bo&apos;yicha</p>
                <BarList valueLabel="o'quvchi" color="var(--brass)" rows={data.levels.map((l) => ({ key: l.level, label: l.level, value: l.students }))} />
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
