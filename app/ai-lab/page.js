"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const fallbackModels = [
  "gpt-6-astra",
  "gpt-5.6-luna",
  "gpt-5.6-sol",
  "claude-sonnet-5",
  "gemini-3.1-Pro",
  "deepseek-v4-pro",
  "glm-5.3-flash",
];

const SECRET_KEY = "fot10_ashna_lab_secret";

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

export default function AiLabPage() {
  const [secret, setSecret] = useState("");
  const [models, setModels] = useState(fallbackModels);
  const [model, setModel] = useState("gpt-6-astra");
  const [message, setMessage] = useState("برای FOT10 یک قابلیت جدید فوتبال پیشنهاد بده و معماری فنی آن را مرحله‌به‌مرحله توضیح بده.");
  const [answer, setAnswer] = useState("");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SECRET_KEY) || "";
      if (saved) setSecret(saved);
    } catch {}
  }, []);

  async function loadModels(currentSecret) {
    const response = await fetch("/api/ashna/models", {
      cache: "no-store",
      headers: { "x-ashna-lab-secret": currentSecret },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "دسترسی آزمایشگاه رد شد."));
    }

    const ids = Array.isArray(data?.data)
      ? data.data.map((item) => item?.id).filter(Boolean)
      : [];

    if (!ids.length) {
      throw new Error("فهرست مدل‌های قابل استفاده خالی است.");
    }

    setModels(ids);
    setModel((current) => (ids.includes(current) ? current : ids.includes("gpt-6-astra") ? "gpt-6-astra" : ids[0]));
    setConnectionState("connected");
  }

  async function connect() {
    const value = secret.trim();
    if (!value) {
      setConnectionState("idle");
      setError("رمز آزمایشگاه را وارد کن.");
      return;
    }

    setConnecting(true);
    setConnectionState("connecting");
    setError("");
    setAnswer("");

    try {
      sessionStorage.setItem(SECRET_KEY, value);
      await loadModels(value);
    } catch (e) {
      setConnectionState("error");
      setError(e instanceof Error ? e.message : "خطای اتصال");
    } finally {
      setConnecting(false);
    }
  }

  async function runTest() {
    if (connectionState !== "connected") {
      setError("اول روی «اتصال» بزن تا فهرست مدل‌های واقعی بارگذاری شود.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setUsage(null);
    setError("");

    try {
      const response = await fetch("/api/ashna/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ashna-lab-secret": secret,
        },
        body: JSON.stringify({ model, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "درخواست ناموفق بود."));
      }

      setAnswer(data.text || "پاسخی دریافت نشد.");
      setUsage(data.usage || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  const statusText =
    connectionState === "connected"
      ? "متصل · فهرست واقعی مدل‌ها"
      : connectionState === "connecting"
        ? "در حال اتصال…"
        : connectionState === "error"
          ? "اتصال ناموفق"
          : "اتصال نشده";

  return (
    <main className="min-h-screen bg-[#060810] px-4 py-6 text-white" dir="rtl">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-black tracking-[.2em] text-cyan-300">FOT10 · AI LAB</div>
            <h1 className="mt-1 text-2xl font-black">آزمایشگاه AshnaAI</h1>
            <p className="mt-1 text-xs text-slate-500">آزمایشی، چندمدلی و قفل‌شده؛ کلید AshnaAI فقط روی سرور می‌ماند.</p>
          </div>
          <Link href="/" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">خانه</Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#0a1422] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-300">وضعیت آزمایشگاه</span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
              connectionState === "connected"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : connectionState === "error"
                  ? "border-red-300/20 bg-red-300/10 text-red-200"
                  : "border-white/10 bg-white/5 text-slate-500"
            }`}>
              {statusText}
            </span>
          </div>

          <label className="mb-2 block text-xs font-black text-slate-300">رمز آزمایشگاه</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                if (connectionState !== "idle") setConnectionState("idle");
              }}
              placeholder="ASHNAAI_LAB_SECRET"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none"
            />
            <button
              onClick={connect}
              disabled={connecting || !secret.trim()}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {connecting ? "اتصال…" : "اتصال"}
            </button>
          </div>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">مدل</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={connectionState !== "connected" || loading}
            className="w-full rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none disabled:opacity-50"
          >
            {models.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">درخواست آزمایشی</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            rows={7}
            className="w-full resize-y rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm leading-7 outline-none"
          />

          <button
            onClick={runTest}
            disabled={loading || connecting || !message.trim() || connectionState !== "connected"}
            className="mt-3 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "در حال تحلیل…" : "اجرای تست با AshnaAI"}
          </button>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 text-xs font-black text-cyan-300">خروجی</div>
          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-3 text-sm leading-7 text-red-200">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-slate-200">{answer || "هنوز تستی اجرا نشده است."}</pre>
          )}
          {usage && (
            <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">
              توکن ورودی: {usage.prompt_tokens ?? "—"} · خروجی: {usage.completion_tokens ?? "—"} · مجموع: {usage.total_tokens ?? "—"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
