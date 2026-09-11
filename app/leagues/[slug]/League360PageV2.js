import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Goal, Hand, ListOrdered, Newspaper, Trophy, Users, Activity } from "lucide-react";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../lib/fot10-universe";
import { getLeagueByCountry, getLeagueCurrentSeason, getTopScorers, getTopAssists } from "../../../lib/sports-data";
import { getMatchesResilient, getStandingsResilient, getPlayerStatsResilient } from "../../../lib/football-resilient";
import FavoriteButton from "../../../components/FavoriteButton";

const TABS = [
  ["overview", "در یک نگاه", BarChart3],
  ["table", "جدول", ListOrdered],
  ["matches", "بازی‌ها", CalendarDays],
  ["stats", "آمار", Goal],
  ["news", "اخبار", Newspaper],
];
const FINISHED = ["FT", "AET", "PEN"];
const LIVE = ["1H", "HT", "2H", "ET", "P", "LIVE", "IN PLAY"];
const todayTehran = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
const faDate = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "short", day: "numeric", month: "long" }).format(new Date(d));
const faTime = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const norm = n => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(fc|sc|club|sazi)\b/g, "").replace(/\s+/g, " ").trim();
const isLive = m => LIVE.includes(String(m?.statusShort || "").toUpperCase());
const teamLogo = id => id ? `https://media.api-sports.io/football/teams/${id}.png` : null;
const leagueLogo = id => id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;

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
    return <main className="fot-shell"><div className="fot-container py-20 text-center"><h1 className="text-xl font-black">رقابت پیدا نشد</h1><Link href="/leagues" className="mt-4 inline-block text-sm text-cyan-400">بازگشت به رقابت‌ها</Link></div></main>;
  }

  const league = entry || { name: cup.name, leagueName: cup.name, apiCountry: cup.country, flag: cup.icon, leagueId: cup.id };
  const requestedTab = searchParams?.tab;
  const tab = TABS.some(([id]) => id === requestedTab) ? requestedTab : "overview";

  let today = [];
  let seasonMatches = [];
  let standings = [];
  let scorers = [];
  let assists = [];
  let season = null;
  let resolved = null;
  let warning = null;

  try {
    resolved = league.leagueId
      ? { league: { id: league.leagueId, name: league.leagueName } }
      : await getLeagueByCountry(league.apiCountry, league.leagueName);
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
    if (results.some(item => item.status === "fulfilled" && item.value?.fallback)) {
      warning = "بخشی از داده‌ها با سرویس جایگزین مطمئن نمایش داده شد.";
    }
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
  const bestAttack = [...rows].filter(row => Number.isFinite(Number(row?.all?.goals?.for))).sort((a, b) => Number(b.all.goals.for) - Number(a.all.goals.for))[0];
  const bestDefense = [...rows].filter(row => Number.isFinite(Number(row?.all?.goals?.against))).sort((a, b) => Number(a.all.goals.against) - Number(b.all.goals.against))[0];
  const bestWins = [...rows].filter(row => Number.isFinite(Number(row?.all?.win))).sort((a, b) => Number(b.all.win) - Number(a.all.win))[0];

  const matchMap = new Map();
  [...today, ...upcoming, ...finished].forEach(match => {
    if (match?.id && !matchMap.has(String(match.id))) matchMap.set(String(match.id), match);
  });
  const visibleMatches = [...matchMap.values()].sort((a, b) => {
    const liveDiff = Number(isLive(b)) - Number(isLive(a));
    if (liveDiff) return liveDiff;
    return new Date(a.date || 0) - new Date(b.date || 0);
  }).slice(0, 16);

  const SectionTitle = ({ icon: Icon, eyebrow, title, meta }) => (
    <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 sm:px-5">
      <div className="min-w-0"><p className="text-[8px] font-black tracking-[.18em] text-cyan-300">{eyebrow}</p><h2 className="mt-1 flex items-center gap-2 text-base font-black sm:text-lg"><Icon size={17} />{title}</h2></div>
      {meta && <span className="shrink-0 text-[9px] text-slate-500">{meta}</span>}
    </div>
  );

  const Table = () => (
    <section className="glass overflow-hidden rounded-[24px] border border-white/10">
      <SectionTitle icon={Trophy} eyebrow="STANDINGS" title="جدول رده‌بندی" meta={`فصل ${season || "—"}`} />
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-[10px] sm:text-[11px]"><thead><tr className="bg-white/[.025] text-slate-500"><th className="w-9 p-3">#</th><th className="sticky right-0 bg-slate-950/95 p-3 text-right">تیم</th><th className="p-3">بازی</th><th className="hidden p-3 sm:table-cell">برد</th><th className="hidden p-3 sm:table-cell">مساوی</th><th className="hidden p-3 sm:table-cell">باخت</th><th className="hidden p-3 sm:table-cell">گل</th><th className="p-3">تفاضل</th><th className="p-3">فرم</th><th className="p-3">امتیاز</th></tr></thead><tbody>
        {rows.map((row, index) => {
          const name = row?.team?.name || "—";
          const logo = getLogo(name, row?.team?.id);
          return <tr key={`${name}-${index}`} className="border-t border-white/[.055] transition hover:bg-cyan-400/[.035]"><td className="p-2.5 text-center font-bold text-slate-500">{index + 1}</td><td className="sticky right-0 bg-slate-950/90 p-2.5"><Link href={teamHref(row)} className="flex min-w-[150px] items-center gap-2 font-bold"><span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[.05]">{logo ? <img src={logo} alt="" className="h-6 w-6 object-contain" /> : "⚽"}</span><span className="truncate">{name}</span></Link></td><td className="p-2.5 text-center">{row?.all?.played ?? 0}</td><td className="hidden p-2.5 text-center sm:table-cell">{row?.all?.win ?? 0}</td><td className="hidden p-2.5 text-center sm:table-cell">{row?.all?.draw ?? 0}</td><td className="hidden p-2.5 text-center sm:table-cell">{row?.all?.lose ?? row?.all?.loss ?? 0}</td><td className="hidden p-2.5 text-center sm:table-cell">{row?.all?.goals?.for ?? 0}</td><td className="p-2.5 text-center font-semibold">{row?.goalsDiff > 0 ? `+${row.goalsDiff}` : row?.goalsDiff ?? 0}</td><td className="p-2"><div className="flex justify-center gap-0.5">{form(row).map((value, i) => <i key={i} className={`grid h-5 w-5 place-items-center rounded-full text-[8px] font-black not-italic ${value === "W" ? "bg-emerald-400/20 text-emerald-300" : value === "D" ? "bg-amber-400/20 text-amber-300" : "bg-rose-400/20 text-rose-300"}`}>{value}</i>)}</div></td><td className="p-2.5 text-center font-black text-cyan-200">{row?.points ?? 0}</td></tr>;
        })}
      </tbody></table>{!rows.length && <div className="p-10 text-center text-xs text-slate-500">جدول این رقابت در دسترس نیست.</div>}</div>
    </section>
  );

  const Stats = () => (
    <section className="glass overflow-hidden rounded-[24px] border border-white/10"><SectionTitle icon={BarChart3} eyebrow="LEAGUE STATS" title="آمار رقابت" meta="فصل جاری" />
      <div className="grid grid-cols-2 gap-px bg-white/[.06] lg:grid-cols-4">{[["تیم‌ها", rows.length, Users], ["بازی‌ها", totalMatches, CalendarDays], ["گل‌ها", totalGoals, Goal], ["میانگین گل", totalMatches ? (totalGoals / totalMatches).toFixed(2) : "—", Activity]].map(([label, value, Icon]) => <div key={label} className="bg-slate-950/80 p-4"><Icon size={16} className="text-cyan-300" /><span className="mt-2 block text-[9px] text-slate-500">{label}</span><b className="mt-1 block text-xl">{value || "—"}</b></div>)}</div>
      <div className="grid gap-2 p-4 sm:grid-cols-3">{[[bestAttack, "بهترین حمله", bestAttack?.all?.goals?.for, "گل"], [bestDefense, "بهترین دفاع", bestDefense?.all?.goals?.against, "گل خورده"], [bestWins, "بیشترین برد", bestWins?.all?.win, "برد"]].filter(item => item[0]).map(([row, label, value, suffix]) => <div key={label} className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><span className="text-[9px] text-slate-500">{label}</span><strong className="mt-1 block text-xs">{row.team?.name}</strong><span className="text-[9px] text-cyan-300">{value} {suffix}</span></div>)}</div>
      <div className="grid gap-4 border-t border-white/[.07] p-4 lg:grid-cols-2"><div><h3 className="mb-2 flex items-center gap-2 text-xs font-black"><Goal size={15} />برترین گلزنان</h3>{scorers.slice(0, 5).map((item, i) => <div key={item?.player?.id || i} className="flex items-center justify-between border-b border-white/[.05] py-2 text-[10px]"><span><b className="ml-2 text-slate-600">{i + 1}</b>{item?.player?.name || "—"}</span><strong>{item?.statistics?.[0]?.goals?.total ?? item?.goals ?? "—"}</strong></div>)}</div><div><h3 className="mb-2 flex items-center gap-2 text-xs font-black"><Hand size={15} />برترین پاسورها</h3>{assists.slice(0, 5).map((item, i) => <div key={item?.player?.id || i} className="flex items-center justify-between border-b border-white/[.05] py-2 text-[10px]"><span><b className="ml-2 text-slate-600">{i + 1}</b>{item?.player?.name || "—"}</span><strong>{item?.statistics?.[0]?.goals?.assists ?? item?.assists ?? "—"}</strong></div>)}</div></div>
    </section>
  );

  const Matches = () => (
    <section className="glass overflow-hidden rounded-[24px] border border-white/10"><SectionTitle icon={CalendarDays} eyebrow="FIXTURES" title="بازی‌ها" meta={`${visibleMatches.length} نمایش از ${seasonMatches.length} داده`} /><div className="divide-y divide-white/[.055]">
      {visibleMatches.map((match, i) => {
        const live = isLive(match);
        const content = <div className="grid grid-cols-[58px_1fr_56px] items-center gap-2 px-4 py-3 transition hover:bg-white/[.025] sm:grid-cols-[78px_1fr_70px]"><div className="text-center"><b className="block text-[10px]">{live ? "زنده" : match.statusShort === "NS" ? faTime(match.date) : faDate(match.date)}</b><span className="text-[8px] text-slate-500">{live ? `${match.elapsed ? `${match.elapsed}′` : "LIVE"}` : match.statusShort === "NS" ? faDate(match.date) : "پایان"}</span></div><div className="grid grid-cols-[1fr_44px_1fr] items-center gap-2 text-[10px] sm:text-[11px]"><span className="truncate text-left font-bold">{match.home}</span><b className={live ? "text-center text-rose-300" : "text-center"}>{match.statusShort === "NS" ? "—" : `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`}</b><span className="truncate text-right font-bold">{match.away}</span></div><span className={`text-center text-[8px] font-bold ${live ? "text-rose-300" : "text-slate-500"}`}>{live ? "LIVE" : match.statusShort === "NS" ? "آینده" : "نتیجه"}</span></div>;
        return match?.id ? <Link href={`/matches/${match.id}`} key={`${match.id}-${i}`}>{content}</Link> : <div key={`${match?.home}-${match?.away}-${i}`}>{content}</div>;
      })}
      {!visibleMatches.length && <p className="py-10 text-center text-xs text-slate-500">مسابقه‌ای در دسترس نیست.</p>}
    </div></section>
  );

  return <main className="fot-shell min-h-screen pb-12"><div className="fot-container space-y-3 sm:space-y-4">
    <header className="flex items-center gap-2.5 py-1"><Link href="/leagues" className="glass grid h-9 w-9 shrink-0 place-items-center rounded-xl"><ArrowRight size={18} /></Link><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.05]">{leagueLogo(leagueId) ? <img src={leagueLogo(leagueId)} alt="" className="h-8 w-8 object-contain" /> : <span>{league.flag || "🏆"}</span>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h1 className="truncate text-sm font-black sm:text-base">{league.leagueName}</h1><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" /></div><p className="truncate text-[9px] text-slate-500">{entry ? entry.name : league.apiCountry} · فصل {season || "—"}</p></div><FavoriteButton type="league" name={league.leagueName || ""} /></header>
    <section className="glass overflow-hidden rounded-[22px] border border-white/10"><div className="flex items-center justify-between gap-3 bg-gradient-to-l from-cyan-400/[.09] to-transparent px-4 py-3"><div><span className="text-[8px] font-black tracking-[.16em] text-cyan-300">{entry ? entry.name : "رقابت فوتبال"}</span><h2 className="mt-1 text-lg font-black sm:text-xl">{league.leagueName}</h2><p className="mt-1 text-[9px] text-slate-500">جدول، نتایج، برنامه و آمار در یک نگاه</p></div><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.05]">{leagueLogo(leagueId) ? <img src={leagueLogo(leagueId)} alt="" className="h-11 w-11 object-contain" /> : <span className="text-3xl">{league.flag || "🏆"}</span>}</div></div></section>
    <nav className="glass sticky top-1 z-20 grid grid-cols-5 gap-0.5 rounded-2xl border border-white/10 p-1 backdrop-blur-xl">{TABS.map(([id, label, Icon]) => <Link key={id} href={`/leagues/${params.slug}?tab=${id}`} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-center text-[8px] font-bold sm:text-[9px] ${tab === id ? "bg-cyan-400 text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/5"}`}><Icon size={14} />{label}</Link>)}</nav>
    {warning && <div className="rounded-xl border border-amber-300/10 bg-amber-400/[.04] px-3 py-2 text-center text-[9px] text-amber-300">{warning}</div>}
    {tab === "overview" && <><Table /><Stats /><Matches /></>}
    {tab === "table" && <Table />}
    {tab === "stats" && <Stats />}
    {tab === "matches" && <Matches />}
    {tab === "news" && <section className="glass rounded-[24px] p-8 text-center"><Newspaper className="mx-auto text-cyan-300" size={26} /><h2 className="mt-3 font-black">اخبار این رقابت</h2><p className="mt-2 text-xs text-slate-500">مرکز اخبار رقابت در حال تکمیل است.</p></section>}
  </div></main>;
}
