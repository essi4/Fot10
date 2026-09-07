"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Radio, RefreshCw, Star, Trophy } from "lucide-react";

function iranDate(offset = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function toTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" });
}

function mapGame(match) {
  const live = ["1H", "2H", "ET", "P", "BT", "LIVE"].includes(match.status);
  const finished = ["FT", "AET", "PEN"].includes(match.status);
  return {
    ...match,
    league: match.league || "مسابقات فوتبال",
    home: match.home || "میزبان",
    away: match.away || "مهمان",
    minute: live && match.minute ? `${match.minute}'` : finished ? "پایان" : toTime(match.time),
    live,
    finished,
  };
}

export default function MatchesPage() {
  const [games, setGames] = useState([]);
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const date = useMemo(() => iranDate(day), [day]);

  const loadMatches = useCallback(async ({ manual = false } = {}) => {
    if (manual) setRefreshing(true);
    setLoading(true);
    setError("");
    try {
      const endpoint = day === 0 ? `/api/football/fixtures?live=true` : `/api/football/fixtures?date=${date}`;
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "دریافت مسابقات ناموفق بود");
      setGames(payload.matches.map(mapGame));
    } catch (err) {
      setGames([]);
      setError(err?.message || "اتصال داده زنده برقرار نشد.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, day]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (day !== 0) return;
    const timer = setInterval(() => loadMatches(), 30000);
    return () => clearInterval(timer);
  }, [day, loadMatches]);

  const liveCount = games.filter((g) => g.live).length;
  const grouped = games.reduce((acc, g) => {
    const key = g.country ? `${g.country} · ${g.league}` : g.league;
    (acc[key] ||= []).push(g);
    return acc;
  }, {});
  const dayLabel = day === -1 ? "دیروز" : day === 1 ? "فردا" : "امروز";

  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">مرکز بازی‌ها</h1><p className="text-[11px] text-slate-500">نتایج واقعی و زنده فوتبال</p></div></div><button onClick={() => loadMatches({ manual: true })} className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""}/></button></header>
    <div className="grid grid-cols-3 gap-2">{[-1,0,1].map((n) => <button key={n} onClick={() => setDay(n)} className={`rounded-2xl p-3 text-center ${day === n ? "bg-emerald-400 text-slate-950" : "glass"}`}><CalendarDays size={16} className="mx-auto mb-1"/><b className="text-xs">{n === -1 ? "دیروز" : n === 1 ? "فردا" : "امروز"}</b><div className="text-[9px] opacity-70">{new Date(iranDate(n)).toLocaleDateString("fa-IR", { day: "numeric", month: "long", timeZone: "Asia/Tehran" })}</div></button>)}</div>
    <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-emerald-400 text-slate-950 p-3 text-center"><Radio size={16} className="mx-auto mb-1"/><b className="text-sm">زنده</b><div className="text-[10px]">{liveCount} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Clock3 size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">{dayLabel}</b><div className="text-[10px] text-slate-500">{games.length} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Trophy size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">لیگ‌ها</b><div className="text-[10px] text-slate-500">{Object.keys(grouped).length}</div></div></div>
    {error && <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-4 py-3 text-[11px] text-amber-200">اتصال داده زنده برقرار نشد: {error}</div>}
    {loading ? <section className="glass card p-8 text-center text-sm text-slate-400">در حال دریافت مسابقات واقعی…</section> : Object.keys(grouped).length ? <section className="space-y-4">{Object.entries(grouped).map(([league, list]) => <div key={league}><div className="px-1 mb-2 text-xs font-black text-slate-400">{league}</div><div className="space-y-3">{list.map(g => <Link key={g.id} href={`/matches/${g.id}`} className="glass card block p-4 overflow-hidden active:scale-[.99] transition"><div className="flex justify-between items-center mb-4"><span className="text-[11px] text-slate-400">{g.league}</span>{g.live?<span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> LIVE · {g.minute}</span>:<span className="text-[10px] text-slate-500">{g.minute}</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-white/5 grid place-items-center overflow-hidden">{g.homeLogo ? <img src={g.homeLogo} alt="" className="h-8 w-8 object-contain"/> : <span className="font-black">{g.home[0]}</span>}</div><div className="mt-2 font-bold text-sm">{g.home}</div></div><div className="text-center"><div className={`text-xl font-black ${g.live ? "text-white" : "text-slate-300"}`}>{g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : "—"}</div>{g.live && <div className="text-[10px] text-emerald-400 mt-1">در حال بازی</div>}</div><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-white/5 grid place-items-center overflow-hidden">{g.awayLogo ? <img src={g.awayLogo} alt="" className="h-8 w-8 object-contain"/> : <span className="font-black">{g.away[0]}</span>}</div><div className="mt-2 font-bold text-sm">{g.away}</div></div></div><div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500"><span>{g.live ? "گزارش زنده و آمار مسابقه" : "مرکز مسابقه"}</span><Star size={14}/></div></Link>)}</div></div>)}</section> : <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">برای این روز مسابقه‌ای پیدا نشد.</div>}
  </div></main>;
}
