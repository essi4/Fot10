"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const fallbackModels = [];

const SECRET_KEY = "fot10_ashna_lab_secret";
const HISTORY_KEY = "fot10_ashna_compare_history";
const MAX_HISTORY = 8;

function getErrorMessage(data, fallback) {
  return data?.error?.message || data?.error || fallback;
}

function formatMetric(value, suffix = "") {
  return value == null ? "—" : `${value.toLocaleString("fa-IR")}${suffix}`;
}

function createBenchmarkId() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(2, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FOT10-AI-${stamp}-${random}`;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function AiLabPage() {
  const [secret, setSecret] = useState("");
  const [models, setModels] = useState(fallbackModels);
  const [model, setModel] = useState("");
  const [compareModels, setCompareModels] = useState([]);
  const [message, setMessage] = useState("برای FOT10 یک قابلیت جدید فوتبال پیشنهاد بده و معماری فنی آن را مرحله‌به‌مرحله توضیح بده.");
  const [answer, setAnswer] = useState("");
  const [usage, setUsage] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [compareMeta, setCompareMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [benchmarkId, setBenchmarkId] = useState("");
  const [copiedModel, setCopiedModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SECRET_KEY) || "";
      if (saved) setSecret(saved);

      const savedHistory = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(savedHistory)) setHistory(savedHistory.slice(0, MAX_HISTORY));
    } catch {}
  }, []);

  async function loadModels(currentSecret) {
    const response = await fetch("/api/ashna/models", {
      cache: "no-store",
      headers: { "x-ashna-lab-secret": currentSecret },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(getErrorMessage(data, "دسترسی آزمایشگاه رد شد."));

    const ids = Array.isArray(data?.data)
      ? data.data.map((item) => item?.id).filter(Boolean)
      : [];

    if (!ids.length) throw new Error("فهرست مدل‌های قابل استفاده خالی است.");

    setModels(ids);
    setModel((current) => (ids.includes(current) ? current : ids[0]));
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

  function toggleCompare(id) {
    setCompareModels((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current
    );
  }

  async function runTest() {
    if (connectionState !== "connected") {
      setError("اول روی «اتصال» بزن.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setUsage(null);
    setComparison([]);
    setCompareMeta(null);
    setBenchmarkId("");
    setError("");

    try {
      const response = await fetch("/api/ashna/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ashna-lab-secret": secret },
        body: JSON.stringify({ model, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(data, "درخواست ناموفق بود."));

      setAnswer(data.text || "پاسخی دریافت نشد.");
      setUsage(data.usage || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    if (connectionState !== "connected") {
      setError("اول روی «اتصال» بزن.");
      return;
    }

    const selected = compareModels.length ? compareModels : [model];
    setLoading(true);
    setAnswer("");
    setUsage(null);
    setComparison([]);
    setCompareMeta(null);
    setBenchmarkId("");
    setCopiedModel("");
    setError("");

    try {
      const response = await fetch("/api/ashna/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ashna-lab-secret": secret },
        body: JSON.stringify({ models: selected, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(data, "مقایسه ناموفق بود."));

      const results = Array.isArray(data?.results) ? data.results : [];
      const meta = {
        requested: data?.requested ?? selected.length,
        completed: data?.completed ?? 0,
        compare_latency_ms: data?.compare_latency_ms ?? null,
        message_chars: data?.message_chars ?? message.length,
      };
      const nextBenchmarkId = createBenchmarkId();

      setComparison(results);
      setCompareMeta(meta);
      setBenchmarkId(nextBenchmarkId);

      setHistory((current) => {
        const entry = {
          id: Date.now(),
          benchmark_id: nextBenchmarkId,
          created_at: new Date().toISOString(),
          message,
          models: selected,
          results,
          meta,
        };
        const next = [entry, ...current].slice(0, MAX_HISTORY);
        try {
          sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای مقایسه");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(modelId, text) {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopiedModel(modelId);
      window.setTimeout(() => setCopiedModel(""), 1400);
    } catch {
      setError("کپی مستقیم در این مرورگر در دسترس نیست.");
    }
  }

  function exportCurrent() {
    if (!comparison.length) {
      setError("ابتدا یک Benchmark اجرا کن.");
      return;
    }

    const payload = {
      benchmark_id: benchmarkId || createBenchmarkId(),
      created_at: new Date().toISOString(),
      message,
      models: compareModels.length ? compareModels : [model],
      meta: compareMeta,
      results: comparison,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payload.benchmark_id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function restoreHistory(item) {
    setMessage(item.message || "");
    setComparison(Array.isArray(item.results) ? item.results : []);
    setCompareMeta(item.meta || null);
    setBenchmarkId(item.benchmark_id || "");
    setAnswer("");
    setUsage(null);
    setError("");

    const restoredModels = Array.isArray(item.models) ? item.models : [];
    if (restoredModels.length) {
      setCompareModels(restoredModels.slice(0, 3));
      setModel(restoredModels[0]);
    }
  }

  function exportHistory() {
    if (!history.length) {
      setError("هنوز سابقه‌ای برای خروجی گرفتن وجود ندارد.");
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      count: history.length,
      benchmarks: history,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fot10-ai-benchmark-history.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    setHistory([]);
    try {
      sessionStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  const statusText =
    connectionState === "connected" ? "متصل · فهرست واقعی مدل‌ها"
    : connectionState === "connecting" ? "در حال اتصال…"
    : connectionState === "error" ? "اتصال ناموفق"
    : "اتصال نشده";

  return (
    <main className="min-h-screen bg-[#060810] px-4 py-6 text-white" dir="rtl">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-black tracking-[.2em] text-cyan-300">FOT10 · AI LAB</div>
            <h1 className="mt-1 text-2xl font-black">آزمایشگاه AshnaAI</h1>
            <p className="mt-1 text-xs text-slate-500">چندمدلی، آزمایشی و قفل‌شده؛ کلید AshnaAI فقط روی سرور می‌ماند.</p>
          </div>
          <Link href="/" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">خانه</Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#0a1422] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-300">وضعیت آزمایشگاه</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-300">{statusText}</span>
          </div>

          <label className="mb-2 block text-xs font-black text-slate-300">رمز آزمایشگاه</label>
          <div className="flex gap-2">
            <input type="password" value={secret} onChange={(e) => { setSecret(e.target.value); setConnectionState("idle"); }} placeholder="ASHNAAI_LAB_SECRET" autoComplete="off" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none" />
            <button onClick={connect} disabled={connecting || !secret.trim()} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black text-cyan-200 disabled:opacity-40">{connecting ? "اتصال…" : "اتصال"}</button>
          </div>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">مدل اصلی</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} disabled={connectionState !== "connected" || loading || !models.length} className="w-full rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none disabled:opacity-50">
            {!models.length && <option value="">پس از اتصال، مدل‌ها دریافت می‌شوند</option>}
            {models.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">مدل‌های مقایسه <span className="font-normal text-slate-500">(حداکثر ۳)</span></label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {models.map((id) => (
              <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                compareModels.includes(id) ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[.02] text-slate-400"
              }`}>
                <input type="checkbox" checked={compareModels.includes(id)} onChange={() => toggleCompare(id)} className="accent-cyan-300" />
                <span className="truncate">{id}</span>
              </label>
            ))}
          </div>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">درخواست آزمایشی</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={7} className="w-full resize-y rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm leading-7 outline-none" />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={runTest} disabled={loading || !message.trim() || connectionState !== "connected"} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{loading ? "در حال تحلیل…" : "اجرای تست"}</button>
            <button onClick={runCompare} disabled={loading || !message.trim() || connectionState !== "connected"} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-40">{loading ? "در حال مقایسه…" : `مقایسه ${compareModels.length || 1} مدل`}</button>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-black text-cyan-300">خروجی آزمایشگاه</div>
            <div className="flex items-center gap-2">
              {benchmarkId && <span className="rounded-lg border border-white/10 bg-white/[.03] px-2 py-1 text-[8px] font-black text-slate-500">{benchmarkId}</span>}
              {comparison.length > 0 && <button onClick={exportCurrent} className="rounded-lg border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1.5 text-[9px] font-black text-cyan-200">خروجی JSON</button>}
            </div>
          </div>

          {compareMeta && (
            <div className="mb-3 text-[9px] font-bold text-slate-500">
              {formatMetric(compareMeta.completed)} از {formatMetric(compareMeta.requested)} پاسخ · {formatMetric(compareMeta.compare_latency_ms, "ms")}
            </div>
          )}

          {comparison.length > 0 ? (
            <div className="space-y-3">
              {comparison.map((item) => {
                const totalTokens = item?.usage?.total_tokens ?? null;

                return (
                  <article key={item.model} className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-cyan-200">{item.model}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500">{item.ok ? "پاسخ دریافت شد" : "خطا"}</span>
                        {item.ok && (
                          <button
                            onClick={() => copyText(item.model, item.text)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-[8px] font-black text-slate-500"
                          >
                            {copiedModel === item.model ? "کپی شد" : "کپی"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={item.ok ? "whitespace-pre-wrap text-sm leading-7 text-slate-200" : "text-sm leading-7 text-red-200"}>
                      {item.ok ? item.text : item.error}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-white/[.025] px-2.5 py-2">
                        <div className="text-[8px] text-slate-600">زمان پاسخ</div>
                        <div className="mt-1 text-[10px] font-black text-slate-300">{formatMetric(item.latency_ms, "ms")}</div>
                      </div>
                      <div className="rounded-xl bg-white/[.025] px-2.5 py-2">
                        <div className="text-[8px] text-slate-600">حروف خروجی</div>
                        <div className="mt-1 text-[10px] font-black text-slate-300">{formatMetric(item.response_chars)}</div>
                      </div>
                      <div className="rounded-xl bg-white/[.025] px-2.5 py-2">
                        <div className="text-[8px] text-slate-600">توکن کل</div>
                        <div className="mt-1 text-[10px] font-black text-slate-300">{formatMetric(totalTokens)}</div>
                      </div>
                      <div className="rounded-xl bg-white/[.025] px-2.5 py-2">
                        <div className="text-[8px] text-slate-600">توکن خروجی</div>
                        <div className="mt-1 text-[10px] font-black text-slate-300">{formatMetric(item?.usage?.completion_tokens ?? null)}</div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {compareMeta && (
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-3">
                  <div className="mb-2 text-[9px] font-black text-cyan-200">متادیتای همین تست</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="text-[9px] text-slate-500">طول درخواست: <span className="font-black text-slate-300">{formatMetric(compareMeta.message_chars)} حرف</span></div>
                    <div className="text-[9px] text-slate-500">مدل‌های درخواستی: <span className="font-black text-slate-300">{formatMetric(compareMeta.requested)}</span></div>
                    <div className="text-[9px] text-slate-500">پاسخ‌های موفق: <span className="font-black text-slate-300">{formatMetric(compareMeta.completed)}</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-3 text-sm leading-7 text-red-200">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-slate-200">{answer || "هنوز تستی اجرا نشده است."}</pre>
          )}

          {usage && <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">توکن ورودی: {usage.prompt_tokens ?? "—"} · خروجی: {usage.completion_tokens ?? "—"} · مجموع: {usage.total_tokens ?? "—"}</div>}
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-cyan-300">سوابق Benchmark</div>
              <div className="mt-1 text-[9px] text-slate-600">تا ۸ تست در همین نشست روی همین دستگاه</div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportHistory} disabled={!history.length} className="rounded-xl border border-cyan-300/10 px-3 py-2 text-[9px] font-black text-cyan-200 disabled:opacity-30">خروجی همه</button>
              <button onClick={clearHistory} disabled={!history.length} className="rounded-xl border border-white/10 px-3 py-2 text-[9px] font-black text-slate-500 disabled:opacity-30">پاک‌کردن</button>
            </div>
          </div>

          {history.length ? (
            <div className="space-y-2">
              {history.map((item) => (
                <details key={item.id} className="rounded-2xl border border-white/10 bg-white/[.02] p-3">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-black text-slate-300">{item.benchmark_id || "Benchmark قدیمی"} · {item.models?.join(" · ") || "مدل‌ها"}</div>
                        <div className="mt-1 truncate text-[9px] text-slate-600">{item.message}</div>
                      </div>
                      <div className="shrink-0 text-left text-[9px] text-slate-600">
                        <div>{item.meta?.completed ?? 0}/{item.meta?.requested ?? 0}</div>
                        <div className="mt-1">{formatMetric(item.meta?.compare_latency_ms, "ms")}</div>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                    <div className="flex items-center justify-between gap-2 text-[8px] text-slate-600">
                      <span>{formatDate(item.created_at)}</span>
                      <button onClick={(event) => { event.preventDefault(); restoreHistory(item); }} className="rounded-lg border border-cyan-300/10 px-2 py-1 text-cyan-200">بازیابی این تست</button>
                    </div>

                    {item.results?.map((result) => (
                      <div key={result.model} className="rounded-xl bg-white/[.02] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black text-cyan-200">{result.model}</span>
                          <span className="text-[8px] text-slate-600">{formatMetric(result.latency_ms, "ms")}</span>
                        </div>
                        <div className="mt-2 text-[9px] leading-5 text-slate-500">
                          {result.ok
                            ? `${formatMetric(result.response_chars)} حرف · ${formatMetric(result?.usage?.total_tokens)} توکن`
                            : result.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[10px] text-slate-600">هنوز سابقه‌ای ثبت نشده است.</div>
          )}
        </section>
      </div>
    </main>
  );
}
