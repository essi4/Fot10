"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, Clock3, Radio, RefreshCw, Shield, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import HomeLiveMatches from "../components/HomeLiveMatches";

const SETTINGS_KEY = "fot10-settings";
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const LIVE_LABELS = { "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "استراحت", LIVE: "در جریان", "IN PLAY": "در جریان" };

const TEAM_FA = {
  "Manchester City": "منچسترسیتی", "Manchester United": "منچستریونایتد", Liverpool: "لیورپول", Arsenal: "آرسنال",
  Chelsea: "چلسی", Tottenham: "تاتنهام", "Real Madrid": "رئال مادرید", Barcelona: "بارسلونا",
  "Atletico Madrid": "اتلتیکومادرید", "Bayern Munich": "بایرن مونیخ", "Union Berlin": "یونیون برلین",
  "Borussia Dortmund": "بوروسیا دورتموند", Juventus: "یوونتوس", Inter: "اینتر", "AC Milan": "آث میلان",
  PSG: "پاری‌سن‌ژرمن", Monaco: "موناکو", "Watford": "واتفورد", "Bristol City": "بریستول سیتی",
  Groningen: "خرونینگن", "PEC Zwolle": "پک زووله", "Espanyol": "اسپانیول", "Elche": "الچه",
  "RC Lens": "لانس", "Sassuolo": "ساسولو", "Monza": "مونتزا", Tractor: "تراکتور",
  Persepolis: "پرسپولیس", Esteghlal: "استقلال", Sepahan: "سپاهان"
};
const faTeam = (name) => TEAM_FA[name] || String(name || "").replace(/^\s*[A-Z]\s+/, "").replace(/^\d+\.\s*/, "");

function readSettings() { try { return { autoRefresh: true, compactScores: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return { autoRefresh: true, compactScores: true }; } }
function iranDate(offset = 0) { const now = new Date(); const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {}); const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
function toTime(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" }); }
function toFaDate(value) { return new Date(`${value}T12:00:00+03:30`).toLocaleDateString("fa-IR", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Tehran" }); }
function mapGame(match) {
  const statusCode = String(match.statusShort || match.status || "").toUpperCase();
  const live = LIVE_CODES.has(statusCode) || /LIVE|IN PLAY|HALF/i.test(statusCode);
  const finished = FINISHED_CODES.has(statusCode);
  return {
    ...match,
    league: match.league || "مسابقات فوتبال",
    country: match.country || "",
    home: faTeam(match.home || "میزبان"),
    away: faTeam(match.away || "مهمان"),
    homeLogo: match.homeLogo || match.home_logo || match.homeTeamLogo || match.teams?.home?.logo || match.homeTeam?.logo || "",
    awayLogo: match.awayLogo || match.away_logo || match.awayTeamLogo || match.teams?.away?.logo || match.awayTeam?.logo || "",
    statusCode,
    statusLabel: live ? (LIVE_LABELS[statusCode] || "در جریان") : finished ? "پایان" : toTime(match.date),
    minute: live && match.elapsed != null ? String(match.elapsed) + "'" : finished ? "پایان" : toTime(match.date),
    live,
    finished
  };
}
function sortLive(a, b) { return Number(b.live) - Number(a.live) || String(a.league).localeCompare(String(b.league)); }
function sourceStatus(source, liveOnly) { if (!liveOnly) return null; const value = String(source || "").toLowerCase(); if (value === "thesportsdb-live" || value.includes("fallback")) return { tone: "amber", label: "مسیر پشتیبان فعال" }; if (value === "api-football") return { tone: "emerald", label: "داده زنده فعال" }; return { tone: "slate", label: "در حال بررسی منابع" }; }

function mergeSummary(previous, next) {
  if (!next?.ok) return previous;
  if (!previous) return next;
  const keys = ["live", "yesterday", "today", "tomorrow"];
  const merged = { ...next };
  for (const key of keys) {
    const incoming = next[key], prior = previous[key];
    if (incoming && prior && Number(incoming.count || 0) === 0 && Number(prior.count || 0) > 0) merged[key] = prior;
  }
  return merged;
}

function DayFilters({ liveOnly, day, summary }) {
  const fallback = { count: 0, leagues: 0 };
  const stats = { live: summary?.live || fallback, yesterday: summary?.yesterday || fallback, today: summary?.today || fallback, tomorrow: summary?.tomorrow || fallback };
  const items = [
    { key: "live", label: "زنده", date: "LIVE", meta: stats.live.count ? `${stats.live.count} بازی` : "بدون بازی", href: "/matches?live=1", icon: Radio },
    { key: "yesterday", label: "دیروز", date: toFaDate(iranDate(-1)), meta: `${stats.yesterday.count} بازی`, href: `/matches?date=${iranDate(-1)}`, icon: CalendarDays },
    { key: "today", label: "امروز", date: toFaDate(iranDate(0)), meta: `${stats.today.count} بازی`, href: `/matches?date=${iranDate(0)}`, icon: CalendarDays },
    { key: "tomorrow", label: "فردا", date: toFaDate(iranDate(1)), meta: `${stats.tomorrow.count} بازی`, href: `/matches?date=${iranDate(1)}`, icon: CalendarDays },
  ];
  const active = liveOnly ? "live" : day === -1 ? "yesterday" : day === 1 ? "tomorrow" : "today";
  return <section className="rounded-[24px] border border-white/8 bg-[#0a111d] p-2 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
    <div className="flex items-center justify-between px-2 pb-2 pt-1">
      <div><p className="text-[8px] font-black tracking-[.12em] text-cyan-300/70">MATCH CENTER</p><h2 className="mt-1 text-sm font-black text-white">بازه مسابقات</h2></div>
      <span className="rounded-full border border-white/8 bg-white/[.03] px-2.5 py-1 text-[8px] font-bold text-slate-500">{active === "live" ? "لحظه‌ای" : "تهران"}</span>
    </div>
    <div className="grid grid-cols-4 gap-1.5">
      {items.map(({ key, label, date, meta, href, icon: Icon }) => {
        const isActive = active === key, isLive = key === "live";
        return <Link key={key} href={href} className={`relative overflow-hidden rounded-[18px] border px-2 py-3 text-center transition active:scale-[.97] ${isActive ? isLive ? "border-red-400/30 bg-red-500/[.13] text-white" : "border-cyan-300/25 bg-cyan-300/[.08] text-white" : "border-white/6 bg-white/[.02] text-slate-500"}`}>
          <div className={`mx-auto mb-2 grid h-7 w-7 place-items-center rounded-xl ${isActive ? isLive ? "bg-red-400/12 text-red-300" : "bg-cyan-300/10 text-cyan-300" : "bg-white/[.035] text-slate-600"}`}><Icon size={14}/></div>
          <b className="block text-[10px]">{label}</b>
          <span className="mt-1 block truncate text-[7px] text-slate-600">{date}</span>
          <strong className={`mt-1.5 block text-[9px] ${isActive ? isLive ? "text-red-200" : "text-cyan-200" : "text-slate-400"}`}>{meta}</strong>
          {isActive && <span className={`absolute inset-x-7 bottom-0 h-[2px] rounded-full ${isLive ? "bg-red-400" : "bg-cyan-300"}`}/>}
        </Link>;
      })}
    </div>
  </section>;
}

function MatchCard({ game, date }) {
  return <Link href={game.detailAvailable === false ? `/matches?date=${date}` : `/matches/${game.id}`} className={`group relative block overflow-hidden rounded-[24px] border bg-[#0b1422] p-4 transition active:scale-[.995] ${game.live ? "border-red-400/20 shadow-[0_12px_36px_rgba(239,68,68,.07)]" : "border-white/7"}`}>
    {game.live && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-l from-transparent via-red-400 to-transparent"/>}
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0"><div className="truncate text-[8px] font-bold text-slate-600">{game.country ? `${game.country} · ` : ""}{game.league}</div></div>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${game.live ? "bg-red-500/10 text-red-300" : game.finished ? "bg-white/[.04] text-slate-500" : "bg-cyan-400/[.06] text-cyan-300/80"}`}>{game.live ? `● ${game.statusLabel}` : game.statusLabel}</span>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] items-center gap-2">
      <div className="min-w-0 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/7 bg-white/[.035]">{game.homeLogo ? <img src={game.homeLogo} alt="" className="h-9 w-9 object-contain" loading="lazy" /> : <Shield size={18} className="text-slate-600"/>}</div>
        <div className="mx-auto mt-2 max-w-[125px] truncate text-[11px] font-black text-slate-100">{game.home}</div>
        <div className="mt-1 text-[7px] font-bold text-slate-600">میزبان</div>
      </div>
      <div className="text-center">
        <div className={`font-black tabular-nums ${game.live ? "text-[24px] text-white" : "text-[20px] text-slate-300"}`}>{game.homeScore != null ? `${game.homeScore} - ${game.awayScore}` : "—"}</div>
        {game.live ? <div className="mt-1 text-[8px] font-black text-red-300">{game.elapsed != null ? `${game.elapsed}'` : "LIVE"}</div> : <div className="mt-1 text-[8px] text-slate-600">{game.finished ? "سوت پایان" : "زمان شروع"}</div>}
      </div>
      <div className="min-w-0 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/7 bg-white/[.035]">{game.awayLogo ? <img src={game.awayLogo} alt="" className="h-9 w-9 object-contain" loading="lazy" /> : <Shield size={18} className="text-slate-600"/>}</div>
        <div className="mx-auto mt-2 max-w-[125px] truncate text-[11px] font-black text-slate-100">{game.away}</div>
        <div className="mt-1 text-[7px] font-bold text-slate-600">مهمان</div>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-[8px] font-bold text-slate-600">
      <span>{game.live ? "جزئیات زنده مسابقه" : game.finished ? "آمار و نتیجه نهایی" : `شروع ${toTime(game.date)}`}</span>
      <span className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-300">مشاهده <ChevronLeft size={12}/></span>
    </div>
  </Link>;
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const liveOnly = searchParams.get("live") === "1";
  const requestedDate = searchParams.get("date");
  const [games, setGames] = useState([]); const [day, setDay] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [refreshing, setRefreshing] = useState(false); const [settings, setSettings] = useState({ autoRefresh: true, compactScores: true }); const [updatedAt, setUpdatedAt] = useState(null); const [source, setSource] = useState(""); const [summary, setSummary] = useState(null);
  const requestInFlight = useRef(false);
  const date = useMemo(() => requestedDate || iranDate(day), [requestedDate, day]);
  const status = sourceStatus(source, liveOnly);

  useEffect(() => { const sync = () => setSettings(readSettings()); sync(); window.addEventListener("storage", sync); window.addEventListener("fot10-settings-changed", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("fot10-settings-changed", sync); }; }, []);
  useEffect(() => { if (!requestedDate) { setDay(0); return; } const today = iranDate(0), yesterday = iranDate(-1), tomorrow = iranDate(1); setDay(requestedDate === yesterday ? -1 : requestedDate === tomorrow ? 1 : requestedDate === today ? 0 : 0); }, [requestedDate]);
  useEffect(() => { let cancelled = false; const loadSummary = async () => { try { const q = `today=${iranDate(0)}&yesterday=${iranDate(-1)}&tomorrow=${iranDate(1)}`; const response = await fetch(`/api/football/fixtures/summary?${q}`, { cache: "no-store" }); const payload = await response.json(); if (!cancelled && response.ok && payload.ok) setSummary((previous) => mergeSummary(previous, payload)); } catch {} }; loadSummary(); const timer = setInterval(loadSummary, liveOnly ? 30000 : 60000); return () => { cancelled = true; clearInterval(timer); }; }, [liveOnly]);

  const loadMatches = useCallback(async ({ manual = false } = {}) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (manual) setRefreshing(true);
    setLoading(true); setError("");
    try {
      const endpoint = liveOnly ? "/api/football/live" : `/api/football/fixtures?date=${date}`;
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), liveOnly ? 18000 : 12000); let response;
      try { response = await fetch(`${endpoint}${liveOnly ? `?t=${Date.now()}` : ""}`, { cache: "no-store", signal: controller.signal }); } finally { clearTimeout(timeout); }
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "دریافت مسابقات ناموفق بود");
      const mapped = (Array.isArray(payload.matches) ? payload.matches : []).map(mapGame).filter((g) => liveOnly ? g.live : true).sort(sortLive);
      setGames((previous) => mapped.length ? mapped : previous);
      setSource(payload.source || payload.provider || ""); setUpdatedAt(payload.checkedAt ? new Date(payload.checkedAt) : new Date());
      if (!mapped.length) setError(liveOnly ? "داده تازه خالی بود؛ آخرین داده معتبر حفظ شد." : "داده تازه‌ای دریافت نشد؛ آخرین داده معتبر حفظ شد.");
    } catch (err) { setError(err?.name === "AbortError" ? "پاسخ سرویس دیر رسید؛ آخرین داده معتبر حفظ شد." : err?.message || "اتصال داده مسابقات برقرار نشد."); }
    finally { requestInFlight.current = false; setLoading(false); setRefreshing(false); }
  }, [date, liveOnly]);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => { if (!settings.autoRefresh || !liveOnly) return; const timer = setInterval(() => loadMatches(), 15000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);
  useEffect(() => { if (!settings.autoRefresh || liveOnly) return; const timer = setInterval(() => loadMatches(), 30000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);

  const liveCount = games.filter((g) => g.live).length;
  const grouped = games.reduce((acc, g) => { const key = g.country ? `${g.country} · ${g.league}` : g.league; (acc[key] ||= []).push(g); return acc; }, {});
  const dayLabel = day === -1 ? "دیروز" : day === 1 ? "فردا" : "امروز";
  const leagueCount = Object.keys(grouped).length;

  return <main className="fot-shell" dir="rtl"><div className="fot-container space-y-4">
    <header className="flex items-center justify-between rounded-[22px] border border-white/7 bg-[#09111d] px-3 py-3 shadow-[0_14px_40px_rgba(0,0,0,.18)]">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[.035] text-slate-300"><ArrowRight size={18}/></Link>
        <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-[18px] font-black text-white">{liveOnly ? "LIVE Center" : "Match Center"}</h1>{liveOnly && <span className="rounded-full bg-red-500/10 px-2 py-1 text-[7px] font-black text-red-300">LIVE</span>}</div><p className="mt-0.5 truncate text-[9px] font-bold text-slate-600">{liveOnly ? "نبض لحظه‌ای فوتبال" : `برنامه و نتایج · ${dayLabel}`}</p></div>
      </div>
      <button onClick={() => loadMatches({ manual: true })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[.035] text-slate-400" aria-label="به‌روزرسانی"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/></button>
    </header>

    <DayFilters liveOnly={liveOnly} day={day} summary={summary}/>

    {liveOnly && <section className="rounded-[24px] border border-red-400/15 bg-gradient-to-br from-red-500/[.07] to-transparent p-4">
      <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Radio size={16} className="text-red-300"/><h2 className="text-sm font-black text-white">نبض زنده فوتبال</h2></div><p className="mt-1 text-[8px] font-bold text-slate-600">بررسی خودکار هر ۱۵ ثانیه · مسیر جایگزین در صورت اختلال</p></div><div className="min-w-[64px] rounded-2xl bg-red-500/10 px-3 py-2 text-center"><b className="block text-xl font-black text-red-200">{liveCount}</b><span className="text-[7px] font-bold text-slate-600">بازی زنده</span></div></div>
      {status && <div className="mt-3 flex items-center justify-between rounded-xl border border-white/6 bg-white/[.025] px-3 py-2"><span className="flex items-center gap-2 text-[8px] font-black text-slate-400"><i className={`h-1.5 w-1.5 rounded-full ${status.tone === "emerald" ? "bg-emerald-400" : status.tone === "amber" ? "bg-amber-400" : "bg-slate-500"}`}/>{status.label}</span><span className="text-[7px] text-slate-600">{updatedAt ? `آخرین بررسی ${updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "در حال دریافت"}</span></div>}
    </section>}

    <div className="grid grid-cols-3 gap-2">
      <div className={`rounded-[18px] p-3 text-center ${liveOnly ? "border border-red-400/20 bg-red-500/[.10]" : "border border-emerald-400/15 bg-emerald-400/[.07]"}`}><Radio size={15} className={`mx-auto mb-1 ${liveOnly ? "text-red-300" : "text-emerald-300"}`}/><b className="text-[11px] text-white">زنده</b><div className="mt-0.5 text-[8px] text-slate-500">{liveCount} بازی</div></div>
      <div className="rounded-[18px] border border-white/7 bg-white/[.025] p-3 text-center"><Clock3 size={15} className="mx-auto mb-1 text-slate-500"/><b className="text-[11px] text-white">{dayLabel}</b><div className="mt-0.5 text-[8px] text-slate-500">{games.length} بازی</div></div>
      <div className="rounded-[18px] border border-white/7 bg-white/[.025] p-3 text-center"><Trophy size={15} className="mx-auto mb-1 text-slate-500"/><b className="text-[11px] text-white">لیگ‌ها</b><div className="mt-0.5 text-[8px] text-slate-500">{leagueCount}</div></div>
    </div>

    {error && <div className="rounded-xl border border-amber-400/10 bg-amber-400/[.035] px-3 py-2 text-[8px] font-bold text-amber-200/75">{error}</div>}

    {!liveOnly && <HomeLiveMatches />}

    {loading && !games.length ? <section className="rounded-[24px] border border-white/7 bg-[#0b1422] p-8 text-center text-[10px] font-bold text-slate-500">در حال دریافت مسابقات…</section> :
      Object.keys(grouped).length ? <section className="space-y-5">
        {Object.entries(grouped).map(([league, list]) => <div key={league}>
          <div className="mb-2 flex items-end justify-between px-1"><div><div className="text-[12px] font-black text-white">{league.split(" · ").pop()}</div>{league.includes(" · ") && <div className="mt-0.5 text-[7px] font-bold text-slate-600">{league.split(" · ")[0]}</div>}</div><span className="rounded-full bg-white/[.03] px-2 py-1 text-[7px] font-bold text-slate-600">{list.length} بازی</span></div>
          <div className="space-y-2.5">{list.map((game) => <MatchCard key={game.id} game={game} date={date}/>)}</div>
        </div>)}
      </section> :
      <section className="rounded-[24px] border border-white/7 bg-[#0b1422] p-9 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[.035]"><CalendarDays size={22} className="text-slate-600"/></div><b className="mt-3 block text-sm text-slate-300">{liveOnly ? "فعلاً بازی زنده‌ای پیدا نشد" : `برای ${dayLabel} مسابقه‌ای پیدا نشد`}</b><p className="mt-1 text-[9px] font-bold text-slate-600">بررسی خودکار ادامه دارد.</p></section>}
  </div></main>;
}

export default function MatchesPage() { return <Suspense fallback={<main className="fot-shell"><div className="fot-container p-8 text-center text-sm text-slate-500">در حال آماده‌سازی مرکز بازی‌ها…</div></main>}><MatchesContent /></Suspense>; }
