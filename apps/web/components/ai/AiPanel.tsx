"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Task = "CHAT" | "GRAMMAR" | "EXPLAIN" | "EXERCISE";

type Status = {
  enabled: boolean;
  provider: string | null;
  model: string | null;
  dailyLimit: number;
  usedToday: number;
  canUseExercise: boolean;
};

type Msg = { id: string; role: "USER" | "ASSISTANT"; content: string; createdAt: string; error?: string | null };
type Convo = { id: string; title: string; task: Task; updatedAt: string };

const TASKS: { id: Task; label: string; hint: string; placeholder: string }[] = [
  {
    id: "CHAT",
    label: "Suhbat",
    hint: "Turkcha yozib ko'ring — javob turkcha keladi, tarjimasi bilan. Xato qilsangiz tuzatib beradi.",
    placeholder: "Merhaba! Bugün hava çok güzel...",
  },
  {
    id: "GRAMMAR",
    label: "Xatolarni tuzatish",
    hint: "Turkcha yozgan matningizni qo'ying — tuzatilgan variant, xatolar ro'yxati va qoida izohi chiqadi.",
    placeholder: "Ben dün okula gitmedim çünkü hasta oldum...",
  },
  {
    id: "EXPLAIN",
    label: "Tushuntirish",
    hint: "Bitta so'z yoki grammatik qoida yozing (masalan «-mış» yoki «görmek»).",
    placeholder: "-mış o'tgan zamon",
  },
  {
    id: "EXERCISE",
    label: "Mashq tuzish",
    hint: "Mavzu va darajani yozing — mashq va javoblar kaliti bilan chiqadi.",
    placeholder: "A2 daraja, ovqat mavzusi, 5 ta gap to'ldirish mashqi",
  },
];

export function AiPanel() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [task, setTask] = useState<Task>("CHAT");
  const [convos, setConvos] = useState<Convo[]>([]);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<Status>("/ai/status").then(setStatus).catch(() => setStatus(null));
    void api<Convo[]>("/ai/conversations").then(setConvos).catch(() => {});
  }, []);

  // Yangi xabar kelganda pastga suriladi
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const active = TASKS.find((t) => t.id === task)!;
  const visibleTasks = TASKS.filter((t) => t.id !== "EXERCISE" || status?.canUseExercise);

  async function openConvo(id: string) {
    setError("");
    try {
      const data = await api<{ task: Task; messages: Msg[] }>(`/ai/conversations/${id}`);
      setConvoId(id);
      setTask(data.task);
      setMessages(data.messages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Suhbatni ochib bo'lmadi");
    }
  }

  function newConvo(next: Task) {
    setTask(next);
    setConvoId(null);
    setMessages([]);
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    await ask(text.trim());
  }

  async function ask(message: string) {
    if (!message || sending) return;

    setSending(true);
    setError("");
    // Savolni darhol ko'rsatamiz — kutish paytida bo'sh ekran turmasin
    const temp: Msg = { id: `temp-${Date.now()}`, role: "USER", content: message, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, temp]);
    setText("");

    try {
      const r = await api<{ conversationId: string; answer: string; usedToday: number; dailyLimit: number }>(
        "/ai/ask",
        { method: "POST", body: { task, message, conversationId: convoId ?? undefined } },
      );
      setConvoId(r.conversationId);
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "ASSISTANT", content: r.answer, createdAt: new Date().toISOString() },
      ]);
      setStatus((s) => (s ? { ...s, usedToday: r.usedToday } : s));
      void api<Convo[]>("/ai/conversations").then(setConvos).catch(() => {});
    } catch (err) {
      const body = err instanceof ApiError ? (err.data as { conversationId?: string } | undefined) : undefined;
      if (body?.conversationId) {
        // Savol serverda SAQLANDI (ustoz ko'radi) — suhbatda qoladi, yonida "qayta yuborish"
        setConvoId(body.conversationId);
        setMessages((m) => [
          ...m,
          { id: `e-${Date.now()}`, role: "ASSISTANT", content: "", error: err instanceof ApiError ? err.message : "Javob kelmadi", createdAt: new Date().toISOString() },
        ]);
        void api<Convo[]>("/ai/conversations").then(setConvos).catch(() => {});
      } else {
        // Umuman yetib bormadi (limit, tarmoq) — matnni qaytarib beramiz, qayta yozmasin
        setMessages((m) => m.filter((x) => x.id !== temp.id));
        setText(message);
        setError(err instanceof ApiError ? err.message : "Javob kelmadi. Qayta urinib ko'ring");
      }
    } finally {
      setSending(false);
    }
  }

  async function removeConvo(id: string) {
    try {
      await api(`/ai/conversations/${id}`, { method: "DELETE" });
      setConvos((c) => c.filter((x) => x.id !== id));
      if (convoId === id) newConvo(task);
    } catch {
      setError("O'chirib bo'lmadi");
    }
  }

  if (status && !status.enabled) {
    return (
      <div className="raise border border-cobalt/30 bg-tile p-7">
        <h2 className="text-xl">AI yordamchi hozir yoqilmagan</h2>
        <p className="mt-3 text-muted">
          Ishlashi uchun administrator AI provayderining kalitini sozlashi kerak. Sozlangandan keyin bu
          sahifa o&apos;zi ishlay boshlaydi.
        </p>
      </div>
    );
  }

  const left = status ? status.dailyLimit - status.usedToday : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_15rem] lg:items-start">
      <div>
        {/* Vazifa tanlash */}
        <div className="segment mb-4 flex flex-wrap gap-1" role="tablist" aria-label="AI vazifasi">
          {visibleTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={task === t.id}
              onClick={() => newConvo(t.id)}
              className="min-h-10 px-4 text-sm"
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-5 text-[0.9375rem] text-muted">{active.hint}</p>

        {/* Suhbat */}
        <div className="min-h-[18rem] border border-cobalt/25 bg-well p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-muted">
              Savolingizni yozing — javob shu yerda chiqadi.
            </p>
          ) : (
            <ul className="grid gap-3">
              {messages.map((m, i) => (
                <li key={m.id} className={m.role === "USER" ? "flex justify-end" : "flex justify-start"}>
                  {m.error ? (
                    <div className="bubble max-w-[85%] !border-danger/45">
                      <p className="text-danger">{m.error.includes(":") && /^\d{3}:/.test(m.error) ? "AI javob bermadi." : m.error}</p>
                      {i === messages.length - 1 && messages[i - 1]?.role === "USER" && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm mt-2"
                          disabled={sending}
                          onClick={() => {
                            const q = messages[i - 1].content;
                            setMessages((list) => list.slice(0, i - 1));
                            void ask(q);
                          }}
                        >
                          Qayta yuborish
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={m.role === "USER" ? "bubble bubble-mine max-w-[85%]" : "bubble max-w-[85%]"}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {sending && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
              <span className="inline-flex gap-1" aria-hidden="true">
                <span className="size-1.5 animate-bounce rounded-full bg-brass [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-brass [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-brass" />
              </span>
              AI o&apos;ylayapti...
            </p>
          )}
          <div ref={bottom} />
        </div>

        {error && (
          <p className="mt-3 text-[0.9375rem] text-bole" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={send} method="post" className="mt-4">
          <label htmlFor="ai-text" className="label">
            {active.label}
          </label>
          <textarea
            id="ai-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={task === "GRAMMAR" || task === "EXERCISE" ? 5 : 3}
            maxLength={3000}
            placeholder={active.placeholder}
            className="input"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={sending || !text.trim() || left === 0} className="btn btn-primary">
              {sending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
            {left !== null && (
              <span className="text-sm text-muted">
                Bugun qoldi: <strong className="text-porcelain">{Math.max(0, left)}</strong> / {status!.dailyLimit}
              </span>
            )}
          </div>
        </form>

        {/* Ogohlantirish — foydalanuvchi nima bo'layotganini bilishi kerak */}
        <p className="mt-5 border-l-2 border-brass/50 pl-4 text-[0.875rem] text-muted">
          Javoblar tashqi AI xizmatidan keladi va <strong>xato bo'lishi mumkin</strong> — ustozingizdan
          tasdiqlab oling. Ismingiz, telefon raqamingiz va emailingiz AI ga yuborilmaydi. AI baho
          qo&apos;ymaydi. Suhbatlar o&apos;quv markazida saqlanadi — administrator ko&apos;rishi mumkin
          (qiyin mavzularni bilib, darsni moslash uchun).
        </p>
      </div>

      {/* Suhbatlar tarixi */}
      <aside>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[1.05rem]">Suhbatlar</h2>
          <button type="button" onClick={() => newConvo(task)} className="text-sm text-turquoise hover:underline">
            Yangi
          </button>
        </div>
        {convos.length === 0 ? (
          <p className="text-sm text-muted">Hali suhbat yo&apos;q</p>
        ) : (
          <ul className="grid gap-1.5">
            {convos.map((c) => (
              <li key={c.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => void openConvo(c.id)}
                  aria-current={convoId === c.id ? "true" : undefined}
                  className={`min-w-0 flex-1 border border-cobalt/25 px-3 py-2 text-left text-sm ${
                    convoId === c.id ? "bg-tile-2" : "bg-tile hover:bg-tile-2"
                  }`}
                >
                  <span className="block truncate">{c.title}</span>
                  <span className="block text-xs text-muted">
                    {TASKS.find((t) => t.id === c.task)?.label ?? c.task}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void removeConvo(c.id)}
                  aria-label={`${c.title} suhbatini o'chirish`}
                  className="shrink-0 border border-cobalt/25 bg-tile px-2 text-muted hover:text-bole"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {status?.model && (
          <p className="mt-4 text-xs text-muted">
            Model: {status.model}
            {user?.role === "ADMIN" && status.provider ? ` (${status.provider})` : ""}
          </p>
        )}
      </aside>
    </div>
  );
}
