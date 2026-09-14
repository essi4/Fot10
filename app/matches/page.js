"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Radio, RefreshCw, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import HomeLiveMatches from "../components/HomeLiveMatches";

const SETTINGS_KEY = "fot10-settings";
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const LIVE_LABELS = { "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "استراحت", LIVE: "در جریان", "IN PLAY": "در جریان" };

function readSettings() { try { return { autoRefresh: true, compactScores: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return { autoRefresh: true, compactScores: true }; } }
function iranDate(offset = 0) { const now = new Date(); const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {}); const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
function toTime(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" }); }
function mapGame(match) { const statusCode = String(match.statusShort || match.status || "").toUpperCase(); const live = LIVE_CODES.has(statusCode) || /LIVE|IN PLAY|HALF/i.test(statusCode); const finished = FINISHED_CODES.has(statusCode); return { ...match, league: match.league || "مسابقات فوتبال", country: match.country || "", home: match.home || "میزبان", away: match.away || "مهمان", statusCode, statusLabel: live ? (LIVE_LABELS[statusCode] || "در جریان") : finished ? "پایان" : toTime(match.date), minute: live && match.elapsed != null ? `${match.elapsed}'` : finished ? "پایان" : toTime(match.date), live, finished }; }
function sortLive(a, b) { return Number(b.live) - Number(a.live) || String(a.league).localeCompare(String(b.league)); }
function sourceStatus(source, liveOnly) { if (!liveOnly) return null; const value = String(source || "").toLowerCase(); if (value === "thesportsdb-live" || value.includes("fallback")) return { tone: "amber", label: "منبع پشتیبان فعال", detail: "داده زنده از مسیر جایگزین دریافت می‌شود" }; if (value === "api-football") return { tone: "emerald", label: "داده زنده فعال", detail: "اتصال مستقیم به منبع اصلی برقرار است" }; return { tone: "slate", label: "در حال بررسی منابع", detail: "سیستم به‌صورت خودکار منبع مناسب را انتخاب می‌کند" }; }

function DayFilters({ liveOnly, day }) {
  const items = [
    { key: "live", label: "زنده", href: "/matches?live=1", icon: Radio },
    { key: "yesterday", label: "دیروز", href: `/matches?date=${iranDate(-1)}`, icon: CalendarDays },
    { key: "today", label: "امروز", href: `/matches?date=${iranDate(0)}`, icon: CalendarDays },
    { key: "tomorrow", label: "فردا", href: `/matches?date=${iranDate(1)}`, icon: CalendarDays },
  ];
  const active = liveOnly ? "live" : day === -1 ? "yesterday" : day === 1 ? "tomorrow" : "today";
  return <div className="grid grid-cols-4 gap-2">{items.map(({ key, label, href, icon: Icon }) => <Link key={key} href={href} className={`rounded-2xl p-3 text-center transition active:scale-[.98] ${active === key ? key === "live" ? "bg-red-500 text-white shadow-lg shadow-red-500/15" : "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/10" : "glass text-slate-300"}`}><Icon size={16} className="mx-auto mb-1"/><b className="text-[11px]">{label}</b>{key !== "live" && <div className="text-[8px] opacity-70">{new Date(iranDate(key === "yesterday" ? -1 : key === "tomorrow" ? 1 : 0)).toLocaleDateString("fa-IR", { day: "numeric", month: "short", timeZone: "Asia/Tehran" })}</div>}{key === "live" && <div className="text-[8px] opacity-80">لحظه‌ای</div>}</Link>)}</div>;
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const liveOnly = searchParams.get("live") === "1";
  const requestedDate = searchParams.get("date");
  const [games, setGames] = useState([]); const [day, setDay] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [refreshing, setRefreshing] = useState(false); const [settings, setSettings] = useState({ autoRefresh: true, compactScores: true }); const [updatedAt, setUpdatedAt] = useState(null); const [source, setSource] = useState("");
  const requestInFlight = useRef(false);
  const date = useMemo(() => requestedDate || iranDate(day), [requestedDate, day]);
  const status = sourceStatus(source, liveOnly);

  useEffect(() => { const sync = () => setSettings(readSettings()); sync(); window.addEventListener("storage", sync); window.addEventListener("fot10-settings-changed", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("fot10-settings-changed", sync); }; }, []);
  useEffect(() => { if (!requestedDate) { setDay(0); return; } const today = iranDate(0); const yesterday = iranDate(-1); const tomorrow = iranDate(1); setDay(requestedDate === yesterday ? -1 : requestedDate === tomorrow ? 1 : requestedDate === today ? 0 : 0); }, [requestedDate]);

  const loadMatches = useCallback(async ({ manual = false } = {}) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (manual) setRefreshing(true); setLoading(true); setError("");
    try {
      const endpoint = liveOnly ? "/api/football/live" : `/api/football/fixtures?date=${date}`;
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), liveOnly ? 18000 : 12000); let response;
      try { response = await fetch(`${endpoint}${liveOnly ? `?t=${Date.now()}` : ""}`, { cache: "no-store", signal: controller.signal }); } finally { clearTimeout(timeout); }
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "دریافت مسابقات ناموفق بود");
      const sourceMatches = Array.isArray(payload.matches) ? payload.matches : [];
      const mapped = sourceMatches.map(mapGame).filter((g) => liveOnly ? g.live : true).sort(sortLive);
      setGames(mapped); setSource(payload.source || ""); setUpdatedAt(payload.checkedAt ? new Date(payload.checkedAt) : new Date());
      if (!mapped.length && liveOnly) setError("فعلاً بازی زنده‌ای از منابع معتبر دریافت نشد؛ بررسی خودکار ادامه دارد.");
    } catch (err) { setError(err?.name === "AbortError" ? "پاسخ سرویس زنده دیر رسید؛ بررسی خودکار ادامه دارد." : err?.message || "اتصال داده مسابقات برقرار نشد."); }
    finally { requestInFlight.current = false; setLoading(false); setRefreshing(false); }
  }, [date, liveOnly]);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => { if (!settings.autoRefresh || !liveOnly) return; const timer = setInterval(() => loadMatches(), 15000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);
  useEffect(() => { if (!settings.autoRefresh || liveOnly) return; const timer = setInterval(() => loadMatches(), 30000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);

  const liveCount = games.filter((g) => g.live).length; const grouped = games.reduce((acc, g) => { const key = g.country ? `${g.country} · ${g.league}` : g.league; (acc[key] ||= []).push(g); return acc; }, {}); const dayLabel = day === -1 ? "دیروز" : day === 1 ? "فردا" : "امروز";

  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">{liveOnly ? "نتایج زنده" : "مرکز بازی‌ها"}</h1><p className="text-[11px] text-slate-500">{liveOnly ? "نبض لحظه‌ای مسابقات فوتبال" : "نتایج واقعی و زنده فوتبال"}</p></div></div><button onClick={() => loadMatches({ manual: true })} className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""}/></button></header>
    <DayFilters liveOnly={liveOnly} day={day}/>
    {!liveOnly && <HomeLiveMatches />}
    {liveOnly ? <section className="rounded-3xl border border-red-400/15 bg-gradient-to-br from-red-500/[.07] via-white/[.025] to-transparent p-4 shadow-xl"><div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Radio size={18} className="text-red-300"/><h2 className="text-base font-black">نبض زنده فوتبال</h2><span className="rounded-full bg-red-500/10 px-2 py-1 text-[8px] font-black text-red-300">LIVE</span></div><p className="mt-1 text-[9px] text-slate-500">بازی‌های زنده هر ۱۵ ثانیه بررسی می‌شوند و در صورت قطعی یک منبع، منبع جایگزین خودکار وارد عمل می‌شود.</p></div><div className="rounded-2xl bg-red-500/10 px-3 py-2 text-center"><b className="block text-lg text-red-200">{liveCount}</b><span className="text-[8px] text-slate-500">بازی زنده</span></div></div>{status && <div className={`mt-3 rounded-2xl border px-3 py-2 ${status.tone === "emerald" ? "border-emerald-400/20 bg-emerald-400/5" : status.tone === "amber" ? "border-amber-400/20 bg-amber-400/5" : "border-white/10 bg-white/[.025]"}`}><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${status.tone === "emerald" ? "bg-emerald-400 animate-pulse" : status.tone === "amber" ? "bg-amber-400 animate-pulse" : "bg-slate-500"}`} /><span className={`text-[10px] font-black ${status.tone === "emerald" ? "text-emerald-300" : status.tone === "amber" ? "text-amber-300" : "text-slate-300"}`}>{status.label}</span></div><p className="mt-1 text-[9px] text-slate-500">{status.detail}</p></div>}{updatedAt && <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[8px] text-slate-600"><span>{settings.autoRefresh ? "به‌روزرسانی خودکار فعال" : "به‌روزرسانی خودکار خاموش"}</span><span>{source ? `منبع: ${source}` : "منبع در حال بررسی"} · آخرین بروزرسانی {updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></div>}</section> : null}
    <div className="grid grid-cols-3 gap-2"><div className={`rounded-2xl p-3 text-center ${liveOnly ? "bg-red-500 text-white" : "bg-emerald-400 text-slate-950"}`}><Radio size={16} className="mx-auto mb-1"/><b className="text-sm">زنده</b><div className="text-[10px]">{liveCount} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Clock3 size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">{liveOnly ? "لحظه‌ای" : dayLabel}</b><div className="text-[10px] text-slate-500">{games.length} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Trophy size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">لیگ‌ها</b><div className="text-[10px] text-slate-500">{Object.keys(grouped).length}</div></div></div>
    {error && <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-4 py-3 text-[11px] text-amber-200">{error}</div>}
    {loading ? <section className="glass card p-8 text-center text-sm text-slate-400">{liveOnly ? "در حال دریافت بازی‌های زنده واقعی…" : "در حال دریافت مسابقات واقعی…"}</section> : Object.keys(grouped).length ? <section className="space-y-4">{Object.entries(grouped).map(([league, list]) => <div key={league}><div className="px-1 mb-2 text-xs font-black text-slate-400">{league}</div><div className="space-y-3">{list.map(g => <Link key={g.id} href={g.detailAvailable === false ? `/matches?date=${date}` : `/matches/${g.id}`} className={`glass card block overflow-hidden active:scale-[.99] transition ${settings.compactScores ? "p-3" : "p-4"}`}><div className="flex justify-between items-center mb-4"><span className="text-[11px] text-slate-400">{g.league}</span>{g.live?<span className="flex items-center gap-1 text-[10px] text-red-300 font-black"><i className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"/> {g.statusLabel}{g.elapsed != null ? ` · ${g.elapsed}'` : ""}</span>:<span className="text-[10px] text-slate-500">{g.statusLabel}</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-white/5 grid place-items-center overflow-hidden">{g.homeLogo ? <img src={g.homeLogo} alt="" className="h-8 w-8 object-contain"/> : <span className="font-black">{g.home[0]}</span>}</div><div className="mt-2 font-bold text-sm">{g.home}</div></div><div className="text-center"><div className={`text-xl font-black ${g.live ? "text-white" : "text-slate-300"}`}>{g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : "—"}</div>{g.live && <div className="text-[10px] text-red-300 mt-1">{g.statusLabel}</div>}</div><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-white/5 grid place-items-center overflow-hidden">{g.awayLogo ? <img src={g.awayLogo} alt="" className="h-8 w-8 object-contain"/> : <span className="font-black">{g.away[0]}</span>}</div><div className="mt-2 font-bold text-sm">{g.away}</div></div></div><div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500"><span>{g.detailAvailable === false ? "اطلاعات خلاصه مسابقه" : g.live ? "جزئیات زنده مسابقه" : "جزئیات مسابقه"}</span><span>›</span></div></Link>)}</div></div>)}</section> : <section className="glass card p-8 text-center text-sm text-slate-500">{liveOnly ? "فعلاً بازی زنده‌ای پیدا نشد؛ بررسی خودکار ادامه دارد." : `برای ${dayLabel} مسابقه‌ای از منابع در دسترس دریافت نشد.`}</section>}
  </div></main>;
}

export default function MatchesPage() { return <Suspense fallback={<main className="fot-shell"><div className="fot-container p-8 text-center text-sm text-slate-500">در حال آماده‌سازی مرکز بازی‌ها…</div></main>}><MatchesContent /></Suspense>; }
