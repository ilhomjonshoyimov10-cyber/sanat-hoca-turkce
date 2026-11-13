"use client";

import Image from "next/image";
import type { User } from "@/lib/auth";

// Rasm bo'lmasa — ism-familiya bosh harflari, rangli fonda.
// Rang ismdan hisoblanadi: bir odam har doim bir xil rangda.
const TONES = [
  "bg-cobalt/30 text-porcelain",
  "bg-turquoise/25 text-turquoise",
  "bg-brass/25 text-brass",
  "bg-bole/25 text-[#ffb3ab]",
];

function tone(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return TONES[h % TONES.length];
}

export function initials(u: Pick<User, "firstName" | "lastName">) {
  return `${[...u.firstName][0] ?? ""}${[...u.lastName][0] ?? ""}`.toLocaleUpperCase();
}

/**
 * Profil rasmi. `progress` (0..1) berilsa, atrofida daraja halqasi chiziladi:
 * keyingi darajagacha qancha qolganini ko'rsatadi.
 */
export function Avatar({
  user,
  size = 36,
  progress,
}: {
  user: Pick<User, "firstName" | "lastName" | "avatarUrl">;
  size?: number;
  progress?: number;
}) {
  const ring = progress === undefined ? null : Math.max(0.04, Math.min(1, progress));
  const inner = (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold ${user.avatarUrl ? "" : tone(user.firstName + user.lastName)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt="" width={size * 2} height={size * 2} className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(user)}</span>
      )}
    </span>
  );

  // Halqa: jez rang — yutuq rangi (XP, daraja)
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full p-[2px]"
      style={{
        background:
          ring === null
            ? "linear-gradient(140deg, rgba(227,174,91,.85), rgba(59,108,225,.7))"
            : `conic-gradient(var(--brass) ${ring * 360}deg, rgba(59,108,225,.35) 0)`,
      }}
    >
      <span className="grid place-items-center rounded-full bg-ink p-[2px]">{inner}</span>
    </span>
  );
}
