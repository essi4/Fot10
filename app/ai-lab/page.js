"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Copy, Download, Search, ShieldCheck, Sparkles, Trash2, RotateCcw, X } from "lucide-react";

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
  const [modelFilter, setModelFilter] = useState("");
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
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(null);
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historySort, setHistorySort] = useState("newest");
  const [selectedHistory, setSelectedHistory] = useState([]);

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
    setCompareModels((current) => current.filter((id) => ids.includes(id)).slice(0, 3));
    setModelFilter("");
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
    setCompareModels((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setError("حداکثر ۳ مدل برای مقایسه مجاز است.");
        return current;
      }
      return [...current, id];
    });
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

  function exportSelectedHistory() {
    const selected = history.filter((item) => selectedHistory.includes(item.id));
    if (!selected.length) {
      setError("حداقل یک Benchmark را انتخاب کن.");
      return;
    }
    const payload = { exported_at: new Date().toISOString(), count: selected.length, benchmarks: selected };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fot10-ai-selected-benchmarks.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    setHistory([]);
    setSelectedHistory([]);
    setHistoryExpanded(null);
    try {
      sessionStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  function resetHistoryFilters() {
    setHistoryFilter("");
    setHistoryStatus("all");
    setHistorySort("newest");
    setSelectedHistory([]);
    setHistoryExpanded(null);
  }

  const dashboardStats = (() => {
    const runs = history.flatMap((item) => Array.isArray(item.results) ? item.results : []);
    const successful = runs.filter((item) => item?.ok).length;
    const latencyValues = runs.map((item) => item?.latency_ms).filter((value) => Number.isFinite(value));
    const tokenValues = runs.map((item) => item?.usage?.total_tokens).filter((value) => Number.isFinite(value));
    const modelsUsed = new Set(history.flatMap((item) => Array.isArray(item.models) ? item.models : []));

    return {
      benchmarks: history.length,
      modelRuns: runs.length,
      successful,
      failed: Math.max(0, runs.length - successful),
      avgLatency: latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : null,
      totalTokens: tokenValues.length ? tokenValues.reduce((sum, value) => sum + value, 0) : null,
      models: modelsUsed.size,
    };
  })();

  const latestBenchmark = history[0] || null;

  const statusText =
    connectionState === "connected" ? "متصل · فهرست واقعی مدل‌ها"
    : connectionState === "connecting" ? "در حال اتصال…"
    : connectionState === "error" ? "اتصال ناموفق"
    : "اتصال نشده";

  return (
    <main className="min-h-screen bg-[#060810] px-4 pb-32 pt-16 text-white sm:px-5 sm:pb-28 sm:pt-20" dir="rtl">
      <div className="mx-auto w-full max-w-3xl">
        <header className="relative mb-4 overflow-hidden rounded-[28px] border border-cyan-300/10 bg-gradient-to-br from-[#0c1727] via-[#0a1422] to-[#07101d] p-4 shadow-2xl sm:p-5">
          <div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-cyan-300/[.08] blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-40 w-40 rounded-full bg-emerald-400/[.06] blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Sparkles size={20}/></div>
              <div className="min-w-0">
                <div className="text-[9px] font-black tracking-[.2em] text-cyan-300">FOT10 · AI LAB</div>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">آزمایشگاه AshnaAI</h1>
                <p className="mt-1 max-w-2xl text-[10px] font-bold leading-5 text-slate-500">محیط کنترل‌شده برای تست، مقایسه و اندازه‌گیری پاسخ مدل‌های هوش مصنوعی.</p>
              </div>
            </div>
            <Link href="/" aria-label="بازگشت به خانه" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 transition hover:bg-white/[.08] hover:text-white"><ChevronLeft size={17}/></Link>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2 text-[8px] font-black">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/[.06] px-2.5 py-1.5 text-emerald-200"><ShieldCheck size={11}/>کلید در سرور</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-400/[.06] px-2.5 py-1.5 text-cyan-200">حداکثر ۳ مدل</span>
            <span className="rounded-full border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-slate-400">Benchmark محلی</span>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#0a1422] p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-300">اتصال به آزمایشگاه</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-300">{statusText}</span>
          </div>

          <label className="mb-2 block text-xs font-black text-slate-300">رمز آزمایشگاه</label>
          <div className="flex gap-2">
            <input type="password" value={secret} onChange={(e) => { setSecret(e.target.value); setConnectionState("idle"); }} placeholder="ASHNAAI_LAB_SECRET" autoComplete="off" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10" dir="ltr" />
            <button onClick={connect} disabled={connecting || !secret.trim()} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-black text-cyan-200 disabled:opacity-40">{connecting ? "اتصال…" : "اتصال"}</button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[8px] font-bold text-slate-600">
            <span className={connectionState === "connected" ? "h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,.7)]" : "h-1.5 w-1.5 rounded-full bg-slate-700"} />
            <span>{connectionState === "connected" ? `اتصال فعال · ${models.length.toLocaleString("fa-IR")} مدل در کاتالوگ` : "کلید فقط برای همین نشست استفاده می‌شود."}</span>
          </div>

          <label className="mb-2 mt-4 block text-xs font-black text-slate-300">مدل اصلی</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} disabled={connectionState !== "connected" || loading || !models.length} className="w-full rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10 disabled:opacity-50" dir="ltr">
            {!models.length && <option value="">پس از اتصال، مدل‌ها دریافت می‌شوند</option>}
            {models.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>

          <div className="mb-2 mt-4 flex items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-300">مدل‌های مقایسه</label>
            <span className="text-[9px] font-black text-slate-600">{compareModels.length}/۳ انتخاب</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.018] p-3">
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#07101d] px-3 py-2.5">
              <Search size={14} className="shrink-0 text-slate-600" />
              <input value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} dir="ltr" placeholder="جستجوی مدل..." className="min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-700" />
            </div>

            <div className="mb-2 flex flex-wrap gap-1.5">
              {compareModels.map((id) => (
                <button key={id} type="button" onClick={() => toggleCompare(id)} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5 text-[9px] font-black text-cyan-100">
                  <span className="max-w-[190px] truncate" dir="ltr">{id}</span><span aria-hidden="true">×</span>
                </button>
              ))}
              {!compareModels.length && <span className="text-[9px] text-slate-600">برای مقایسه، مدل‌ها را از جستجو انتخاب کن.</span>}
            </div>

            {models.length ? (
              <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {models
                  .filter((id) => id.toLowerCase().includes(modelFilter.trim().toLowerCase()))
                  .slice(0, 12)
                  .map((id) => (
                    <label key={id} className={"flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[10px] transition " + (compareModels.includes(id) ? "border-cyan-300/25 bg-cyan-300/[.08] text-cyan-100" : "border-white/10 bg-white/[.015] text-slate-500 hover:border-white/15 hover:text-slate-300")}>
                      <input type="checkbox" checked={compareModels.includes(id)} onChange={() => toggleCompare(id)} className="accent-cyan-300" />
                      <span className="truncate" dir="ltr">{id}</span>
                    </label>
                  ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-[9px] text-slate-600">ابتدا به آزمایشگاه متصل شو.</div>
            )}

            {models.filter((id) => id.toLowerCase().includes(modelFilter.trim().toLowerCase())).length > 12 && (
              <div className="mt-2 text-[8px] text-slate-600">برای دیدن مدل‌های بیشتر، عبارت جستجو را دقیق‌تر کن.</div>
            )}
          </div>

          <div className="mb-2 mt-4 flex items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-300">درخواست آزمایشی</label>
            <span className={`text-[9px] font-bold ${message.length > 3600 ? "text-amber-300" : "text-slate-600"}`}>{message.length.toLocaleString("fa-IR")} / ۴۰۰۰</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            rows={7}
            placeholder="سؤال یا سناریوی آزمایشی را اینجا بنویس…"
            className="w-full resize-y rounded-2xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm leading-7 outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
          />

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={runTest} disabled={loading || !message.trim() || connectionState !== "connected"} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 active:scale-[.99] disabled:opacity-40">{loading ? "در حال تحلیل…" : "اجرای تست"}</button>
            <button onClick={runCompare} disabled={loading || !message.trim() || connectionState !== "connected"} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300/[.15] active:scale-[.99] disabled:opacity-40">{loading ? "در حال مقایسه…" : `مقایسه ${compareModels.length || 1} مدل`}</button>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-cyan-300">خروجی آزمایشگاه</div>
              <div className="mt-1 text-[8px] font-bold text-slate-600">پاسخ‌ها و متریک‌های همین اجرای آزمایشی</div>
            </div>
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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {comparison.map((item) => {
                const totalTokens = item?.usage?.total_tokens ?? null;

                return (
                  <article key={item.model} className="rounded-2xl border border-white/10 bg-white/[.025] p-3 shadow-lg shadow-black/10">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="max-w-[68%] truncate text-[10px] font-black text-cyan-200" dir="ltr">{item.model}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500">{item.ok ? "پاسخ دریافت شد" : "خطا"}</span>
                        {item.ok && (
                          <button
                            onClick={() => copyText(item.model, item.text)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[8px] font-black text-slate-500 transition hover:border-cyan-300/20 hover:text-cyan-200"
                          >
                            <Copy size={10}/>{copiedModel === item.model ? "کپی شد" : "کپی"}
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
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-3 lg:col-span-3">
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
            <div aria-live="polite" className="rounded-2xl border border-red-400/20 bg-red-400/5 p-3 text-sm leading-7 text-red-200">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-slate-200">{answer || "هنوز تستی اجرا نشده است."}</pre>
          )}

          {usage && <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-500">توکن ورودی: {usage.prompt_tokens ?? "—"} · خروجی: {usage.completion_tokens ?? "—"} · مجموع: {usage.total_tokens ?? "—"}</div>}
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-cyan-300">داشبورد Benchmark</div>
              <div className="mt-1 text-[8px] font-bold text-slate-600">خلاصه آماری همین نشست؛ بدون رتبه‌بندی مدل‌ها</div>
            </div>
            {latestBenchmark && (
              <span className="rounded-full border border-white/10 bg-white/[.03] px-2.5 py-1 text-[8px] font-black text-slate-500">
                آخرین اجرا · {formatDate(latestBenchmark.created_at)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-white/[.025] p-3">
              <div className="text-[8px] text-slate-600">تعداد تست</div>
              <div className="mt-1 text-lg font-black text-slate-100">{formatMetric(dashboardStats.benchmarks)}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[.025] p-3">
              <div className="text-[8px] text-slate-600">اجرای مدل</div>
              <div className="mt-1 text-lg font-black text-slate-100">{formatMetric(dashboardStats.modelRuns)}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[.025] p-3">
              <div className="text-[8px] text-slate-600">میانگین زمان پاسخ</div>
              <div className="mt-1 text-lg font-black text-slate-100">{formatMetric(dashboardStats.avgLatency, "ms")}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[.025] p-3">
              <div className="text-[8px] text-slate-600">توکن مصرف‌شده</div>
              <div className="mt-1 text-lg font-black text-slate-100">{formatMetric(dashboardStats.totalTokens)}</div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-emerald-400/[.045] px-3 py-2">
              <div className="text-[8px] text-slate-600">پاسخ موفق</div>
              <div className="mt-1 text-[10px] font-black text-emerald-200">{formatMetric(dashboardStats.successful)}</div>
            </div>
            <div className="rounded-xl bg-red-400/[.035] px-3 py-2">
              <div className="text-[8px] text-slate-600">پاسخ ناموفق</div>
              <div className="mt-1 text-[10px] font-black text-red-200">{formatMetric(dashboardStats.failed)}</div>
            </div>
            <div className="rounded-xl bg-cyan-400/[.04] px-3 py-2">
              <div className="text-[8px] text-slate-600">مدل‌های استفاده‌شده</div>
              <div className="mt-1 text-[10px] font-black text-cyan-200">{formatMetric(dashboardStats.models)}</div>
            </div>
            <div className="rounded-xl bg-white/[.025] px-3 py-2">
              <div className="text-[8px] text-slate-600">ظرفیت تاریخچه</div>
              <div className="mt-1 text-[10px] font-black text-slate-300">{formatMetric(history.length)} / {formatMetric(MAX_HISTORY)}</div>
            </div>
          </div>

          {latestBenchmark && (
            <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[8px] font-black text-cyan-200">آخرین Benchmark</div>
                  <div className="mt-1 truncate text-[10px] font-black text-slate-300">{latestBenchmark.benchmark_id || "Benchmark"}</div>
                  <div className="mt-1 truncate text-[9px] text-slate-600">{latestBenchmark.message}</div>
                </div>
                <div className="shrink-0 text-left text-[9px] text-slate-500">
                  <div>{latestBenchmark.models?.length || 0} مدل</div>
                  <div className="mt-1">{formatMetric(latestBenchmark.meta?.compare_latency_ms, "ms")}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-3xl border border-white/10 bg-[#0a1422] p-4">
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[.018] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300"><Check size={13}/>سوابق Benchmark</div>
                  <span className="rounded-full border border-white/10 bg-white/[.03] px-2 py-1 text-[8px] font-black text-slate-500">{history.length.toLocaleString("fa-IR")} / {MAX_HISTORY} تست</span>
                </div>
                <div className="mt-1 text-[8px] text-slate-600">مدیریت فیلتر، انتخاب و خروجی در همین پنل</div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={resetHistoryFilters} disabled={!history.length} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[8px] font-black text-slate-400 disabled:opacity-30"><X size={10}/>پاک‌کردن فیلترها</button>
                <button onClick={exportSelectedHistory} disabled={!selectedHistory.length} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1.5 text-[8px] font-black text-cyan-200 disabled:opacity-30"><Download size={10}/>خروجی انتخاب‌شده{selectedHistory.length ? " (" + selectedHistory.length + ")" : ""}</button>
                <button onClick={exportHistory} disabled={!history.length} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/10 px-2.5 py-1.5 text-[8px] font-black text-cyan-200 disabled:opacity-30"><Download size={10}/>خروجی همه</button>
                <button onClick={clearHistory} disabled={!history.length} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[8px] font-black text-slate-500 disabled:opacity-30"><Trash2 size={10}/>پاک‌کردن تاریخچه</button>
              </div>
            </div>
          </div>

          {history.length ? (
            <>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#07101d] px-3 py-2.5">
                  <Search size={13} className="shrink-0 text-slate-600" />
                  <input value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} dir="rtl" placeholder="جستجوی Benchmark، مدل یا درخواست..." className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-700" />
                  {historyFilter && <button onClick={() => setHistoryFilter("")} aria-label="پاک‌کردن جستجو" className="text-slate-600 hover:text-white"><X size={13}/></button>}
                </div>
                <select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} className="rounded-2xl border border-white/10 bg-[#07101d] px-3 py-2.5 text-[9px] font-black text-slate-400 outline-none">
                  <option value="all">همه وضعیت‌ها</option><option value="success">موفق</option><option value="failed">دارای خطا</option>
                </select>
                <select value={historySort} onChange={(e) => setHistorySort(e.target.value)} className="rounded-2xl border border-white/10 bg-[#07101d] px-3 py-2.5 text-[9px] font-black text-slate-400 outline-none">
                  <option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option><option value="latency">بیشترین زمان</option>
                </select>
              </div>

              {(() => {
                const q = historyFilter.trim().toLowerCase();
                const filteredHistory = history
                  .filter((item) => {
                    const results = item.results || [];
                    const okCount = results.filter((result) => result?.ok).length;
                    const statusMatch = historyStatus === "all" || (historyStatus === "success" ? okCount === results.length : okCount < results.length);
                    const textMatch = !q || [item.benchmark_id, item.message, ...(item.models || [])].join(" ").toLowerCase().includes(q);
                    return statusMatch && textMatch;
                  })
                  .sort((a,b) => {
                    if (historySort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
                    if (historySort === "latency") return (b.meta?.compare_latency_ms || 0) - (a.meta?.compare_latency_ms || 0);
                    return new Date(b.created_at) - new Date(a.created_at);
                  });

                return <>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[8px] text-slate-600">
                    <span>{filteredHistory.length.toLocaleString("fa-IR")} مورد نمایش داده می‌شود · {selectedHistory.length.toLocaleString("fa-IR")} مورد انتخاب شده</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedHistory(selectedHistory.length === filteredHistory.length ? [] : filteredHistory.map((item) => item.id))} className="font-black text-cyan-300">{selectedHistory.length === filteredHistory.length && filteredHistory.length ? "لغو انتخاب" : "انتخاب همه فیلترشده"}</button>
                    </div>
                  </div>

                  <div className="mb-2 grid grid-cols-[auto_1fr_auto] gap-2 px-3 text-[8px] font-black text-slate-700 sm:grid-cols-[auto_1fr_120px_70px]">
                    <span></span><span>Benchmark / درخواست</span><span className="hidden sm:block">مدل‌ها</span><span className="text-left">نتیجه</span>
                  </div>

                  <div className="space-y-1.5">
                    {filteredHistory.map((item) => {
                      const successCount = (item.results || []).filter((result) => result?.ok).length;
                      const isExpanded = historyExpanded === item.id;
                      const isSelected = selectedHistory.includes(item.id);
                      return (
                        <div key={item.id} className={"overflow-hidden rounded-2xl border " + (isSelected ? "border-cyan-300/25 bg-cyan-300/[.035]" : "border-white/10 bg-white/[.018]")}>
                          <div className="flex items-stretch">
                            <label className="flex w-10 shrink-0 cursor-pointer items-center justify-center border-l border-white/5">
                              <input type="checkbox" checked={isSelected} onChange={() => setSelectedHistory((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} className="accent-cyan-300" />
                            </label>
                            <button type="button" onClick={() => setHistoryExpanded(isExpanded ? null : item.id)} className="min-w-0 flex-1 px-3 py-3 text-right transition hover:bg-white/[.025]">
                              <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_120px_70px]">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2"><span className="shrink-0 rounded-md border border-cyan-300/10 bg-cyan-300/[.04] px-1.5 py-0.5 text-[7px] font-black text-cyan-300">{item.benchmark_id || "BENCHMARK"}</span><span className="text-[8px] text-slate-700">{formatDate(item.created_at)}</span></div>
                                  <div className="mt-1 truncate text-[10px] font-black text-slate-300">{item.message}</div>
                                </div>
                                <div className="text-left"><div className={successCount === (item.results || []).length ? "text-[9px] font-black text-emerald-200" : "text-[9px] font-black text-amber-200"}>{successCount}/{item.results?.length || 0}</div><div className="mt-1 text-[8px] text-slate-700">{formatMetric(item.meta?.compare_latency_ms,"ms")}</div></div>
                              </div>
                              <div className="mt-1 hidden truncate text-[8px] text-slate-600 sm:block" dir="ltr">{(item.models || []).join(" · ")}</div>
                            </button>
                          </div>
                          {isExpanded && <div className="border-t border-white/5 bg-black/10 p-3"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="text-[8px] text-slate-600">{formatDate(item.created_at)} · {item.models?.length || 0} مدل · {formatMetric(item.meta?.message_chars)} حرف</div><button onClick={() => restoreHistory(item)} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1.5 text-[8px] font-black text-cyan-200"><RotateCcw size={10}/>بازیابی</button></div><div className="space-y-1.5">{(item.results || []).map((result) => <div key={result.model} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.025] px-3 py-2"><div className="min-w-0"><div className="truncate text-[9px] font-black text-cyan-200" dir="ltr">{result.model}</div><div className="mt-1 text-[8px] text-slate-600">{result.ok ? `${formatMetric(result.response_chars)} حرف · ${formatMetric(result?.usage?.total_tokens)} توکن` : result.error}</div></div><div className="shrink-0 text-left text-[8px] text-slate-500">{formatMetric(result.latency_ms,"ms")}</div></div>)}</div></div>}
                        </div>
                      );
                    })}
                  </div>
                  {!filteredHistory.length && <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[9px] text-slate-600">نتیجه‌ای با این فیلتر پیدا نشد.</div>}
                </>;
              })()}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[10px] text-slate-600">هنوز سابقه‌ای ثبت نشده است.</div>
          )}        </section>
      </div>
    </main>
  );
}
