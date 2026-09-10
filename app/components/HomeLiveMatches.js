"use client";

import { BarChart3, ChevronLeft, Radio, RefreshCw, Trophy } from "lucide-react";
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

function valueOf(stats, labels) {
  const item = (stats || []).find((s) => labels.some((x) => normalize(s?.type).includes(normalize(x))));
  return item?.value ?? "—";
}

function StatStrip({ stats }) {
  const home = stats?.[0]?.statistics || [];
  const away = stats?.[1]?.statistics || [];
  const items = [
    ["مالکیت", valueOf(home, ["ball possession"]), valueOf(away, ["ball possession"])],
    ["شوت", valueOf(home, ["total shots"]), valueOf(away, ["total shots"])],
    ["شوت در چارچوب", valueOf(home, ["shots on goal"]), valueOf(away, ["shots on goal"])],
    ["کرنر", valueOf(home, ["corner kicks"]), valueOf(away, ["corner kicks"])],
  ];
  return <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl border border-white/6 bg-black/10 p-1.5">{items.map(([label, h, a]) => <div key={label} className="rounded-lg bg-white/[.025] px-1.5 py-2 text-center"><div className="text-[7px] font-bold text-slate-600">{label}</div><div className="mt-1 text-[9px] font-black text-slate-200 tabular-nums"><span>{h}</span><span className="mx-1 text-slate-700">·</span><span>{a}</span></div></div>)}</div>;
}

function MatchRow({ match }) {
  const live = isLive(match);
  return <Link href={match.id ? `/matches/${match.id}` : "/matches"} className="group block rounded-2xl border border-red-400/15 bg-red-500/[.035] p-3 transition active:scale-[.99] hover:border-red-300/25">
    <div className="mb-2 flex items-center justify-between gap-2 text-[7px] font-black"><span className="truncate text-slate-500">{match.league}</span><span className="shrink-0 text-red-300">● LIVE {match.elapsed ? `· ${match.elapsed}'` : ""}</span></div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="truncate text-right text-[10px] font-black text-slate-100">{faTeam(match.home)}</div><div className="min-w-[58px] text-center text-base font-black tabular-nums text-white">{match.homeScore ?? "—"} <span className="text-slate-600">-</span> {match.awayScore ?? "—"}</div><div className="truncate text-left text-[10px] font-black text-slate-100">{faTeam(match.away)}</div></div>
    <StatStrip stats={match.stats} />
  </Link>;
}

export default function HomeLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/football/live", { cache: "no-store" });
      const json = await res.json();
      const live = (Array.isArray(json.matches) ? json.matches : []).map((m) => ({ ...m, topKey: leagueKey(m) })).filter((m) => m.topKey && isLive(m));
      const enriched = await Promise.all(live.slice(0, 12).map(async (m) => {
        try { const r = await fetch(`/api/football/fixture?id=${encodeURIComponent(m.id)}&section=statistics`, { cache: "no-store" }); const j = await r.json(); return { ...m, stats: Array.isArray(j.data) ? j.data : [] }; } catch { return { ...m, stats: [] }; }
      }));
      setMatches(enriched);
    } catch { setMatches([]); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); const timer = setInterval(() => load(), 30000); return () => clearInterval(timer); }, []);

  return <section className="rounded-3xl border border-white/8 bg-gradient-to-br from-red-500/[.045] via-white/[.025] to-transparent p-3.5 shadow-xl">
    <div className="mb-3 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Radio size={15} className="text-red-300"/><h2 className="text-sm font-black">نتایج زنده</h2><span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[7px] font-black text-red-300">LIVE</span></div><p className="mt-1 text-[9px] font-bold text-slate-600">فقط مسابقات در حال برگزاری · آمار لحظه‌ای</p></div><button onClick={() => load(true)} className="rounded-xl border border-white/8 bg-white/[.03] p-2 text-slate-500" aria-label="به‌روزرسانی"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/></button></div>
    {loading ? <div className="h-24 animate-pulse rounded-2xl bg-white/[.035]"/> : matches.length ? <div className="space-y-2.5">{matches.map((m) => <MatchRow key={m.id} match={m}/>)}</div> : <div className="rounded-2xl border border-white/7 bg-white/[.02] px-4 py-7 text-center"><Radio size={19} className="mx-auto text-slate-700"/><p className="mt-2 text-[10px] font-black text-slate-500">در حال حاضر مسابقه زنده‌ای از ۵ لیگ مهم نداریم</p></div>}
    <Link href="/leagues" className="mt-2.5 flex items-center justify-center gap-2 rounded-2xl border border-white/7 bg-white/[.02] py-2.5 text-[9px] font-black text-slate-500 transition hover:text-emerald-300"><Trophy size={13}/> لیگ‌های دیگر <ChevronLeft size={12}/></Link>
  </section>;
}
