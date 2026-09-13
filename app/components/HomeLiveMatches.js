"use client";

import { ChevronLeft, Radio, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TOP_LEAGUES = [
  { key: "Iran", label: "ایران", names: ["Persian Gulf Pro League", "Iranian Pro League", "خلیج فارس"], countries: ["iran"] },
  { key: "England", label: "انگلیس", names: ["Premier League"], countries: ["england", "united kingdom"] },
  { key: "Spain", label: "اسپانیا", names: ["La Liga", "Laliga"], countries: ["spain"] },
  { key: "Italy", label: "ایتالیا", names: ["Serie A"], countries: ["italy"] },
  { key: "Germany", label: "آلمان", names: ["Bundesliga"], countries: ["germany"] },
];

const TEAM_FA = { "Manchester City": "منچسترسیتی", "Manchester United": "منچستریونایتد", Liverpool: "لیورپول", Arsenal: "آرسنال", Chelsea: "چلسی", Tottenham: "تاتنهام", "Real Madrid": "رئال مادرید", Barcelona: "بارسلونا", "Atletico Madrid": "اتلتیکومادرید", "Bayern Munich": "بایرن مونیخ", "Borussia Dortmund": "بوروسیا دورتموند", Juventus: "یوونتوس", Inter: "اینتر", "AC Milan": "آث میلان", PSG: "پاری‌سن‌ژرمن", Tractor: "تراکتور", Persepolis: "پرسپولیس", Esteghlal: "استقلال", Sepahan: "سپاهان" };
const faTeam = (name) => TEAM_FA[name] || name;
const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const isLive = (m) => ["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"].includes(String(m?.statusShort || m?.status || "").toUpperCase());
const leagueKey = (m) => TOP_LEAGUES.find((l) => l.names.some((n) => normalize(n) === normalize(m?.league)) && l.countries.some((c) => normalize(m?.country).includes(c)))?.key || null;

function MatchRow({ match }) {
  return <Link href={match.id ? `/matches/${match.id}` : "/matches"} className="group block rounded-2xl border border-red-400/15 bg-red-500/[.035] p-3 transition active:scale-[.99] hover:border-red-300/25">
    <div className="mb-2 flex items-center justify-between gap-2 text-[7px] font-black"><span className="truncate text-slate-500">{match.league}</span><span className="shrink-0 text-red-300">● LIVE {match.elapsed ? `· ${match.elapsed}'` : ""}</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-right text-[10px] font-black text-slate-100">{faTeam(match.home)}</span>{match.homeLogo && <img src={match.homeLogo} alt="" className="h-7 w-7 shrink-0 object-contain"/>}</div><div className="min-w-[58px] text-center text-base font-black tabular-nums text-white">{match.homeScore ?? "—"} <span className="text-slate-600">-</span> {match.awayScore ?? "—"}</div><div className="flex min-w-0 items-center gap-2"><img src={match.awayLogo || ""} alt="" className={match.awayLogo ? "h-7 w-7 shrink-0 object-contain" : "hidden"}/><span className="truncate text-left text-[10px] font-black text-slate-100">{faTeam(match.away)}</span></div></div>
    <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[8px] font-bold text-slate-600"><span>آمار لحظه‌ای داخل مرکز مسابقه</span><span className="text-red-300/80">مشاهده بازی ←</span></div>
  </Link>;
}

export default function HomeLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inFlight, setInFlight] = useState(false);

  const load = async (manual = false) => {
    if (inFlight) return;
    setInFlight(true);
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`/api/football/live?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      const live = (Array.isArray(json.matches) ? json.matches : []).map((m) => ({ ...m, topKey: leagueKey(m) })).filter((m) => m.topKey && isLive(m));
      setMatches(live.slice(0, 12));
    } catch { setMatches([]); } finally { setLoading(false); setRefreshing(false); setInFlight(false); }
  };

  useEffect(() => { load(); const timer = setInterval(() => load(), 30000); return () => clearInterval(timer); }, []);

  return <section className="rounded-3xl border border-red-500/15 bg-gradient-to-br from-red-500/[.055] via-white/[.025] to-transparent p-3.5 shadow-xl">
    <div className="mb-3 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Radio size={15} className="text-red-300"/><h2 className="text-sm font-black">نتایج زنده</h2><span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[7px] font-black text-red-300">LIVE</span></div><p className="mt-1 text-[9px] font-bold text-slate-600">اسکور زنده بدون فشار اضافه روی API · آمار کامل داخل مرکز مسابقه</p></div><button onClick={() => load(true)} className="rounded-xl border border-white/8 bg-white/[.03] p-2 text-slate-500" aria-label="به‌روزرسانی"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/></button></div>
    {loading ? <div className="h-24 animate-pulse rounded-2xl bg-white/[.035]"/> : matches.length ? <div className="space-y-2.5">{matches.map((m) => <MatchRow key={m.id} match={m}/>)}</div> : <div className="rounded-2xl border border-white/7 bg-white/[.02] px-4 py-7 text-center"><Radio size={19} className="mx-auto text-slate-700"/><p className="mt-2 text-[10px] font-black text-slate-500">در حال حاضر مسابقه زنده‌ای از ۵ لیگ مهم نداریم</p></div>}
    <Link href="/matches?live=1" className="mt-2.5 flex items-center justify-center gap-2 rounded-2xl border border-red-400/10 bg-red-500/[.025] py-2.5 text-[9px] font-black text-slate-500 transition hover:text-red-300"><Trophy size={13}/> ورود به LIVE Center <ChevronLeft size={12}/></Link>
  </section>;
}