"use client";

import { CalendarDays, ChevronLeft, Radio, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TOP_LEAGUES = [
  { key: "Iran", label: "ایران", names: ["Persian Gulf Pro League", "Iranian Pro League", "خلیج فارس"] },
  { key: "England", label: "انگلیس", names: ["Premier League"] },
  { key: "Spain", label: "اسپانیا", names: ["La Liga", "Laliga"] },
  { key: "Italy", label: "ایتالیا", names: ["Serie A"] },
  { key: "Germany", label: "آلمان", names: ["Bundesliga"] },
];

const TEAM_FA = {
  "Manchester City": "منچسترسیتی", "Manchester United": "منچستریونایتد", Liverpool: "لیورپول", Arsenal: "آرسنال", Chelsea: "چلسی", Tottenham: "تاتنهام",
  "Real Madrid": "رئال مادرید", Barcelona: "بارسلونا", "Atletico Madrid": "اتلتیکومادرید", "Bayern Munich": "بایرن مونیخ", "Borussia Dortmund": "بوروسیا دورتموند", Juventus: "یوونتوس", Inter: "اینتر", "AC Milan": "آث میلان", "Paris Saint Germain": "پاری‌سن‌ژرمن", PSG: "پاری‌سن‌ژرمن",
  Tractor: "تراکتور", Persepolis: "پرسپولیس", Esteghlal: "استقلال", Sepahan: "سپاهان", Foolad: "فولاد", "Gol Gohar": "گل‌گهر", Malavan: "ملوان", "Zob Ahan": "ذوب‌آهن", "Aluminium Arak": "آلومینیوم اراک", Paykan: "پیکان", "Fajr Sepasi": "فجر سپاسی", "Nassaji Mazandaran": "نساجی مازندران", "Kheybar Khorramabad": "خیبر خرم‌آباد", "Shams Azar Qazvin": "شمس‌آذر قزوین", Chadormalu: "چادرملو",
};

const faTeam = (name) => TEAM_FA[name] || name;
const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const isLive = (m) => ["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"].includes(String(m?.statusShort || m?.status || "").toUpperCase());
const isFinished = (m) => ["FT", "AET", "PEN"].includes(String(m?.statusShort || m?.status || "").toUpperCase());
const toTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" });
};
const iranToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const leagueKey = (match) => TOP_LEAGUES.find((l) => l.names.some((n) => normalize(n) === normalize(match?.league)) && (l.key === "Iran" ? normalize(match?.country).includes("iran") : true))?.key || null;

function MatchRow({ match }) {
  const live = isLive(match);
  const finished = isFinished(match);
  const homeScore = match.homeScore != null ? match.homeScore : "—";
  const awayScore = match.awayScore != null ? match.awayScore : "—";
  return <Link href={match.id ? `/matches/${match.id}` : "/matches"} className={`group grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border px-3 py-3 transition active:scale-[.99] ${live ? "border-red-400/20 bg-red-500/[.055]" : "border-white/7 bg-white/[.025] hover:border-emerald-300/15"}`}>
    <div className="min-w-0 text-right"><div className="truncate text-[10px] font-black text-slate-100">{faTeam(match.home)}</div></div>
    <div className="min-w-[58px] text-center"><div className={`text-sm font-black tabular-nums ${live ? "text-white" : "text-slate-200"}`}>{homeScore} <span className="mx-0.5 text-slate-600">-</span> {awayScore}</div><div className={`mt-1 text-[7px] font-black ${live ? "text-red-300" : finished ? "text-slate-500" : "text-slate-600"}`}>{live ? `LIVE${match.elapsed ? ` · ${match.elapsed}'` : ""}` : finished ? "پایان" : toTime(match.time)}</div></div>
    <div className="min-w-0 text-left"><div className="truncate text-[10px] font-black text-slate-100">{faTeam(match.away)}</div></div>
  </Link>;
}

export default function HomeLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState("all");
  const today = useMemo(() => iranToday(), []);

  const load = async () => {
    try {
      const res = await fetch(`/api/football/fixtures?date=${today}`, { cache: "no-store" });
      const json = await res.json();
      const list = Array.isArray(json.matches) ? json.matches.map((m) => ({ ...m, topKey: leagueKey(m) })).filter((m) => m.topKey) : [];
      setMatches(list);
    } catch { setMatches([]); } finally { setLoaded(true); }
  };

  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [today]);

  const visible = selected === "all" ? matches : matches.filter((m) => m.topKey === selected);
  const liveCount = matches.filter(isLive).length;

  if (!loaded && !matches.length) return <section className="mt-5 rounded-3xl border border-white/8 bg-white/[.025] p-4"><div className="h-20 animate-pulse rounded-2xl bg-white/[.035]"/></section>;

  return <section className="mt-5 rounded-3xl border border-white/8 bg-gradient-to-br from-white/[.04] to-transparent p-3.5 shadow-xl">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><div className="flex items-center gap-2"><CalendarDays size={15} className="text-emerald-300"/><h2 className="text-sm font-black">نتایج امروز</h2>{liveCount > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[7px] font-black text-red-300">{liveCount} زنده</span>}</div><p className="mt-1 text-[9px] font-bold text-slate-600">فقط ۵ لیگ مهم · به‌روزرسانی خودکار</p></div>
      <Link href="/matches" className="shrink-0 rounded-xl border border-white/8 bg-white/[.03] px-2.5 py-2 text-[8px] font-black text-slate-400">همه بازی‌ها <ChevronLeft size={11} className="inline"/></Link>
    </div>

    <div className="mb-3 grid grid-cols-5 gap-1.5">{TOP_LEAGUES.map((league) => <button key={league.key} onClick={() => setSelected(league.key === selected ? "all" : league.key)} className={`rounded-xl border px-1 py-2 text-[8px] font-black transition ${selected === league.key ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-300" : "border-white/7 bg-white/[.025] text-slate-500 hover:text-slate-300"}`}><Trophy size={11} className="mx-auto mb-1"/>{league.label}</button>)}</div>

    {visible.length ? <div className="space-y-2">{visible.map((m) => <MatchRow key={m.id} match={m}/>)}</div> : <div className="rounded-2xl border border-white/7 bg-white/[.02] px-4 py-6 text-center"><Radio size={19} className="mx-auto text-slate-600"/><p className="mt-2 text-[10px] font-black text-slate-400">امروز بازی‌ای از این ۵ لیگ نداریم</p></div>}

    <Link href="/leagues" className="mt-2.5 flex items-center justify-center gap-2 rounded-2xl border border-white/7 bg-white/[.02] py-2.5 text-[9px] font-black text-slate-500 transition hover:text-emerald-300"><Trophy size={13}/> لیگ‌های دیگر</Link>
  </section>;
}
