import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Clock3, MapPin, Radio } from "lucide-react";
import MatchCenterRefresh from "./MatchCenterRefresh";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../../lib/fot10-universe";
import { getMatchesResilient } from "../../../../lib/football-resilient";

export const dynamic = "force-dynamic";

const iranTeamNames = {
  Tractor: "تراکتور", "Tractor Sazi": "تراکتور", Paykan: "پیکان", Peykan: "پیکان",
  Kheybar: "خیبر", "Kheybar Khorramabad": "خیبر خرم‌آباد", "Fajr Sepasi": "فجر سپاسی",
  Esteghlal: "استقلال", "Esteghlal FC": "استقلال", "Mes Shahr": "مس شهر بابک", "Mes Shahr-e Babak": "مس شهر بابک",
  "Chadormalu SC": "چادرملو", "Chadormalu Ardakan SC": "چادرملو", Sepahan: "سپاهان",
  "Esteghlal Khuzestan": "استقلال خوزستان", "Est. Khuzestan": "استقلال خوزستان", "Aluminium Arak": "آلومینیوم اراک",
  "Gol Gohar FC": "گل‌گهر", "Gol Gohar": "گل‌گهر", Nassaji: "نساجی", "Nassaji Mazandaran": "نساجی مازندران",
  "Zob Ahan": "ذوب‌آهن", Foolad: "فولاد", "Foolad Khuzestan": "فولاد خوزستان", "Shams Azar": "شمس‌آذر",
  "Shams Azar FC": "شمس‌آذر", Persepolis: "پرسپولیس", "Persepolis FC": "پرسپولیس",
  "Sanat Naft": "صنعت نفت آبادان", Malavan: "ملوان",
};
function faTeam(name) { return iranTeamNames[name] || name || "—"; }
function key(name) { return String(faTeam(name)).replace(/[يى]/g,"ی").replace(/[ك]/g,"ک").replace(/[‌\s-]/g,"").toLowerCase(); }
function logo(id) { return id && !String(id).startsWith("iran-") ? `https://media.api-sports.io/football/teams/${id}.png` : null; }
function live(m) { return ["1H","2H","HT","ET","P","LIVE"].includes(String(m?.statusShort || m?.status || "").toUpperCase()); }
function finished(m) { return ["FT","AET","PEN"].includes(String(m?.statusShort || m?.status || "").toUpperCase()) || (m?.homeScore != null && m?.awayScore != null); }
function dateText(d) { return d ? new Intl.DateTimeFormat("fa-IR",{timeZone:"Asia/Tehran",weekday:"short",day:"numeric",month:"long"}).format(new Date(d)) : "زمان اعلام می‌شود"; }
function timeText(d) { return d ? new Intl.DateTimeFormat("fa-IR",{timeZone:"Asia/Tehran",hour:"2-digit",minute:"2-digit"}).format(new Date(d)) : ""; }

// API-Football's normalized fixture object does not currently expose league.round.
// Reconstruct the matchweek deterministically from the chronological season fixtures.
function assignWeeks(matches) {
  const sorted = [...matches].sort((a,b) => new Date(a.date || "2999-12-31") - new Date(b.date || "2999-12-31"));
  const byPair = new Map();
  sorted.forEach((m,i) => {
    const pair = `${key(m.home)}>${key(m.away)}`;
    const reverse = `${key(m.away)}>${key(m.home)}`;
    const existing = byPair.get(pair) || byPair.get(reverse);
    if (existing) return;
    // A Persian Gulf Pro League matchweek contains nine fixtures. This keeps old
    // completed weeks visible even when the provider omits the round field.
    byPair.set(pair, Math.floor(i / 9) + 1);
  });
  return sorted.map((m,i) => ({ ...m, _week: byPair.get(`${key(m.home)}>${key(m.away)}`) || byPair.get(`${key(m.away)}>${key(m.home)}`) || Math.floor(i/9)+1 }));
}

export default async function LeagueMatchesPage({ params, searchParams }) {
  const league = LEAGUE_ENTRIES.find(x => x.slug === params.slug);
  const cup = CLUB_CUPS.find(x => x.slug === params.slug);
  if (!league && !cup) return <main className="fot-shell"><div className="fot-container py-20 text-center">رقابت پیدا نشد</div></main>;
  const item = league || { leagueName: cup.name, leagueId: cup.id, flag: cup.icon };
  const requested = String(searchParams?.week || "1").toLowerCase();
  const all = requested === "all";
  const selected = all ? null : Math.min(17, Math.max(1, Number(requested) || 1));
  let matches = [];
  try {
    const result = await getMatchesResilient({ league: item.leagueId, season: Number(item.leagueId) === 195 ? 2026 : undefined });
    matches = Array.isArray(result?.data) ? result.data : [];
  } catch {}
  const normalized = Number(item.leagueId) === 195 ? assignWeeks(matches) : matches.map((m,i) => ({...m,_week:i+1}));
  const rows = (all ? normalized : normalized.filter(m => Number(m._week) === selected)).sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));
  const counts = Array.from({length:17},(_,i) => normalized.filter(m => Number(m._week) === i+1).length);
  const finishedCount = rows.filter(finished).length;
  const liveCount = rows.filter(live).length;
  const goals = rows.reduce((s,m)=>s+(Number(m.homeScore)||0)+(Number(m.awayScore)||0),0);

  return <main className="fot-shell min-h-screen pb-24"><MatchCenterRefresh/><div className="fot-container space-y-4 sm:space-y-5">
    <header className="flex items-center gap-3 pt-2"><Link href={`/leagues/${params.slug}`} className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div className="min-w-0 flex-1"><p className="text-[9px] text-emerald-400 font-black tracking-[.22em]">FOT10 MATCH CENTER</p><h1 className="text-xl font-black truncate">{item.flag} {item.leagueName}</h1><p className="text-[10px] text-slate-500 mt-1">نتایج واقعی و برنامه فصل ۲۰۲۶ · زمان تهران</p></div><Link href="/notifications" className="glass h-11 w-11 rounded-2xl grid place-items-center"><Bell size={19}/></Link></header>
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/[.13] via-white/[.035] to-transparent p-4 sm:p-5"><div className="relative flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-cyan-300"><Radio size={15}/><span className="text-[9px] font-black tracking-[.18em]">LIVE MATCH CENTER</span></div><h2 className="text-lg sm:text-xl font-black mt-1">{all ? "تمام هفته‌ها" : `هفته ${selected}`}</h2><p className="text-[9px] text-slate-500 mt-1">{rows.length} بازی · {finishedCount} پایان‌یافته · {goals} گل</p></div>{liveCount>0&&<div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center"><span className="text-[8px] text-emerald-300">LIVE</span><b className="block text-sm text-emerald-200">{liveCount}</b></div>}</div></section>
    <section className="glass rounded-[24px] border border-white/10 p-2"><div className="flex items-center gap-2 overflow-x-auto pb-1" dir="rtl"><Link href={`/leagues/${params.slug}/matches?week=all`} className={`shrink-0 rounded-xl px-3.5 py-2.5 text-[10px] font-black ${all?"bg-cyan-400 text-slate-950":"bg-white/[.05] text-slate-400"}`}>همه</Link>{Array.from({length:17},(_,i)=>i+1).map(w=><Link key={w} href={`/leagues/${params.slug}/matches?week=${w}`} className={`shrink-0 min-w-[58px] rounded-xl px-2 py-2 text-center ${!all&&selected===w?"bg-cyan-400 text-slate-950":"bg-white/[.05] text-slate-400"}`}><span className="block text-[10px] font-black">هفته {w}</span><span className="block text-[8px] mt-0.5 opacity-60">{counts[w-1]} بازی</span></Link>)}</div></section>
    <section className="glass rounded-[28px] overflow-hidden border border-white/10"><div className="p-4 border-b border-white/10"><p className="text-[9px] text-cyan-300 font-black tracking-widest">MATCH CENTER</p><h3 className="text-base font-black mt-1">{all?"همه نتایج و برنامه‌ها":`بازی‌های هفته ${selected}`}</h3></div>{rows.length?<div className="divide-y divide-white/[.06]">{rows.map((m,i)=>{const h=faTeam(m.home),a=faTeam(m.away),hLogo=m.homeLogo||logo(m.homeId),aLogo=m.awayLogo||logo(m.awayId),isLive=live(m),isFinished=finished(m),score=m.homeScore!=null&&m.awayScore!=null?`${m.homeScore} - ${m.awayScore}`:"—";const body=<div className={`grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)_9rem] items-center gap-2 px-3 py-4 sm:px-5 ${isLive?"bg-emerald-400/[.04]":""}`}><div className="flex items-center justify-end gap-2 min-w-0"><div className="text-right min-w-0"><b className="block text-[10px] sm:text-xs truncate">{h}</b><span className="text-[8px] text-slate-600">میزبان</span></div>{hLogo?<img src={hLogo} alt={h} className="h-9 w-9 object-contain rounded-lg bg-white/[.04] p-1"/>:<span className="h-9 w-9 grid place-items-center bg-white/[.04] rounded-lg">⚽</span>}</div><div className="text-center"><b className={`inline-flex min-w-[48px] justify-center rounded-xl px-2 py-1.5 text-[11px] font-black ${isLive?"bg-emerald-400/15 text-emerald-300":isFinished?"bg-cyan-400/10 text-cyan-200":"bg-white/[.06] text-slate-400"}`}>{score}</b><span className="block text-[7px] mt-1 text-slate-600">{isLive?"زنده":isFinished?"پایان":"برنامه"}</span></div><div className="flex items-center gap-2 min-w-0"><img src={aLogo||""} alt={a} className={`h-9 w-9 object-contain rounded-lg bg-white/[.04] p-1 ${aLogo?"":"hidden"}`}/>{!aLogo&&<span className="h-9 w-9 grid place-items-center bg-white/[.04] rounded-lg">⚽</span>}<div className="min-w-0"><b className="block text-[10px] sm:text-xs truncate">{a}</b><span className="text-[8px] text-slate-600">مهمان</span></div></div><div className="hidden sm:block text-left text-[8px] text-slate-400"><span className="flex items-center gap-1 justify-end"><CalendarDays size={11}/>{dateText(m.date)}</span>{m.date&&<span className="flex items-center gap-1 justify-end mt-1"><Clock3 size={11}/>{timeText(m.date)}</span>}{m.venue&&<span className="flex items-center gap-1 justify-end mt-1 text-slate-600"><MapPin size={10}/>{m.venue}</span>}</div></div>;return m.id?<Link key={`${m.id}-${i}`} href={`/matches/${m.id}`}>{body}</Link>:<div key={i}>{body}</div>})}</div>:<div className="p-12 text-center text-xs text-slate-500">برای این هفته هنوز اطلاعات بازی از منبع داده دریافت نشده است.</div>}</section>
  </div></main>;
}
