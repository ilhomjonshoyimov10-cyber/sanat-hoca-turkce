"use client";

// Profil rasmini yuklash.
//
// Fayl API dan O'TMAYDI: brauzer uni to'g'ridan-to'g'ri fayl omboriga
// yuklaydi, server esa faqat qisqa muddatli, cheklangan token beradi
// (fayl turi, hajmi va yo'li tokenning ichida qulflangan). Sabab:
// Vercel funksiyasiga 4.5 MB dan katta so'rov yuborib bo'lmaydi va
// rasm oqimini server orqali o'tkazish keraksiz xarajat.

import Image from "next/image";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { errorText } from "../groups/shared";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUpload({
  url,
  name,
  onChange,
}: {
  url: string | null;
  name: string;
  onChange: (next: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  async function pick(file: File) {
    setError("");
    if (!TYPES.includes(file.type)) {
      setError("Faqat PNG, JPEG yoki WebP rasm yuklash mumkin");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Rasm juda katta (${(file.size / 1024 / 1024).toFixed(1)} MB). Eng ko'pi 3 MB`);
      return;
    }

    setBusy(true);
    try {
      const { token, pathname } = await api<{ token: string; pathname: string }>(
        "/users/me/avatar-token",
        { method: "POST", body: { fileName: file.name, contentType: file.type, size: file.size } },
      );
      // Yo'lni SERVER beradi va token aynan shunga qulflangan — bu yerda
      // boshqa yo'l yozilsa, yuklash rad etiladi.
      const { put } = await import("@vercel/blob");
      const blob = await put(pathname, file, {
        access: "public",
        token,
        contentType: file.type,
      });
      const updated = await api<{ avatarUrl: string | null }>("/users/me/avatar", {
        method: "POST",
        body: { url: blob.url },
      });
      onChange(updated.avatarUrl);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const updated = await api<{ avatarUrl: string | null }>("/users/me/avatar", { method: "DELETE" });
      onChange(updated.avatarUrl);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      {url ? (
        <Image
          src={url}
          alt="Profil rasmingiz"
          width={96}
          height={96}
          className="h-24 w-24 rounded-[var(--r-tile)] border border-cobalt/30 object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="grid h-24 w-24 place-items-center rounded-[var(--r-tile)] border border-cobalt/30 bg-cobalt/10 text-2xl font-semibold"
        >
          {initials || "?"}
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Yuklanmoqda..." : url ? "Rasmni almashtirish" : "Rasm yuklash"}
          </button>
          {url && (
            <button type="button" className="btn btn-quiet" disabled={busy} onClick={remove}>
              Olib tashlash
            </button>
          )}
        </div>
        <p className="help">PNG, JPEG yoki WebP. Eng ko&apos;pi 3 MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
          }}
        />
      </div>

      {error && (
        <p className="alert-error w-full" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
