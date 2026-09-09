"use client";

import { ChevronLeft, Radio } from "lucide-react";
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
  return <Link href={match.id ? `/matches/${match.id}` : "/matches"} className="group block rounded-2xl border border-red-400/15 bg-gradient-to-br from-red-500/[.08] via-white/[.035] to-transparent p-3.5 transition hover:border-red-400/30 active:scale-[.99]">
    <div className="mb-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-400"><span className="absolute h-2 w-2 animate-ping rounded-full bg-red-400/80"/><span className="relative h-2 w-2 rounded-full bg-red-400"/></span><div className="min-w-0"><div className="truncate text-[9px] font-black text-slate-300">{match.league || "رقابت فوتبال"}</div><div className="mt-0.5 truncate text-[8px] font-bold text-slate-600">{match.country || ""}</div></div></div><span className="shrink-0 rounded-full bg-red-500/10 px-2 py-1 text-[8px] font-black text-red-300">{status === "HT" ? "نیمه‌وقت" : status === "2H" ? `${match.elapsed || ""}'` : "زنده"}</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="min-w-0 text-center"><div className="truncate text-[11px] font-black text-white">{faTeam(match.home)}</div><div className="mt-2 text-xl font-black tabular-nums">{homeScore}</div></div><div className="text-[9px] font-black text-slate-600">—</div><div className="min-w-0 text-center"><div className="truncate text-[11px] font-black text-white">{faTeam(match.away)}</div><div className="mt-2 text-xl font-black tabular-nums">{awayScore}</div></div></div>
    <div className="mt-3 flex items-center justify-end gap-1 text-[8px] font-black text-slate-600 group-hover:text-red-300">جزئیات بازی <ChevronLeft size={12}/></div>
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
  if (!loaded && !matches.length) return <section className="mt-5 rounded-3xl border border-red-400/10 bg-red-500/[.025] p-4"><div className="flex items-center gap-2"><Radio size={16} className="text-red-400"/><h2 className="text-sm font-black">بازی‌های زنده</h2></div><div className="mt-3 h-24 animate-pulse rounded-2xl bg-white/[.035]"/></section>;
  return <section className="mt-5"><div className="mb-3 flex items-end justify-between"><div><div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400"/><h2 className="text-sm font-black">بازی‌های زنده</h2></div><p className="mt-1 text-[9px] font-bold text-slate-600">فقط مسابقات زنده لیگ‌های معتبر</p></div><Link href="/matches?live=1" className="text-[9px] font-black text-red-300">همه زنده‌ها ←</Link></div>
    {!matches.length ? <div className="rounded-3xl border border-white/10 bg-white/[.025] px-5 py-7 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400"><Radio size={21}/></div><p className="mt-3 text-[11px] font-black">فعلاً بازی زنده‌ای در جریان نیست</p><p className="mt-1 text-[9px] font-bold text-slate-600">به محض شروع مسابقه، اینجا نمایش داده می‌شود.</p></div> : <div className="grid gap-2.5">{matches.map((m) => <MatchCard key={m.id} match={m}/>)}</div>}
  </section>;
}
