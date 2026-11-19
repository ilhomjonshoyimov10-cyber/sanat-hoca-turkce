"use client";

// 3D faollik xaritasi: guruhlar (qatorlar) x oxirgi 14 kun (ustunlar).
// Ustun balandligi — o'sha kuni guruh o'quvchilari bergan to'g'ri javoblar.
//
// Kutubxonasiz: izometrik proyeksiya SVG'da hisoblanadi. Sichqoncha yoki
// barmoq bilan surib aylantiriladi; har ustun ustida aniq son chiqadi;
// "Jadval" tugmasi — ekran o'quvchi va aniq raqamlar uchun.

import { useEffect, useMemo, useRef, useState } from "react";
import { dayLabel, useWidth } from "../charts/charts";

type Row = { id: string; name: string; activity: number[] };

const DEG = Math.PI / 180;
const FOOT = 0.62; // ustun asosining katak ichidagi ulushi

export function Activity3D({ days: allDays, rows }: { days: string[]; rows: Row[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [angle, setAngle] = useState(24);
  const [hover, setHover] = useState<{ r: number; d: number } | null>(null);
  const [table, setTable] = useState(false);
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [grow, setGrow] = useState(reduced ? 1 : 0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; a: number } | null>(null);

  // Telefonda 14 ta ustun juda mayda — oxirgi 7 kun ko'rsatiladi (jadvalda hammasi)
  const narrow = w > 0 && w < 520;
  const span = narrow ? Math.min(7, allDays.length) : allDays.length;
  const days = useMemo(() => allDays.slice(-span), [allDays, span]);
  const list = useMemo(() => rows.slice(0, 8).map((r) => ({ ...r, activity: r.activity.slice(-span) })), [rows, span]);
  const N = days.length;
  const M = Math.max(1, list.length);
  // Qatorlar orasi: 14 kun x 2–3 guruh juda cho'ziq ko'rinmasin — chuqurlik kenglikka yaqinlashadi
  const R = Math.max(1, Math.min(3.2, N / (M * 1.8)));
  const D = M * R;
  const max = Math.max(1, ...list.flatMap((r) => r.activity));
  const height = Math.max(300, Math.min(440, 230 + M * 40));

  // Paydo bo'lish: ustunlar noldan o'sadi (harakat kamaytirilgan bo'lsa — darhol)
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 800);
      setGrow(1 - (1 - p) ** 3);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rows, reduced]);

  const geo = useMemo(() => {
    const phi = angle * DEG;
    const elev = 40 * DEG;
    const cx = N / 2;
    const cy = D / 2;
    const H = narrow ? 2.2 : Math.max(3, N * 0.24); // eng baland ustun — katak birligida
    const raw = (x: number, y: number, z: number) => {
      const xr = (x - cx) * Math.cos(phi) - (y - cy) * Math.sin(phi);
      const yr = (x - cx) * Math.sin(phi) + (y - cy) * Math.cos(phi);
      return { X: xr, Y: yr * Math.sin(elev) - z * Math.cos(elev), depth: yr };
    };
    // Sig'dirish: pol burchaklari va eng baland nuqta
    const probe = [raw(0, 0, 0), raw(N, 0, 0), raw(0, D, 0), raw(N, D, 0), raw(0, 0, H), raw(N, 0, H), raw(0, D, H), raw(N, D, H)];
    const minX = Math.min(...probe.map((p) => p.X));
    const maxX = Math.max(...probe.map((p) => p.X));
    const minY = Math.min(...probe.map((p) => p.Y));
    const maxY = Math.max(...probe.map((p) => p.Y));
    // Piksel zaxiralari: chapda guruh nomlari, pastda sanalar (matn o'lchami masshtabga bog'liq emas)
    const W = w || 600;
    const padL = W < 520 ? 74 : 112, padR = 12, padT = 10, padB = 34;
    // Balandlik kenglikka bog'liq, burchakka emas: aylantirganda sahifa sakramaydi
    const svgH = Math.min(height, Math.round(W * (W < 520 ? 0.8 : 0.66)));
    const s = Math.min((W - padL - padR) / (maxX - minX), (svgH - padT - padB) / (maxY - minY));
    const ox = padL + (W - padL - padR - (maxX - minX) * s) / 2 - minX * s;
    const oy = padT + (svgH - padT - padB - (maxY - minY) * s) / 2 - minY * s;
    const P = (x: number, y: number, z: number) => {
      const p = raw(x, y, z);
      return { x: ox + p.X * s, y: oy + p.Y * s, depth: p.depth };
    };
    // Ko'rinadigan yon tomonlar: normali tomoshabin tomon qaragan
    const faceVisible = (nx: number, ny: number) => nx * Math.sin(phi) + ny * Math.cos(phi) > 0;
    return { P, H, faceVisible, s, svgH, small: W < 520 };
  }, [angle, N, D, w, height, narrow]);

  const bars = useMemo(() => {
    const out: { r: number; d: number; v: number; depth: number }[] = [];
    list.forEach((row, r) => row.activity.forEach((v, d) => out.push({ r, d, v, depth: geo.P(d + 0.5, (r + 0.5) * R, 0).depth })));
    return out.sort((a, b) => a.depth - b.depth); // uzoqdagisi avval chiziladi
  }, [list, geo, R]);

  const pts = (arr: { x: number; y: number }[]) => arr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  function down(e: React.PointerEvent) {
    drag.current = { x: e.clientX, a: angle };
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    setAngle(Math.max(10, Math.min(60, drag.current.a + (e.clientX - drag.current.x) * 0.25)));
  }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setAngle((a) => Math.max(10, a - 4));
    if (e.key === "ArrowRight") setAngle((a) => Math.min(60, a + 4));
  }

  if (!list.length) {
    return <p className="py-10 text-center text-muted">Faol guruh yo&apos;q — guruh yarating, o&apos;quvchilar o&apos;ynashi bilan xarita to&apos;ladi.</p>;
  }

  const hv = hover ? { row: list[hover.r], v: list[hover.r].activity[hover.d], day: days[hover.d] } : null;
  const { P, H, faceVisible, svgH, small } = geo;
  const half = (1 - FOOT) / 2;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-muted">
        <span>Surib aylantiring · ustun = kunlik to&apos;g&apos;ri javoblar{narrow ? " · oxirgi 7 kun" : ""}</span>
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAngle(24)} aria-label="Burchakni tiklash">↺</button>
          <button type="button" className="btn btn-quiet btn-sm" aria-pressed={table} onClick={() => setTable((t) => !t)}>{table ? "3D" : "Jadval"}</button>
        </span>
      </div>

      {table ? (
        <div className="overflow-x-auto">
          <table className="table text-[0.8125rem]">
            <thead>
              <tr><th>Guruh</th>{allDays.map((d) => <th key={d} className="text-right">{dayLabel(d)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r) => (
                <tr key={r.id}><td className="whitespace-nowrap">{r.name}</td>{r.activity.map((v, i) => <td key={i} className="t-num text-right">{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={ref}
          className="relative w-full min-w-0 touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-brass"
          style={{ height: w > 0 ? svgH : height, cursor: dragging ? "grabbing" : "grab" }}
          tabIndex={0}
          role="img"
          aria-label={`Guruhlar faolligi, oxirgi ${N} kun. Eng faol: ${list.map((r) => `${r.name} — ${r.activity.reduce((a, b) => a + b, 0)}`).join(", ")}. Chap/o'ng strelka bilan aylantiring.`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => { drag.current = null; setDragging(false); }}
          onPointerCancel={() => { drag.current = null; setDragging(false); }}
          onKeyDown={key}
        >
          {w > 0 && (
            <svg width={w} height={svgH} className="absolute left-0 top-0">
              {/* Pol va to'r */}
              <polygon points={pts([P(0, 0, 0), P(N, 0, 0), P(N, D, 0), P(0, D, 0)])} fill="color-mix(in oklab, var(--cobalt) 7%, transparent)" stroke="color-mix(in oklab, var(--cobalt) 30%, transparent)" />
              {Array.from({ length: M - 1 }, (_, i) => {
                const a = P(0, (i + 1) * R, 0), b = P(N, (i + 1) * R, 0);
                return <line key={`r${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="color-mix(in oklab, var(--cobalt) 18%, transparent)" />;
              })}
              {Array.from({ length: N - 1 }, (_, i) => {
                const a = P(i + 1, 0, 0), b = P(i + 1, D, 0);
                return <line key={`c${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="color-mix(in oklab, var(--cobalt) 10%, transparent)" />;
              })}

              {/* Ustunlar */}
              {bars.map(({ r, d, v }) => {
                const z = v ? Math.max(0.06, (v / max) * H * grow) : 0.02;
                const x0 = d + half, x1 = d + 1 - half, y0 = (r + 0.5) * R - FOOT / 2, y1 = (r + 0.5) * R + FOOT / 2;
                const on = hover?.r === r && hover?.d === d;
                const base = on ? "var(--brass)" : v ? "var(--cobalt)" : "color-mix(in oklab, var(--cobalt) 25%, transparent)";
                const sides = [
                  { n: [0, 1], q: [P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, z), P(x0, y1, z)], shade: 22 },
                  { n: [0, -1], q: [P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, z), P(x0, y0, z)], shade: 22 },
                  { n: [1, 0], q: [P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, z), P(x1, y0, z)], shade: 42 },
                  { n: [-1, 0], q: [P(x0, y0, 0), P(x0, y1, 0), P(x0, y1, z), P(x0, y0, z)], shade: 42 },
                ];
                return (
                  <g key={`${r}-${d}`} onPointerEnter={() => setHover({ r, d })} onPointerLeave={() => setHover(null)}>
                    {sides.filter((f) => faceVisible(f.n[0], f.n[1])).map((f, i) => (
                      <polygon key={i} points={pts(f.q)} fill={`color-mix(in oklab, ${base}, #000 ${f.shade}%)`} />
                    ))}
                    <polygon points={pts([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)])} fill={base} />
                  </g>
                );
              })}

              {/* Guruh nomlari — qator boshida */}
              {list.map((row, r) => {
                const p = P(-0.45, (r + 0.5) * R, 0);
                return (
                  <text key={row.id} x={p.x} y={p.y} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">
                    {row.name.length > (small ? 11 : 16) ? `${row.name.slice(0, small ? 10 : 15)}…` : row.name}
                  </text>
                );
              })}
              {/* Kunlar — old chetda, har ikkinchisi */}
              {days.map((dk, d) => (narrow ? (N - 1 - d) % 2 === 0 : (d % 2 === 1 || d === N - 1) && d !== N - 2) ? (
                <text key={dk} x={P(d + 0.5, D + 0.55, 0).x} y={P(d + 0.5, D + 0.55, 0).y} dy="0.7em" textAnchor="middle" className="fill-muted text-[10px]">
                  {d === N - 1 ? "bugun" : dayLabel(dk)}
                </text>
              ) : null)}
            </svg>
          )}
          {hv && (
            <div role="status" className="pointer-events-none absolute left-3 top-2 border border-cobalt/30 bg-well/95 px-3 py-2 text-[0.8125rem] shadow-lg">
              <p className="font-medium text-porcelain">{hv.row.name}</p>
              <p className="text-muted">{dayLabel(hv.day)} · <b className="text-porcelain">{hv.v}</b> to&apos;g&apos;ri javob</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
