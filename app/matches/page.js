"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Radio, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import HomeLiveMatches from "../components/HomeLiveMatches";
import { PROJECT_TIMEZONE, formatProjectDate, projectDate } from "../../lib/project-date.mjs";

const SETTINGS_KEY = "fot10-settings";
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const LIVE_LABELS = { "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "استراحت", LIVE: "در جریان", "IN PLAY": "در جریان" };

function readSettings() { try { return { autoRefresh: true, compactScores: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return { autoRefresh: true, compactScores: true }; } }
function toTime(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: PROJECT_TIMEZONE }); }
function mapGame(match) { const statusCode = String(match.statusShort || match.status || "").toUpperCase(); const live = LIVE_CODES.has(statusCode) || /LIVE|IN PLAY|HALF/i.test(statusCode); const finished = FINISHED_CODES.has(statusCode); return { ...match, league: match.league || "مسابقات فوتبال", country: match.country || "", home: match.home || "میزبان", away: match.away || "مهمان", statusCode, statusLabel: live ? (LIVE_LABELS[statusCode] || "در جریان") : finished ? "پایان" : toTime(match.date), minute: live && match.elapsed != null ? `${match.elapsed}'` : finished ? "پایان" : toTime(match.date), live, finished }; }
function sortLive(a, b) { return Number(b.live) - Number(a.live) || String(a.league).localeCompare(String(b.league)); }
function mergeSummary(previous, next) {
  if (!next?.ok) return previous;
  if (!previous) return next;
  const keys = ["live", "yesterday", "today", "tomorrow"];
  const merged = { ...next };
  for (const key of keys) {
    const incoming = next[key];
    const prior = previous[key];
    if (incoming && prior && Number(incoming.count || 0) === 0 && Number(prior.count || 0) > 0) merged[key] = prior;
  }
  return merged;
}

function DayFilters({ liveOnly, day, summary }) {
  const fallback = { count: 0, leagues: 0, finished: 0, goals: 0 };
  const stats = { live: summary?.live || fallback, yesterday: summary?.yesterday || fallback, today: summary?.today || fallback, tomorrow: summary?.tomorrow || fallback };
  const items = [
    { key: "yesterday", label: "دیروز", date: formatProjectDate(projectDate(-1)), meta: `${stats.yesterday.count} بازی`, extra: `${stats.yesterday.finished || 0} پایان · ${stats.yesterday.goals || 0} گل`, href: `/matches?date=${projectDate(-1)}`, icon: CalendarDays },
    { key: "today", label: "امروز", date: formatProjectDate(projectDate(0)), meta: `${stats.today.count} بازی`, extra: `${stats.today.leagues || 0} لیگ · ${stats.today.goals || 0} گل`, href: `/matches?date=${projectDate(0)}`, icon: CalendarDays },
    { key: "tomorrow", label: "فردا", date: formatProjectDate(projectDate(1)), meta: `${stats.tomorrow.count} بازی`, extra: `${stats.tomorrow.leagues || 0} لیگ · برنامه`, href: `/matches?date=${projectDate(1)}`, icon: CalendarDays },
  ];
  const active = day === -1 ? "yesterday" : day === 1 ? "tomorrow" : "today";
  return <section className="rounded-[26px] border border-white/10 bg-white/[.025] p-2 shadow-[0_18px_55px_rgba(0,0,0,.18)]"><div className="mb-2 flex items-center justify-between px-2"><div><p className="text-[9px] font-bold text-slate-600">MATCH CENTER</p><h2 className="text-xs font-black text-slate-300">روز مسابقات</h2></div><span className="rounded-full border border-white/10 px-2 py-1 text-[8px] text-slate-500">{formatProjectDate(active === "yesterday" ? projectDate(-1) : active === "tomorrow" ? projectDate(1) : projectDate(0))}</span></div><div className="grid grid-cols-3 gap-1.5">{items.map(({ key, label, date, meta, extra, href, icon: Icon }) => { const isActive = active === key; const isLive = key === "live"; return <Link key={key} href={href} className={`group relative overflow-hidden rounded-[20px] border p-2.5 text-center transition duration-200 active:scale-[.97] ${isActive ? isLive ? "border-red-400/35 bg-gradient-to-b from-red-500/90 to-red-600/75 text-white shadow-[0_10px_30px_rgba(239,68,68,.2)]" : "border-emerald-300/30 bg-gradient-to-b from-emerald-300 to-emerald-400 text-slate-950 shadow-[0_10px_30px_rgba(52,211,153,.15)]" : "border-white/7 bg-white/[.025] text-slate-400 hover:bg-white/[.05]"}`}>{isActive && <span className={`absolute inset-x-4 top-0 h-px ${isLive ? "bg-red-100/70" : "bg-white/70"}`} />}<span className={`mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-xl ${isActive ? isLive ? "bg-white/15" : "bg-slate-950/10" : "bg-white/5"}`}>{isLive ? <span className="relative"><Icon size={15}/><i className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-300 shadow-[0_0_0_3px_rgba(248,113,113,.12)] animate-pulse"/></span> : <Icon size={15}/>}</span><b className="block text-[10px]">{label}</b><span className={`mt-0.5 block text-[8px] ${isActive ? isLive ? "text-red-100" : "text-slate-800/70" : "text-slate-500"}`}>{date}</span><strong className={`mt-1 block text-[9px] ${isActive ? isLive ? "text-white" : "text-slate-950" : "text-slate-300"}`}>{meta}</strong><span className={`block text-[7px] ${isActive ? isLive ? "text-red-100/80" : "text-slate-800/60" : "text-slate-600"}`}>{extra}</span></Link>; })}</div></section>;
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const liveOnly = searchParams.get("live") === "1";
  const requestedDate = searchParams.get("date");
  const [games, setGames] = useState([]); const [day, setDay] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [refreshing, setRefreshing] = useState(false); const [settings, setSettings] = useState({ autoRefresh: true }); const [summary, setSummary] = useState(null);
  const requestInFlight = useRef(false);
  const lastGoodDataRef = useRef({ key: null, time: 0 });
  const date = useMemo(() => requestedDate || projectDate(day), [requestedDate, day]);

  useEffect(() => { const sync = () => setSettings(readSettings()); sync(); window.addEventListener("storage", sync); window.addEventListener("fot10-settings-changed", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("fot10-settings-changed", sync); }; }, []);
  useEffect(() => { setGames([]); setError(""); lastGoodDataRef.current = { key: null, time: 0 }; }, [date, liveOnly]);
  useEffect(() => { if (!requestedDate) { setDay(0); return; } const today = projectDate(0); const yesterday = projectDate(-1); const tomorrow = projectDate(1); setDay(requestedDate === yesterday ? -1 : requestedDate === tomorrow ? 1 : requestedDate === today ? 0 : 0); }, [requestedDate]);
  useEffect(() => { let cancelled = false; const loadSummary = async () => { try { const q = `today=${projectDate(0)}&yesterday=${projectDate(-1)}&tomorrow=${projectDate(1)}`; const response = await fetch(`/api/football/fixtures/summary?${q}`, { cache: "no-store" }); const payload = await response.json(); if (!cancelled && response.ok && payload.ok) setSummary((previous) => mergeSummary(previous, payload)); } catch {} }; loadSummary(); const timer = setInterval(loadSummary, liveOnly ? 30000 : 60000); return () => { cancelled = true; clearInterval(timer); }; }, [liveOnly]);

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
      const hasUsableData = mapped.length > 0;
      const currentKey = `${liveOnly ? "live" : "day"}:${date}`;
      if (hasUsableData) {
        lastGoodDataRef.current = { key: currentKey, time: Date.now() };
        setGames(mapped);
      } else if (lastGoodDataRef.current.key !== currentKey) {
        setGames([]);
      }
      if (!mapped.length) setError(liveOnly ? "فعلاً بازی زنده‌ای پیدا نشد؛ بررسی خودکار ادامه دارد." : "داده‌های این روز فعلاً در دسترس نیست؛ بررسی خودکار ادامه دارد.");
    } catch (err) { setError("داده‌ها کمی قدیمی هستند؛ در حال تلاش برای به‌روزرسانی اطلاعات…"); }
    finally { requestInFlight.current = false; setLoading(false); setRefreshing(false); }
  }, [date, liveOnly]);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => { if (!settings.autoRefresh || !liveOnly) return; const timer = setInterval(() => loadMatches(), 15000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);
  useEffect(() => { if (!settings.autoRefresh || liveOnly) return; const timer = setInterval(() => loadMatches(), 30000); return () => clearInterval(timer); }, [loadMatches, settings.autoRefresh, liveOnly]);

  const liveCount = games.filter((g) => g.live).length; const grouped = games.reduce((acc, g) => { const key = g.country ? `${g.country} · ${g.league}` : g.league; (acc[key] ||= []).push(g); return acc; }, {}); const dayLabel = day === -1 ? "دیروز" : day === 1 ? "فردا" : "امروز";

  return <main className="fot-shell">
    <div className="fot-container space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="glass grid h-10 w-10 shrink-0 place-items-center rounded-xl" aria-label="بازگشت">
            <ArrowRight size={19} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">{liveOnly ? "نتایج زنده" : "نتایج فوتبال"}</h1>
              {liveOnly && <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-black text-red-300"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />LIVE</span>}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">{liveOnly ? "بازی‌های در حال برگزاری" : "نتایج و برنامه مسابقات"}</p>
          </div>
        </div>
        <button onClick={() => loadMatches({ manual: true })} className="glass grid h-10 w-10 shrink-0 place-items-center rounded-xl" aria-label="به‌روزرسانی">
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </header>

      {!liveOnly && <DayFilters liveOnly={false} day={day} summary={summary} />}

      {liveOnly && (
        <Link href={`/matches?date=${projectDate(0)}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3 text-xs">
          <span className="font-bold text-slate-300">← بازگشت به مسابقات امروز</span>
          <span className="text-[10px] text-slate-600">{formatProjectDate(projectDate(0))}</span>
        </Link>
      )}

      {!liveOnly && liveCount > 0 && (
        <Link href="/matches?live=1" className="flex items-center justify-between rounded-2xl border border-red-400/20 bg-red-500/[.06] px-4 py-3 transition hover:bg-red-500/[.1]">
          <div className="flex items-center gap-2">
            <span className="relative grid h-7 w-7 place-items-center rounded-full bg-red-500/15">
              <Radio size={14} className="text-red-300" />
              <i className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            </span>
            <div>
              <b className="block text-xs text-red-100">LIVE</b>
              <span className="text-[9px] text-slate-500">{liveCount} بازی زنده</span>
            </div>
          </div>
          <span className="text-xs font-bold text-red-300">مشاهده ←</span>
        </Link>
      )}

      {error && !games.length && (
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[.05] px-4 py-3 text-[11px] text-amber-200">
          {liveOnly ? "فعلاً بازی زنده‌ای پیدا نشد؛ بررسی خودکار ادامه دارد." : "اطلاعات مسابقات فعلاً در دسترس نیست. لطفاً چند لحظه دیگر دوباره تلاش کنید."}
        </div>
      )}

      {loading && !games.length ? (
        <section className="glass card p-8 text-center text-sm text-slate-400">
          {liveOnly ? "در حال دریافت بازی‌های زنده…" : "در حال دریافت مسابقات…"}
        </section>
      ) : Object.keys(grouped).length ? (
        <section className="space-y-5">
          {Object.entries(grouped).map(([league, list]) => (
            <div key={league}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                <div className="text-xs font-black text-slate-400">{league}</div>
              </div>
              <div className="space-y-3">
                {list.map((g) => (
                  <Link key={g.id} href={g.detailAvailable === false ? `/matches?date=${date}` : `/matches/${g.id}`} className="glass card block overflow-hidden rounded-[24px] p-4 transition active:scale-[.99]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-slate-500">{g.league}</span>
                      {g.live ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-black text-red-300">
                          <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                          LIVE{g.elapsed != null ? ` · ${g.elapsed}'` : ""}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold ${g.finished ? "text-slate-500" : "text-emerald-300"}`}>
                          {g.finished ? "پایان یافته" : g.statusLabel}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white/5">
                          {g.homeLogo ? <img src={g.homeLogo} alt="" className="h-9 w-9 object-contain" /> : <span className="text-lg font-black">{g.home[0]}</span>}
                        </div>
                        <div className="mt-2 truncate text-sm font-bold text-slate-200">{g.home}</div>
                      </div>

                      <div className="min-w-[64px] text-center">
                        <div className={`text-2xl font-black tracking-tight ${g.live ? "text-white" : "text-slate-200"}`}>
                          {g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : "—"}
                        </div>
                        <div className={`mt-1 text-[9px] font-bold ${g.live ? "text-red-300" : "text-slate-600"}`}>
                          {g.live ? g.statusLabel : g.finished ? "پایان" : g.statusLabel}
                        </div>
                      </div>

                      <div className="min-w-0 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white/5">
                          {g.awayLogo ? <img src={g.awayLogo} alt="" className="h-9 w-9 object-contain" /> : <span className="text-lg font-black">{g.away[0]}</span>}
                        </div>
                        <div className="mt-2 truncate text-sm font-bold text-slate-200">{g.away}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[9px]">
                      <span className="text-slate-600">{g.finished ? "نتیجه نهایی" : g.live ? "جزئیات زنده مسابقه" : "زمان و جزئیات مسابقه"}</span>
                      <span className="font-bold text-slate-500">جزئیات ←</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-[26px] border border-white/10 bg-white/[.025] p-8 text-center shadow-xl">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
            {liveOnly ? <Radio size={24} className="text-slate-500" /> : <CalendarDays size={24} className="text-slate-500" />}
          </div>
          <b className="block text-sm text-slate-300">
            {liveOnly ? "هیچ مسابقهٔ زنده‌ای نیست" : "اطلاعات مسابقات فعلاً در دسترس نیست"}
          </b>
          <p className="mt-1 text-[10px] text-slate-600">
            {liveOnly ? "بررسی خودکار ادامه دارد و به‌محض دریافت بازی، این بخش به‌روزرسانی می‌شود." : "لطفاً چند لحظه دیگر دوباره تلاش کنید."}
          </p>
          {!liveOnly && (
            <div className="mt-4 flex justify-center gap-2">
              <Link href={`/matches?date=${projectDate(-1)}`} className="rounded-xl bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400">دیروز</Link>
              <Link href={`/matches?date=${projectDate(1)}`} className="rounded-xl bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400">فردا</Link>
            </div>
          )}
        </section>
      )}
    </div>
  </main>
}

export default function MatchesPage() { return <Suspense fallback={<main className="fot-shell"><div className="fot-container p-8 text-center text-sm text-slate-500">در حال آماده‌سازی مرکز بازی‌ها…</div></main>}><MatchesContent /></Suspense>; }