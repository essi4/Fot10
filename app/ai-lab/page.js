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

export default function AiLabPage() {
  const [secret, setSecret] = useState("");
  const [models, setModels] = useState(fallbackModels);
  const [model, setModel] = useState("gpt-6-astra");
  const [message, setMessage] = useState("برای FOT10 یک قابلیت جدید فوتبال پیشنهاد بده و معماری فنی آن را مرحله‌به‌مرحله توضیح بده.");
  const [answer, setAnswer] = useState("");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY) || "";
    setSecret(saved);
  }, []);

  async function loadModels(currentSecret) {
    const response = await fetch("/api/ashna/models", {
      cache: "no-store",
      headers: { "x-ashna-lab-secret": currentSecret },
    });
    if (!response.ok) throw new Error("دسترسی آزمایشگاه رد شد یا کلید تنظیم نشده است");
    const data = await response.json();
    const ids = Array.isArray(data?.data) ? data.data.map((item) => item?.id).filter(Boolean) : [];
    if (ids.length) {
      setModels(ids);
      if (!ids.includes(model)) setModel(ids.includes("gpt-6-astra") ? "gpt-6-astra" : ids[0]);
    }
  }

  async function saveAndLoadSecret() {
    const value = secret.trim();
    if (!value) return;
    sessionStorage.setItem(SECRET_KEY, value);
    setError("");
    try {
      await loadModels(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای دسترسی");
    }
  }

  useEffect(() => {
    if (!secret) return;
    loadModels(secret).catch(() => {});
  }, [secret]);

  async function runTest() {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || data?.error || "درخواست ناموفق بود");
      setAnswer(data.text || "پاسخی دریافت نشد.");
      setUsage(data.usage || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

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
          <label className="mb-2 block text-xs font-black text-slate-300">رمز آزمایشگاه</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ASHNAAI_LAB_SECRET"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none"
            />
            <button
              onClick={saveAndLoadSecret}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black text-cyan-200"
            >
              اتصال
            </button>
          </div>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">مدل</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none"
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
            disabled={loading || !message.trim() || !secret}
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
