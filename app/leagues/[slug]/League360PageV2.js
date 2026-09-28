"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Goal, Hand, ListOrdered, Newspaper, Trophy, Users, Activity } from "lucide-react";
import { useState } from "react";
import { LEAGUE_ENTRIES, CLUB_CUPS } from "../../../lib/fot10-universe";
import { getLeagueByCountry, getLeagueCurrentSeason, getTopScorers, getTopAssists } from "../../../lib/sports-data";
import { getMatchesResilient, getStandingsResilient, getPlayerStatsResilient } from "../../../lib/football-resilient";
import FavoriteButton from "../../../components/FavoriteButton";

const TABS = [
  ["table", "جدول", ListOrdered],
  ["matches", "بازی‌ها", CalendarDays],
  ["news", "ویدیو و خبر", Newspaper],
  ["stats", "آمار", BarChart3],
];
const FINISHED = ["FT", "AET", "PEN"];
const LIVE = ["1H", "HT", "2H", "ET", "P", "LIVE", "IN PLAY"];
const todayTehran = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
const faDate = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "short", day: "numeric", month: "long" }).format(new Date(d));
const faTime = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const faNow = () => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }).format(new Date());
const norm = n => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(fc|sc|club|sazi)\b/g, "").replace(/\s+/g, " ").trim();
const isLive = m => LIVE.includes(String(m?.statusShort || "").toUpperCase());
const teamLogo = id => id ? `https://media.api-sports.io/football/teams/${id}.png` : null;
const leagueLogo = id => id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;
const seasonLabel = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const start = n > 1800 ? n - 621 : n;
  return `${start}-${start + 1}`;
};

function resultForTeam(match, team) {
  const t = norm(team);
  const home = norm(match?.home);
  const away = norm(match?.away);
  if (t !== home && t !== away) return null;
  const hs = Number(match?.homeScore);
  const as = Number(match?.awayScore);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return null;
  if (hs === as) return "D";
  return t === home ? (hs > as ? "W" : "L") : (as > hs ? "W" : "L");
}

export default async function League360PageV2({ params, searchParams }) {
  const entry = LEAGUE_ENTRIES.find(item => item.slug === params.slug);
  const cup = CLUB_CUPS.find(item => item.slug === params.slug);
  if (!entry && !cup) {
    return <main className="fot-shell"><div className="fot-container py-20 text-center"><h1 className="text-xl font-black">رقابت پیدا نشد</h1><Link href="/leagues" className="mt-4 inline-block text-sm text-cyan-400">بازگشت به لیگ‌ها</Link></div></main>;
  }

  const league = entry || { name: cup.name, leagueName: cup.name, apiCountry: cup.country, flag: cup.icon, leagueId: cup.id };
  const requestedTab = searchParams?.tab;
  const tab = TABS.some(([id]) => id === requestedTab) ? requestedTab : "table";

  let today = [], seasonMatches = [], standings = [], scorers = [], assists = [], season = null, resolved = null, warning = null;
  try {
    resolved = league.leagueId ? { league: { id: league.leagueId, name: league.leagueName } } : await getLeagueByCountry(league.apiCountry, league.leagueName);
    const id = resolved?.league?.id;
    if (!id) throw new Error("league unavailable");
    season = Number(id) === 195 ? 2026 : await getLeagueCurrentSeason(id);
    const results = await Promise.allSettled([
      getMatchesResilient({ date: todayTehran(), league: id, season }),
      getMatchesResilient({ league: id, season }),
      getStandingsResilient(id, season),
      getPlayerStatsResilient("scorers", id, season, getTopScorers),
      getPlayerStatsResilient("assists", id, season, getTopAssists),
    ]);
    if (results[0].status === "fulfilled") today = results[0].value.data || [];
    if (results[1].status === "fulfilled") seasonMatches = results[1].value.data || [];
    if (results[2].status === "fulfilled") standings = results[2].value.data || [];
    if (results[3].status === "fulfilled") scorers = results[3].value.data || [];
    if (results[4].status === "fulfilled") assists = results[4].value.data || [];
    if (results.some(item => item.status === "fulfilled" && item.value?.fallback)) warning = "بخشی از داده‌ها با سرویس جایگزین مطمئن نمایش داده شد.";
  } catch (error) {
    warning = error instanceof Error ? error.message : "دریافت اطلاعات رقابت ناموفق بود.";
  }

  const leagueId = resolved?.league?.id || league.leagueId || null;
  const rows = standings.flatMap(item => item?.league?.standings || []).flat();
  const finished = seasonMatches.filter(match => FINISHED.includes(match?.statusShort)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const upcoming = seasonMatches.filter(match => match?.date && new Date(match.date) > new Date() && !FINISHED.includes(match?.statusShort)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const logoMap = new Map();
  seasonMatches.forEach(match => {
    if (match?.home && match?.homeLogo) logoMap.set(norm(match.home), match.homeLogo);
    if (match?.away && match?.awayLogo) logoMap.set(norm(match.away), match.awayLogo);
  });
  const getLogo = (name, id) => logoMap.get(norm(name)) || teamLogo(id);
  const teamHref = row => row?.team?.id && !String(row.team.id).startsWith("iran-") ? `/teams/${row.team.id}` : `/teams?search=${encodeURIComponent(row?.team?.name || "")}`;
  const form = row => {
    const direct = String(row?.form || "").toUpperCase().replace(/[^WDL]/g, "").slice(-5).split("");
    if (direct.length) return direct;
    return finished.filter(match => resultForTeam(match, row?.team?.name)).slice(0, 5).map(match => resultForTeam(match, row?.team?.name));
  };
  const standingsPlayed = rows.reduce((sum, row) => sum + Number(row?.all?.played || 0), 0);
  const totalMatches = standingsPlayed > 0 ? Math.round(standingsPlayed / 2) : finished.length;
  const totalGoals = rows.reduce((sum, row) => sum + Number(row?.all?.goals?.for || 0), 0);
  const bestAttack = [...rows].sort((a, b) => Number(b?.all?.goals?.for || 0) - Number(a?.all?.goals?.for || 0))[0];
  const bestDefense = [...rows].sort((a, b) => Number(a?.all?.goals?.against || 999) - Number(b?.all?.goals?.against || 999))[0];
  const bestWins = [...rows].sort((a, b) => Number(b?.all?.win || 0) - Number(a?.all?.win || 0))[0];

  const matchMap = new Map();
  [...today, ...upcoming, ...finished].forEach(match => {
    if (match?.id && !matchMap.has(String(match.id))) matchMap.set(String(match.id), match);
  });
  const visibleMatches = [...matchMap.values()].sort((a, b) => {
    const liveDiff = Number(isLive(b)) - Number(isLive(a));
    if (liveDiff) return liveDiff;
    return new Date(a.date || 0) - new Date(b.date || 0);
  }).slice(0, 16);

  const Table = () => (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-black">جدول رده‌بندی · فصل {seasonLabel(season)}</h2>
        <p className="mt-1 text-[10px] font-bold text-slate-400">آخرین به‌روزرسانی: {faNow()}</p>
        <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-[9px] font-black text-white">جدول کامل</span>
          <span className="px-3 py-1.5 text-[9px] font-bold text-slate-500">جدول خلاصه</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[690px] border-collapse text-[10px] sm:text-[11px]">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="w-10 p-3">رتبه</th><th className="sticky right-0 bg-slate-50 p-3 text-right">تیم</th>
            <th className="p-3">بازی</th><th className="p-3">برد</th><th className="p-3">مساوی</th><th className="p-3">باخت</th>
            <th className="p-3">تفاضل</th><th className="p-3">گل+</th><th className="p-3">گل-</th><th className="p-3">امتیاز</th>
          </tr></thead>
          <tbody>{rows.map((row, index) => {
            const name = row?.team?.name || "—";
            const logo = getLogo(name, row?.team?.id);
            const gd = Number(row?.goalsDiff || 0);
            return <tr key={`${name}-${index}`} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="p-3 text-center font-black text-slate-400">{row?.rank ?? index + 1}</td>
              <td className="sticky right-0 bg-white p-3"><Link href={teamHref(row)} className="font-black text-slate-900">{name}</Link></td>
              <td className="p-3 text-center">{row?.all?.played ?? 0}</td><td className="p-3 text-center">{row?.all?.win ?? 0}</td>
              <td className="p-3 text-center">{row?.all?.draw ?? 0}</td><td className="p-3 text-center">{row?.all?.lose ?? row?.all?.loss ?? 0}</td>
              <td className={`p-3 text-center font-bold ${gd > 0 ? "text-emerald-600" : gd < 0 ? "text-rose-600" : "text-slate-500"}`}>{gd > 0 ? "+" : ""}{gd}</td>
              <td className="p-3 text-center">{row?.all?.goals?.for ?? 0}</td><td className="p-3 text-center">{row?.all?.goals?.against ?? 0}</td>
              <td className="p-3 text-center font-black text-slate-950">{row?.points ?? 0}</td>
            </tr>;
          })}</tbody>
        </table>
        {!rows.length && <div className="p-10 text-center text-xs text-slate-400">جدول این لیگ در دسترس نیست.</div>}
      </div>
    </section>
  );

  const Stats = () => (
    <section className="rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)] overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4"><h2 className="text-base font-black">آمار رقابت · فصل {seasonLabel(season)}</h2></div>
      <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">{[["تیم‌ها", rows.length, Users], ["بازی‌ها", totalMatches, CalendarDays], ["گل‌ها", totalGoals, Goal], ["میانگین گل", totalMatches ? (totalGoals / totalMatches).toFixed(2) : "—", Activity]].map(([label, value, Icon]) => <div key={label} className="bg-white p-4"><Icon size={16} className="text-slate-500" /><span className="mt-2 block text-[9px] text-slate-400">{label}</span><b className="mt-1 block text-xl">{value || "—"}</b></div>)}</div>
      <div className="grid gap-2 p-4 sm:grid-cols-3">{[[bestAttack, "بهترین حمله", bestAttack?.all?.goals?.for, "گل"], [bestDefense, "بهترین دفاع", bestDefense?.all?.goals?.against, "گل خورده"], [bestWins, "بیشترین برد", bestWins?.all?.win, "برد"]].filter(item => item[0]).map(([row, label, value, suffix]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="text-[9px] text-slate-400">{label}</span><strong className="mt-1 block text-xs">{row.team?.name}</strong><span className="text-[9px] text-slate-600">{value} {suffix}</span></div>)}</div>
      <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-2"><div><h3 className="mb-2 flex items-center gap-2 text-xs font-black"><Goal size={15} />برترین گلزنان</h3>{scorers.slice(0, 5).map((item, i) => <div key={item?.player?.id || i} className="flex items-center justify-between border-b border-slate-100 py-2 text-[10px]"><span><b className="ml-2 text-slate-400">{i + 1}</b>{item?.player?.name || "—"}</span><strong>{item?.statistics?.[0]?.goals?.total ?? item?.goals ?? "—"}</strong></div>)}</div><div><h3 className="mb-2 flex items-center gap-2 text-xs font-black"><Hand size={15} />برترین پاسورها</h3>{assists.slice(0, 5).map((item, i) => <div key={item?.player?.id || i} className="flex items-center justify-between border-b border-slate-100 py-2 text-[10px]"><span><b className="ml-2 text-slate-400">{i + 1}</b>{item?.player?.name || "—"}</span><strong>{item?.statistics?.[0]?.goals?.assists ?? item?.assists ?? "—"}</strong></div>)}</div></div>
    </section>
  );

  const Matches = () => (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)]"><div className="border-b border-slate-200 px-4 py-4"><h2 className="text-base font-black">بازی‌ها</h2><p className="mt-1 text-[10px] text-slate-400">بازی‌های انجام‌شده و برنامه آینده · فقط داده واقعی</p></div><div className="divide-y divide-slate-100">
      {visibleMatches.map((match, i) => { const live = isLive(match); return match?.id ? <Link href={`/matches/${match.id}`} key={`${match.id}-${i}`} className="grid grid-cols-[72px_1fr_54px] items-center gap-2 px-4 py-3 hover:bg-slate-50"><div className="text-center"><b className="block text-[10px]">{live ? "زنده" : match.statusShort === "NS" ? faTime(match.date) : faDate(match.date)}</b><span className="text-[8px] text-slate-400">{live ? `${match.elapsed ? `${match.elapsed}′` : "LIVE"}` : match.statusShort === "NS" ? faDate(match.date) : "پایان"}</span></div><div className="grid grid-cols-[1fr_46px_1fr] items-center gap-2 text-[10px] sm:text-[11px]"><span className="truncate text-left font-bold">{match.home}</span><b className={live ? "text-center text-rose-600" : "text-center"}>{match.statusShort === "NS" ? "—" : `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`}</b><span className="truncate text-right font-bold">{match.away}</span></div><span className={`text-center text-[8px] font-bold ${live ? "text-rose-600" : "text-slate-400"}`}>{live ? "LIVE" : match.statusShort === "NS" ? "آینده" : "نتیجه"}</span></Link> : null; })}
      {!visibleMatches.length && <p className="py-10 text-center text-xs text-slate-400">مسابقه‌ای در دسترس نیست.</p>}
    </div></section>
  );

  const News = () => (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,.05)]">
      <h2 className="text-base font-black">ویدیو و خبر · {league.leagueName}</h2>
      <p className="mt-2 text-xs leading-6 text-slate-500">خبر و ویدیوهای این لیگ در این بخش متمرکز می‌شوند.</p>
      <Link href={`/leagues/${params.slug}?tab=news`} className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black text-white">مشاهده خبرها</Link>
    </section>
  );

  return <main className="fot-shell min-h-screen pb-12"><div className="fot-container space-y-3 sm:space-y-4">
    <header className="flex items-center gap-2.5 py-1"><Link href="/leagues" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><ArrowRight size={18} /></Link><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">{leagueLogo(leagueId) ? <img src={leagueLogo(leagueId)} alt="" className="h-8 w-8 object-contain" /> : <span>{league.flag || "🏆"}</span>}</div><div className="min-w-0 flex-1"><h1 className="truncate text-sm font-black sm:text-base">{league.leagueName}</h1><p className="truncate text-[9px] text-slate-500">{entry ? entry.name : league.apiCountry} · فصل {seasonLabel(season)}</p></div><FavoriteButton type="league" name={league.leagueName || ""} /></header>
    <nav className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">{TABS.map(([id, label, Icon]) => <Link key={id} href={`/leagues/${params.slug}?tab=${id}`} className={`flex items-center justify-center gap-1 rounded-xl py-2.5 text-[9px] font-black ${tab === id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}><Icon size={14} />{label}</Link>)}</nav>
    {warning && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[9px] text-amber-700">{warning}</div>}
    {tab === "table" && <Table />}
    {tab === "stats" && <Stats />}
    {tab === "matches" && <Matches />}
    {tab === "news" && <News />}
  </div></main>;
}
