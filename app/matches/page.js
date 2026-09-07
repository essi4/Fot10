"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, CalendarDays, ChevronLeft, Clock3, Radio, RefreshCw, Star, Trophy } from "lucide-react";

const demoGames = [
  { id: "demo-1", league: "لیگ قهرمانان اروپا", home: "بارسلونا", away: "پاری‌سن‌ژرمن", homeScore: 2, awayScore: 1, minute: "74'", status: "LIVE", live: true },
  { id: "demo-2", league: "پریمیر لیگ", home: "آرسنال", away: "لیورپول", homeScore: 1, awayScore: 1, minute: "نیمه دوم", status: "LIVE", live: true },
  { id: "demo-3", league: "لالیگا", home: "رئال مادرید", away: "اتلتیکو مادرید", homeScore: null, awayScore: null, minute: "21:00", status: "امشب", live: false },
];

function toTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" });
}

function mapGame(match) {
  const liveStatuses = ["1H", "2H", "ET", "P", "LIVE"];
  const live = liveStatuses.includes(match.status);
  const finished = ["FT", "AET", "PEN"].includes(match.status);
  return {
    id: match.id,
    league: match.league || "مسابقات فوتبال",
    home: match.home || "تیم میزبان",
    away: match.away || "تیم مهمان",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: live && match.minute ? `${match.minute}'` : finished ? "پایان" : toTime(match.time),
    status: live ? "LIVE" : finished ? "FT" : "امروز",
    live,
    events: [],
  };
}

export default function MatchesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function loadMatches({ manual = false } = {}) {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch(`/api/football/fixtures?date=${today}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "دریافت مسابقات ناموفق بود");
      setGames(payload.matches.map(mapGame));
      setDemo(false);
    } catch (err) {
      setGames(demoGames);
      setDemo(true);
      setError("داده زنده فعلاً در دسترس نیست؛ نمایش دمو فعال شد.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadMatches(); }, [today]);

  const liveCount = games.filter((g) => g.live).length;

  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><button className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></button><div><h1 className="text-xl font-black">مرکز بازی‌ها</h1><p className="text-[11px] text-slate-500">نتایج و مسابقات امروز</p></div></div><button onClick={() => loadMatches({ manual: true })} className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={18} className={refreshing ? "animate-spin" : ""}/></button></header>
    <div className="glass rounded-2xl p-2 flex items-center gap-2"><CalendarDays size={18} className="mr-2 text-emerald-400"/><div className="flex-1"><div className="text-xs text-slate-400">امروز</div><div className="font-bold text-sm">{new Date().toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}</div></div><ChevronLeft size={18} className="text-slate-500"/></div>
    <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-emerald-400 text-slate-950 p-3 text-center"><Radio size={16} className="mx-auto mb-1"/><b className="text-sm">زنده</b><div className="text-[10px]">{liveCount} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Clock3 size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">امروز</b><div className="text-[10px] text-slate-500">{games.length} بازی</div></div><div className="glass rounded-2xl p-3 text-center"><Trophy size={16} className="mx-auto mb-1 text-slate-400"/><b className="text-sm">همه</b><div className="text-[10px] text-slate-500">{games.length} بازی</div></div></div>
    {demo && <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 px-4 py-3 text-[11px] text-amber-200">{error}</div>}
    {loading ? <section className="glass card p-8 text-center text-sm text-slate-400">در حال دریافت مسابقات واقعی…</section> : <section className="space-y-3">{games.map(g=><article key={g.id} className="glass card p-4 overflow-hidden"><div className="flex justify-between items-center mb-4"><span className="text-[11px] text-slate-400">{g.league}</span>{g.live?<span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/> LIVE</span>:<span className="text-[10px] text-slate-500">{g.minute}</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-blue-500/15 text-blue-300 grid place-items-center font-black">{g.home[0]}</div><div className="mt-2 font-bold text-sm">{g.home}</div></div><div className="text-center"><div className={`text-xl font-black ${g.live?'text-white':'text-slate-300'}`}>{g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : "—"}</div>{g.live&&<div className="text-[10px] text-emerald-400 mt-1">{g.minute}</div>}</div><div className="text-center"><div className="mx-auto h-11 w-11 rounded-2xl bg-red-500/15 text-red-300 grid place-items-center font-black">{g.away[0]}</div><div className="mt-2 font-bold text-sm">{g.away}</div></div></div><div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500"><span>{g.live ? "مرکز زنده مسابقه" : "مشاهده مرکز مسابقه"}</span><Star size={14}/></div></article>)}</section>}
  </div></main>;
}
