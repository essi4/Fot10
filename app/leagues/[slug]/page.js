import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy, Goal, Hand } from "lucide-react";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../lib/fot10-universe";
import { getLeagueByCountry, getLeagueCurrentSeason, getMatches, getTopScorers, getTopAssists } from "../../../lib/sports-data";
import { getStandingsResilient } from "../../../lib/football-resilient";

export const dynamic = "force-dynamic";

function tehranToday() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date()); }
function formatTime(date) { return new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(date)); }
function errorInfo(result) {
  if (result?.status !== "rejected") return null;
  const error = result.reason;
  return { code: error?.code || "API_ERROR", message: error?.message || "درخواست ناموفق بود.", status: error?.details?.status || null, dailyRemaining: error?.details?.dailyRemaining || null };
}

export default async function LeagueDetailPage({ params, searchParams }) {
  const countryLeague = LEAGUE_ENTRIES.find((item) => item.slug === params.slug);
  const cup = CLUB_CUPS.find((item) => item.slug === params.slug);
  if (!countryLeague && !cup) return <main className="fot-shell"><div className="fot-container py-16 text-center"><h1 className="text-xl font-black">رقابت پیدا نشد</h1><Link href="/leagues" className="text-sm text-cyan-400 mt-4 inline-block">بازگشت به رقابت‌ها</Link></div></main>;

  const league = countryLeague || { name: cup.name, leagueName: cup.name, apiCountry: cup.country, flag: cup.icon, leagueId: cup.id };
  const today = tehranToday();
  const debug = searchParams?.debug === "1";
  let matches = [], standings = [], scorers = [], assists = [], season = null, liveError = null, resolved = null, standingsMeta = null;
  let diagnostics = [];
  try {
    resolved = league.leagueId ? { league: { id: league.leagueId, name: league.leagueName }, source: "configured" } : await getLeagueByCountry(league.apiCountry, league.leagueName);
    const leagueId = resolved?.league?.id;
    if (!leagueId) throw new Error("league unavailable");
    season = await getLeagueCurrentSeason(leagueId);
    if (!season) throw new Error("season unavailable");

    const results = await Promise.allSettled([
      getMatches({ date: today, league: leagueId, season }),
      getStandingsResilient(leagueId, season),
      getTopScorers(leagueId, season),
      getTopAssists(leagueId, season),
    ]);

    matches = results[0].status === "fulfilled" ? results[0].value : [];
    if (results[1].status === "fulfilled") {
      standingsMeta = results[1].value;
      standings = standingsMeta.data || [];
    }
    scorers = results[2].status === "fulfilled" ? results[2].value : [];
    assists = results[3].status === "fulfilled" ? results[3].value : [];
    diagnostics = results.map((result, index) => {
      if (index === 1 && result.status === "fulfilled") return { name: "جدول", ok: result.value.data.length > 0, count: result.value.data.length, source: result.value.source, fallback: result.value.fallback, error: result.value.errors?.length ? result.value.errors : null };
      return { name: ["بازی‌ها", "جدول", "گلزنان", "پاس گل"][index], ok: result.status === "fulfilled", count: result.status === "fulfilled" ? result.value?.length || 0 : 0, error: errorInfo(result) };
    });

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length || standingsMeta?.fallback) liveError = standingsMeta?.fallback ? "جدول با سرویس رایگان جایگزین نمایش داده شد؛ API اصلی در دسترس نبود." : "بعضی بخش‌های داده زنده در دسترس نبود؛ اطلاعات سالم همچنان نمایش داده می‌شود.";
  } catch (error) {
    liveError = error instanceof Error ? error.message : "live data unavailable";
  }

  const rows = (standings || []).flatMap((item) => {
    const groups = item?.league?.standings || [];
    return groups.flat ? groups.flat() : groups;
  }).filter(Boolean);
  const displayCountry = countryLeague ? `${countryLeague.flag} ${countryLeague.name}` : league.apiCountry;
  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/leagues" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">{league.flag} {league.leagueName}</h1><p className="text-[11px] text-slate-500">{displayCountry} · اطلاعات زنده{season ? ` · فصل ${season}` : ""}</p></div></header>
    {debug && <section className="rounded-2xl bg-slate-950 border border-slate-700 p-4 font-mono text-[11px] text-slate-300 space-y-2" dir="ltr"><p className="text-yellow-300 font-bold">FOT10 API diagnostic</p><p>leagueId: {resolved?.league?.id ?? league.leagueId ?? "unknown"} · season: {season ?? "none"} · date: {today}</p>{diagnostics.map((item) => <div key={item.name} className={item.ok ? "text-emerald-300" : "text-red-300"}>{item.name}: {item.ok ? `OK (${item.count})` : `${item.error?.code || "ERROR"} · HTTP ${item.error?.status ?? "?"} · ${item.error?.message || "failed"}`}{item.source ? ` · source ${item.source}${item.fallback ? " · FALLBACK" : ""}` : ""}</div>)}</section>}
    <section className="glass card p-5"><div className="flex items-center gap-3"><span className="text-3xl">{league.flag}</span><div><p className="text-xs text-slate-400">رقابت</p><h2 className="text-2xl font-black">{league.leagueName}</h2></div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.04] p-3"><b>{matches.length}</b><p className="text-[9px] text-slate-500 mt-1">بازی امروز</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>{rows.length || "—"}</b><p className="text-[9px] text-slate-500 mt-1">تیم در جدول</p></div></div></section>
    {liveError && <div className="glass rounded-2xl p-4 text-center text-xs text-amber-300">{liveError}</div>}
    <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><CalendarDays size={16}/> بازی‌های امروز</h2>{matches.length ? matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="h-8 w-8 shrink-0 grid place-items-center"><img src={match.homeLogo} alt="" className="h-8 w-8 object-contain"/></span><span className="flex-1 text-right"><b className="block text-sm">{match.home}</b><b className="block text-sm mt-1">{match.away}</b></span><span className="text-xs text-slate-500">{match.statusShort === "NS" ? formatTime(match.date) : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}</span></Link>) : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">امروز بازی ثبت‌شده‌ای برای این رقابت پیدا نشد.</div>}</section>
    <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><Trophy size={16}/> جدول فصل</h2>{rows.length ? <div className="glass rounded-2xl overflow-hidden">{rows.map((row, index) => <div key={`${row.team?.id ?? "team"}-${index}`} className="px-4 py-3 border-b border-white/5 flex items-center gap-3 text-xs"><b className="w-5">{row.rank}</b><span className="flex-1">{row.team?.name}</span><span className="text-slate-400">{row.all?.played ?? 0} بازی</span><b>{row.points} امتیاز</b></div>)}</div> : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">جدول این رقابت فعلاً داده‌ای برنگرداند.</div>}</section>
    <section className="grid grid-cols-2 gap-3">
      <div className="glass rounded-2xl p-4"><h2 className="flex items-center gap-2 text-sm font-black mb-3"><Goal size={16}/> گلزنان برتر</h2>{scorers.slice(0, 5).map((item, i) => <Link key={`${item.player?.id}-${i}`} href={`/players/${item.player?.id}`} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0"><span className="text-[10px] text-slate-500 w-4">{i + 1}</span><span className="min-w-0 flex-1 text-xs truncate">{item.player?.name}</span><b className="text-xs">{item.statistics?.[0]?.goals?.total ?? 0}</b></Link>)}{!scorers.length && <p className="text-xs text-slate-500">داده‌ای موجود نیست.</p>}</div>
      <div className="glass rounded-2xl p-4"><h2 className="flex items-center gap-2 text-sm font-black mb-3"><Hand size={16}/> پاس گل</h2>{assists.slice(0, 5).map((item, i) => <Link key={`${item.player?.id}-${i}`} href={`/players/${item.player?.id}`} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0"><span className="text-[10px] text-slate-500 w-4">{i + 1}</span><span className="min-w-0 flex-1 text-xs truncate">{item.player?.name}</span><b className="text-xs">{item.statistics?.[0]?.goals?.assists ?? 0}</b></Link>)}{!assists.length && <p className="text-xs text-slate-500">داده‌ای موجود نیست.</p>}</div>
    </section>
  </div></main>;
}
