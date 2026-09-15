"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

function iranDate(offset = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const CHECKS = [
  { key: "app", title: "خود اپلیکیشن", detail: "صفحه اصلی FOT10 و پاسخ Production", url: "/" },
  { key: "live", title: "بازی‌های زنده", detail: "مسیر داده زنده و پاسخ معتبر", url: "/api/football/live" },
  { key: "yesterday", title: "دیروز", detail: "داده مسابقات روز گذشته", date: -1 },
  { key: "today", title: "امروز", detail: "داده مسابقات امروز", date: 0 },
  { key: "tomorrow", title: "فردا", detail: "داده برنامه مسابقات فردا", date: 1 },
];

async function probe(check) {
  const url = check.url || `/api/football/fixtures?date=${iranDate(check.date)}`;
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    const payload = check.key === "app" ? null : await response.json().catch(() => null);
    const matches = Array.isArray(payload?.matches) ? payload.matches : null;
    const ok = response.status >= 200 && response.status < 300;
    return { ...check, ok, status: response.status, ms: Math.round(performance.now() - started), count: matches?.length ?? null, source: payload?.source || payload?.provider || "Production" };
  } catch (error) {
    return { ...check, ok: false, status: 0, ms: Math.round(performance.now() - started), error: error?.name === "AbortError" ? "پاسخ دیر رسید" : "اتصال برقرار نشد" };
  } finally {
    clearTimeout(timer);
  }
}

export default function InspectorPage() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

  const runAudit = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setCheckedAt(null);
    const next = [];
    for (const check of CHECKS) next.push(await probe(check));
    setResults(next);
    setCheckedAt(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runAudit(); }, [runAudit]);

  const passed = results.filter((item) => item.ok === true).length;
  const complete = results.length === CHECKS.length;
  const healthy = complete && passed === CHECKS.length;

  return (
    <main className="fot-container min-h-screen pb-28">
      <header className="relative overflow-hidden rounded-[28px] border border-emerald-300/15 bg-gradient-to-br from-[#10251e] via-[#0b1517] to-[#080c15] p-5 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/settings" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-slate-300"><ArrowRight size={19} /></Link>
          <div className="text-right"><p className="text-[9px] font-black tracking-widest text-emerald-300">FOT10 · SENIOR INSPECTOR</p><h1 className="mt-1 text-2xl font-black">بازرس ارشد</h1></div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"><ShieldCheck size={22} /></div>
        </div>
        <p className="relative mt-4 text-[10px] leading-5 text-slate-400">پنج کنترل اصلی برنامه را مستقیماً از داخل Production بررسی می‌کند؛ بدون حدس و بدون نمایش وضعیت ساختگی.</p>
      </header>

      <section className={`mt-4 rounded-[24px] border p-4 ${healthy ? "border-emerald-300/20 bg-emerald-400/[.06]" : complete ? "border-rose-300/20 bg-rose-400/[.05]" : "border-white/10 bg-white/[.035]"}`}>
        <div className="flex items-center gap-3">
          {healthy ? <CheckCircle2 className="text-emerald-300" size={25} /> : <Clock3 className={running ? "animate-pulse text-amber-300" : "text-slate-400"} size={25} />}
          <div className="min-w-0 flex-1 text-right"><div className="text-[13px] font-black">{healthy ? "حکم بازرس: سبز" : running ? "بازرسی در حال اجرا…" : `${passed} از ${CHECKS.length} کنترل موفق`}</div><div className="mt-1 text-[8px] font-bold text-slate-600">{checkedAt ? `آخرین بررسی: ${checkedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "در حال دریافت وضعیت واقعی"}</div></div>
          <button onClick={runAudit} disabled={running} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-slate-300 disabled:opacity-40" aria-label="اجرای دوباره بازرسی"><RefreshCw size={17} className={running ? "animate-spin" : ""} /></button>
        </div>
      </section>

      <section className="mt-4 space-y-2.5">
        {CHECKS.map((check) => {
          const result = results.find((item) => item.key === check.key);
          return <article key={check.key} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${result?.ok === true ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300" : result ? "border-rose-300/20 bg-rose-400/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-500"}`}>{result?.ok === true ? <CheckCircle2 size={18} /> : result ? <XCircle size={18} /> : <Clock3 size={18} />}</div><div className="min-w-0 flex-1 text-right"><h2 className="text-[11px] font-black text-slate-100">{check.title}</h2><p className="mt-1 text-[8px] font-bold leading-4 text-slate-600">{check.detail}</p></div><div className="text-left text-[8px] font-black text-slate-500">{result ? `${result.ms}ms` : "…"}</div></div>{result && <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[8px] font-bold"><span className={result.ok === true ? "text-emerald-300" : "text-rose-300"}>{result.ok === true ? "معتبر" : result.error || `HTTP ${result.status}`}</span><span className="text-slate-600">{result.count !== null ? `${result.count} بازی · ${result.source}` : "Production"}</span></div>}</article>;
        })}
      </section>

      <div className="mt-4 rounded-2xl border border-blue-300/10 bg-blue-400/[.035] p-4 text-right"><p className="text-[9px] font-black text-blue-200">قانون بازرس</p><p className="mt-1 text-[8px] leading-5 font-bold text-slate-600">خالی بودن نتیجه لزوماً خرابی سرویس نیست؛ وضعیت HTTP، زمان پاسخ و منبع داده هم‌زمان بررسی می‌شوند.</p></div>
    </main>
  );
}