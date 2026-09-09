"use client";

import { ChevronLeft, Radio, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { filterMajorLeagues } from "../../lib/major-league-filter";

const TEAM_FA = {
  "Manchester City": "منچسترسیتی", "Manchester United": "منچستریونایتد", "Liverpool": "لیورپول", "Arsenal": "آرسنال", "Chelsea": "چلسی", "Tottenham": "تاتنهام",
  "Real Madrid": "رئال مادرید", "Barcelona": "بارسلونا", "Atletico Madrid": "اتلتیکومادرید", "Bayern Munich": "بایرن مونیخ", "Borussia Dortmund": "بوروسیا دورتموند", "Juventus": "یوونتوس", "Inter": "اینتر", "AC Milan": "آث میلان", "Paris Saint Germain": "پاری‌سن‌ژرمن", "PSG": "پاری‌سن‌ژرمن",
  "Tractor": "تراکتور", "Persepolis": "پرسپولیس", "Esteghlal": "استقلال", "Sepahan": "سپاهان", "Foolad": "فولاد", "Gol Gohar": "گل‌گهر", "Malavan": "ملوان", "Zob Ahan": "ذوب‌آهن", "Aluminium Arak": "آلومینیوم اراک", "Paykan": "پیکان", "Fajr Sepasi": "فجر سپاسی", "Nassaji Mazandaran": "نساجی مازندران", "Kheybar Khorramabad": "خیبر خرم‌آباد", "Shams Azar Qazvin": "شمس‌آذر قزوین", "Chadormalu SC": "چادرملو", "Mes Shahr-e Babak": "مس شهر بابک", "Sanat Naft": "صنعت نفت", "Esteghlal Khuzestan": "استقلال خوزستان",
};

const faTeam = (name) => TEAM_FA[name] || name;
const isLiveStatus = (match) => ["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"].includes(String(match?.statusShort || match?.status || "").toUpperCase());

function MatchCard({ match }) {
  const homeScore = Number.isFinite(Number(match.homeScore)) ? match.homeScore : "—";
  const awayScore = Number.isFinite(Number(match.awayScore)) ? match.awayScore : "—";
  const status = String(match.statusShort || match.status || "LIVE").toUpperCase();
  const minute = status === "2H" && match.elapsed ? `${match.elapsed}'` : status === "HT" ? "نیمه‌وقت" : "زنده";
  return <Link href={match.id ? `/matches/${match.id}` : "/matches"} className="group relative block overflow-hidden rounded-3xl border border-red-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,.16),transparent_55%),linear-gradient(145deg,rgba(127,29,29,.22),rgba(15,23,42,.7))] p-4 shadow-[0_12px_35px_rgba(0,0,0,.22)] transition duration-200 hover:-translate-y-0.5 hover:border-red-400/40 hover:shadow-[0_16px_42px_rgba(239,68,68,.12)] active:scale-[.985]">
    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-400/15 bg-red-500/10 text-red-300"><span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-red-400/50"/><span className="relative h-2.5 w-2.5 rounded-full bg-red-400"/></span>
        <div className="min-w-0"><div className="truncate text-[10px] font-black text-white/90">{match.league || "رقابت فوتبال"}</div><div className="mt-1 truncate text-[8px] font-bold text-slate-500">{match.country || "فوتبال"}</div></div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-400/15 bg-red-500/10 px-2.5 py-1.5 text-[8px] font-black text-red-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400"/>{minute}</span>
    </div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="min-w-0 text-center"><div className="truncate text-[12px] font-black text-white">{faTeam(match.home)}</div><div className="mt-2 text-3xl font-black leading-none tabular-nums text-white">{homeScore}</div></div>
      <div className="flex flex-col items-center gap-1"><span className="text-[8px] font-black tracking-[.18em] text-red-300/70">LIVE</span><span className="text-xs font-black text-slate-600">—</span></div>
      <div className="min-w-0 text-center"><div className="truncate text-[12px] font-black text-white">{faTeam(match.away)}</div><div className="mt-2 text-3xl font-black leading-none tabular-nums text-white">{awayScore}</div></div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3"><span className="flex items-center gap-1.5 text-[8px] font-bold text-slate-600"><Zap size={11} className="text-red-400"/> بروزرسانی لحظه‌ای</span><span className="flex items-center gap-1 text-[8px] font-black text-slate-500 transition group-hover:text-red-300">جزئیات <ChevronLeft size={12}/></span></div>
  </Link>;
}

export default function HomeLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const load = async () => {
    try {
      const res = await fetch(`/api/football/live?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      const liveMatches = Array.isArray(json.matches) ? json.matches.filter(isLiveStatus) : [];
      setMatches(filterMajorLeagues(liveMatches));
    } catch {} finally { setLoaded(true); }
  };
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
  if (!loaded && !matches.length) return <section className="mt-5 overflow-hidden rounded-3xl border border-red-400/15 bg-gradient-to-br from-red-500/[.06] to-transparent p-4"><div className="flex items-center gap-2"><Radio size={16} className="text-red-400"/><h2 className="text-sm font-black">بازی‌های زنده</h2></div><div className="mt-4 h-28 animate-pulse rounded-2xl bg-white/[.035]"/></section>;
  return <section className="mt-5 overflow-hidden rounded-[28px] border border-red-400/10 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,.08),transparent_42%),rgba(2,6,23,.18)] p-3.5 sm:p-4">
    <div className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 shadow-[0_0_28px_rgba(239,68,68,.12)]"><span className="absolute inset-1.5 rounded-xl border border-red-400/10"/><Radio size={19} className="relative"/></span><div><div className="flex items-center gap-2"><h2 className="text-sm font-black text-white">نتایج زنده</h2><span className="rounded-full border border-red-400/15 bg-red-500/10 px-2 py-1 text-[8px] font-black text-red-300">LIVE</span></div><p className="mt-1 text-[9px] font-bold text-slate-500">فقط مسابقات در حال برگزاری لیگ‌های معتبر</p></div></div><Link href="/matches?live=1" className="shrink-0 rounded-xl border border-white/5 bg-white/[.035] px-3 py-2 text-[8px] font-black text-slate-400 transition hover:border-red-400/20 hover:text-red-300">همه زنده‌ها ←</Link></div>
    {!matches.length ? <div className="rounded-3xl border border-white/10 bg-white/[.025] px-5 py-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-400"><Radio size={22}/></div><p className="mt-3 text-[11px] font-black">فعلاً بازی زنده‌ای در جریان نیست</p><p className="mt-1 text-[9px] font-bold text-slate-600">به محض شروع مسابقه، اینجا نمایش داده می‌شود.</p></div> : <div className="grid gap-3 md:grid-cols-2">{matches.map((m) => <MatchCard key={m.id} match={m}/>)}</div>}
  </section>;
}
