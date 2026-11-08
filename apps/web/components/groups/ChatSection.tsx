"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { errorText } from "./shared";

interface Sender { id: string; firstName: string; lastName: string; role: string }
interface Msg {
  id: string;
  content: string | null;
  isDeleted: boolean;
  isAnnouncement: boolean;
  createdAt: string;
  sender: Sender;
  mine: boolean;
}

/** Jonli yangilanish: har 5 soniyada faqat YANGI xabarlar so'raladi (`after` kursori). */
const POLL_MS = 5000;
const MAX_LEN = 2000;

export function ChatSection({ groupId, canModerate }: { groupId: string; canModerate: boolean }) {
  const [items, setItems] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  /** Foydalanuvchi tepaga chiqib eski xabarlarni o'qiyotgan bo'lsa, pastga sakratmaymiz */
  const stickRef = useRef(true);

  const scrollDown = useCallback(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, []);

  const poll = useCallback(async () => {
    try {
      const after = lastIdRef.current;
      const r = await api<{ items: Msg[] }>(
        `/chat/groups/${groupId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`,
      );
      if (!r.items.length) return;
      lastIdRef.current = r.items[r.items.length - 1].id;
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...r.items.filter((m) => !seen.has(m.id))];
      });
      setTimeout(scrollDown, 0);
    } catch {
      /* tarmoq uzilsa keyingi urinishda qayta oladi */
    }
  }, [groupId, scrollDown]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<{ items: Msg[] }>(`/chat/groups/${groupId}/messages`)
      .then((r) => {
        if (!alive) return;
        setItems(r.items);
        lastIdRef.current = r.items.at(-1)?.id ?? null;
        setTimeout(scrollDown, 0);
      })
      .catch((e) => alive && setError(errorText(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [groupId, scrollDown]);

  useEffect(() => {
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const msg = await api<Msg>(`/chat/groups/${groupId}/messages`, {
        method: "POST",
        body: { content, isAnnouncement: announce },
      });
      lastIdRef.current = msg.id;
      setItems((prev) => [...prev, msg]);
      setText("");
      setAnnounce(false);
      stickRef.current = true;
      setTimeout(scrollDown, 0);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, isDeleted: true, content: null } : m)));
    await api(`/chat/messages/${id}`, { method: "DELETE" }).catch((e) => setError(errorText(e)));
  }

  return (
    <section aria-labelledby="chat-h" className="border border-cobalt/25 bg-cobalt/[0.04]">
      <h2 id="chat-h" className="border-b border-cobalt/25 px-5 py-4 font-display text-[1.25rem] font-semibold">
        Guruh chati
      </h2>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="flex h-[22rem] flex-col overflow-y-auto p-5"
        role="log"
        aria-live="polite"
        aria-label="Xabarlar"
      >
        {loading && <div className="skeleton h-16 w-2/3" />}
        {!loading && items.length === 0 && (
          <p className="m-auto text-center text-[0.9375rem] text-muted">
            Hali xabar yo&apos;q. Birinchi bo&apos;lib yozing.
          </p>
        )}
        {/* mt-auto: xabarlar kam bo'lsa pastga yopishadi, ko'p bo'lsa odatdagidek oqadi */}
        <div className="mt-auto grid gap-2.5">
        {items.map((m) => (
          <div key={m.id} className={m.isAnnouncement ? "" : m.mine ? "flex" : ""}>
            <div className={`bubble ${m.isAnnouncement ? "bubble-announce" : m.mine ? "bubble-mine" : ""}`}>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-[0.8125rem] font-semibold">
                  {m.sender.firstName} {m.sender.lastName}
                </span>
                {m.isAnnouncement && <span className="badge badge-warn">E&apos;lon</span>}
                <span className="text-[0.75rem] text-muted">
                  {new Date(m.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {!m.isDeleted && (m.mine || canModerate) && (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="ml-auto text-[0.75rem] text-muted underline underline-offset-2 hover:text-danger"
                  >
                    O&apos;chirish
                  </button>
                )}
              </div>
              {m.isDeleted ? (
                <p className="bubble-deleted">Xabar o&apos;chirilgan</p>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      <form onSubmit={send} method="post" className="border-t border-cobalt/25 p-4">
        {error && <p className="alert-error mb-3" role="alert">{error}</p>}
        <div className="flex gap-2">
          <label htmlFor="chat-text" className="sr-only">Xabar matni</label>
          <input
            id="chat-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="Xabar yozing..."
            autoComplete="off"
            className="input flex-1"
          />
          <button type="submit" disabled={sending || !text.trim()} className="btn btn-primary">
            Yuborish
          </button>
        </div>
        {canModerate && (
          <label className="mt-3 flex items-center gap-2.5 text-[0.9375rem]">
            <button
              type="button"
              role="switch"
              aria-checked={announce}
              onClick={() => setAnnounce((a) => !a)}
              className="switch"
            />
            E&apos;lon sifatida yuborish (hammaga bildirishnoma boradi)
          </label>
        )}
      </form>
    </section>
  );
}
