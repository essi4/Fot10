import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Goal, Hand, ListOrdered, Newspaper, Trophy, Users, Activity, Star } from "lucide-react";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../lib/fot10-universe";
import { getLeagueByCountry, getLeagueCurrentSeason, getTopScorers, getTopAssists } from "../../../lib/sports-data";
import { getMatchesResilient, getStandingsResilient, getPlayerStatsResilient } from "../../../lib/football-resilient";
import FavoriteButton from "../../../components/FavoriteButton";

const TABS = [["overview", "در یک نگاه", BarChart3], ["table", "جدول", ListOrdered], ["matches", "بازی‌ها", CalendarDays], ["stats", "آمار", Goal], ["news", "اخبار", Newspaper]];
const FINISHED = ["FT", "AET", "PEN"];
const todayTehran = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
const faDate = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "short", day: "numeric", month: "long" }).format(new Date(d));
const faTime = d => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const norm = n => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\b(fc|sc|club|sazi)\b/g, "").replace(/\s+/g, " ").trim();
const leagueLogo = id => id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;
const teamLogo = id => id ? `https://media.api-sports.io/football/teams/${id}.png` : null;
function resultForTeam(m, team) { const t = norm(team), h = norm(m.home), a = norm(m.away); if (t !== h && t !== a) return null; const hs = Number(m.homeScore), as = Number(m.awayScore); if (!Number.isFinite(hs) || !Number.isFinite(as)) return null; return hs === as ? "D" : (t === h ? hs > as : as > hs) ? "W" : "L"; }

export default async function League360Page({ params, searchParams }) {
  const entry = LEAGUE_ENTRIES.find(x => x.slug === params.slug);
  const cup = CLUB_CUPS.find(x => x.slug === params.slug);
  if (!entry && !cup) return <main className="fot-shell"><div className="fot-container py-20 text-center"><h1 className="text-xl font-black">رقابت پیدا نشد</h1><Link href="/leagues" className="text-cyan-400 text-sm mt-4 inline-block">بازگشت به رقابت‌ها</Link></div></main>;
  const league = entry || { name: cup.name, leagueName: cup.name, apiCountry: cup.country, flag: cup.icon, leagueId: cup.id };
  const tab = TABS.some(([id]) => id === searchParams?.tab) ? searchParams.tab : "overview";
  let today = [], seasonMatches = [], standings = [], scorers = [], assists = [], season = null, resolved = null, warning = null;
  try {
    resolved = league.leagueId ? { league: { id: league.leagueId, name: league.leagueName } } : await getLeagueByCountry(league.apiCountry, league.leagueName);
    const id = resolved?.league?.id;
    if (!id) throw new Error("league unavailable");
    season = Number(id) === 195 ? 2026 : await getLeagueCurrentSeason(id);
    const rs = await Promise.allSettled([
      getMatchesResilient({ date: todayTehran(), league: id, season }),
      getMatchesResilient({ league: id, season }),
      getStandingsResilient(id, season),
      getPlayerStatsResilient("scorers", id, season, getTopScorers),
      getPlayerStatsResilient("assists", id, season, getTopAssists),
    ]);
    if (rs[0].status === "fulfilled") today = rs[0].value.data || [];
    if (rs[1].status === "fulfilled") seasonMatches = rs[1].value.data || [];
    if (rs[2].status === "fulfilled") standings = rs[2].value.data || [];
    if (rs[3].status === "fulfilled") scorers = rs[3].value.data || [];
    if (rs[4].status === "fulfilled") assists = rs[4].value.data || [];
    if (rs.some(r => r.status === "fulfilled" && r.value?.fallback)) warning = "بخشی از داده‌ها با سرویس جایگزین مطمئن نمایش داده شد.";
  } catch (e) { warning = e instanceof Error ? e.message : "دریافت اطلاعات رقابت ناموفق بود."; }

  const leagueId = resolved?.league?.id || league.leagueId || null;
  const rows = standings.flatMap(x => x?.league?.standings || []).flat();
  const finished = seasonMatches.filter(m => FINISHED.includes(m.statusShort)).sort((a,b) => new Date(b.date) - new Date(a.date));
  const upcoming = seasonMatches.filter(m => m?.date && new Date(m.date) > new Date() && !FINISHED.includes(m.statusShort)).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 12);
  const logoMap = new Map();
  seasonMatches.forEach(m => { if (m?.home && m?.homeLogo) logoMap.set(norm(m.home), m.homeLogo); if (m?.away && m?.awayLogo) logoMap.set(norm(m.away), m.awayLogo); });
  const getLogo = (name,id) => logoMap.get(norm(name)) || teamLogo(id);
  const teamHref = r => r?.team?.id && !String(r.team.id).startsWith("iran-") ? `/teams/${r.team.id}` : `/teams?search=${encodeURIComponent(r?.team?.name || "")}`;
  const form = r => finished.filter(m => resultForTeam(m, r?.team?.name)).slice(0,5).map(m => resultForTeam(m, r?.team?.name));
  const totalGoals = rows.reduce((s,r) => s + Number(r?.all?.goals?.for || 0), 0);
  const totalMatches = finished.length;
  const bestAttack = [...rows].filter(r => Number.isFinite(Number(r?.all?.goals?.for))).sort((a,b) => b.all.goals.for-a.all.goals.for)[0];
  const bestDefense = [...rows].filter(r => Number.isFinite(Number(r?.all?.goals?.against))).sort((a,b) => a.all.goals.against-b.all.goals.against)[0];
  const bestWins = [...rows].filter(r => Number.isFinite(Number(r?.all?.win))).sort((a,b) => b.all.win-a.all.win)[0];
  const matchMap = new Map();
  [...today, ...upcoming].forEach(m => { if (m?.id && !matchMap.has(String(m.id))) matchMap.set(String(m.id), m); });
  const visibleMatches = [...matchMap.values()].slice(0, 16);

  const SectionTitle = ({ icon: Icon, eyebrow, title, meta }) => <div className="px-4 sm:px-5 py-4 border-b border-white/[.07] flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[8px] tracking-[.18em] text-cyan-300 font-black">{eyebrow}</p><h2 className="text-base sm:text-lg font-black mt-1 flex items-center gap-2"><Icon size={17}/>{title}</h2></div>{meta && <span className="text-[9px] text-slate-500 shrink-0">{meta}</span>}</div>;

  const Table = () => <section className="glass rounded-[24px] border border-white/10 overflow-hidden"><SectionTitle icon={Trophy} eyebrow="STANDINGS" title="جدول رده‌بندی" meta={`فصل ${season || "—"}`} /><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-[10px] sm:text-[11px] border-collapse"><thead><tr className="bg-white/[.025] text-slate-500"><th className="w-9 p-3 text-center">#</th><th className="p-3 text-right sticky right-0 bg-slate-950/95">تیم</th><th className="p-3 text-center">بازی</th><th className="p-3 text-center hidden sm:table-cell">برد</th><th className="p-3 text-center hidden sm:table-cell">مساوی</th><th className="p-3 text-center hidden sm:table-cell">باخت</th><th className="p-3 text-center hidden sm:table-cell">گل</th><th className="p-3 text-center">تفاضل</th><th className="p-3 text-center">فرم</th><th className="p-3 text-center">امتیاز</th></tr></thead><tbody>{rows.map((r,i)=>{const name=r?.team?.name||"—";const logo=getLogo(name,r?.team?.id);return <tr key={`${name}-${i}`} className="border-t border-white/[.055] hover:bg-cyan-400/[.035] transition"><td className="p-2.5 sm:p-3 text-center text-slate-500 font-bold">{i+1}</td><td className="p-2.5 sm:p-3 sticky right-0 bg-slate-950/90"><Link href={teamHref(r)} className="flex items-center gap-2 min-w-[150px] font-bold"><span className="h-7 w-7 rounded-lg bg-white/[.05] border border-white/10 grid place-items-center overflow-hidden shrink-0">{logo?<img src={logo} alt="" className="h-6 w-6 object-contain"/>:"⚽"}</span><span className="truncate">{name}</span></Link></td><td className="p-2.5 text-center">{r?.all?.played??0}</td><td className="p-2.5 text-center hidden sm:table-cell">{r?.all?.win??0}</td><td className="p-2.5 text-center hidden sm:table-cell">{r?.all?.draw??0}</td><td className="p-2.5 text-center hidden sm:table-cell">{r?.all?.lose??r?.all?.loss??0}</td><td className="p-2.5 text-center hidden sm:table-cell">{r?.all?.goals?.for??0}</td><td className="p-2.5 text-center font-semibold">{r?.goalsDiff>0?`+${r.goalsDiff}`:r?.goalsDiff??0}</td><td className="p-2 flex justify-center gap-0.5">{form(r).map((v,j)=><i key={j} className={`not-italic h-5 w-5 rounded-full grid place-items-center text-[8px] font-black ${v==="W"?"bg-emerald-400/20 text-emerald-300":v==="D"?"bg-amber-400/20 text-amber-300":"bg-rose-400/20 text-rose-300"}`}>{v}</i>)}</td><td className="p-2.5 text-center font-black text-cyan-200">{r?.points??0}</td></tr>})}</tbody></table>{!rows.length&&<div className="p-10 text-center text-slate-500 text-xs">جدول این رقابت در دسترس نیست.</div>}</div></section>;

  const Stats = () => <section className="glass rounded-[24px] border border-white/10 overflow-hidden"><SectionTitle icon={BarChart3} eyebrow="LEAGUE STATS" title="آمار رقابت" meta="فصل جاری" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[.06]">{[["تیم‌ها",rows.length,Users],["بازی‌ها",totalMatches,CalendarDays],["گل‌ها",totalGoals,Goal],["میانگین گل",totalMatches?(totalGoals/totalMatches).toFixed(2):"—",Activity]].map(([label,value,Icon])=><div key={label} className="bg-slate-950/80 p-4"><Icon size={16} className="text-cyan-300"/><span className="block text-[9px] text-slate-500 mt-2">{label}</span><b className="block text-xl mt-1">{value || "—"}</b></div>)}</div><div className="p-4 grid sm:grid-cols-3 gap-2">{[[bestAttack,"بهترین حمله",bestAttack?.all?.goals?.for,"گل"],[bestDefense,"بهترین دفاع",bestDefense?.all?.goals?.against,"گل خورده"],[bestWins,"بیشترین برد",bestWins?.all?.win,"برد"]].filter(x=>x[0]).map(([r,l,v,s])=><div key={l} className="rounded-xl bg-white/[.025] border border-white/[.06] p-3"><span className="text-[9px] text-slate-500">{l}</span><strong className="block text-xs mt-1">{r.team?.name}</strong><span className="text-[9px] text-cyan-300">{v} {s}</span></div>)}</div><div className="border-t border-white/[.07] p-4 grid lg:grid-cols-2 gap-4"><div><h3 className="font-black text-xs mb-2 flex gap-2 items-center"><Goal size={15}/> برترین گلزنان</h3>{scorers.slice(0,5).map((x,i)=><div key={x?.player?.id||i} className="flex items-center justify-between py-2 border-b border-white/[.05] text-[10px]"><span><b className="text-slate-600 ml-2">{i+1}</b>{x?.player?.name||"—"}</span><strong>{x?.statistics?.[0]?.goals?.total??x?.goals??"—"}</strong></div>)}</div><div><h3 className="font-black text-xs mb-2 flex gap-2 items-center"><Hand size={15}/> برترین پاسورها</h3>{assists.slice(0,5).map((x,i)=><div key={x?.player?.id||i} className="flex items-center justify-between py-2 border-b border-white/[.05] text-[10px]"><span><b className="text-slate-600 ml-2">{i+1}</b>{x?.player?.name||"—"}</span><strong>{x?.statistics?.[0]?.goals?.assists??x?.assists??"—"}</strong></div>)}</div></div></section>;

  const Matches = () => <section className="glass rounded-[24px] border border-white/10 overflow-hidden"><SectionTitle icon={CalendarDays} eyebrow="FIXTURES" title="بازی‌ها" meta={`${seasonMatches.length} مسابقه`} /><div className="divide-y divide-white/[.055]">{visibleMatches.map((m,i)=>{const live=!FINISHED.includes(m.statusShort)&&["1H","HT","2H","ET","P","LIVE","IN PLAY"].includes(String(m.statusShort||"").toUpperCase());const content=<div className="grid grid-cols-[58px_1fr_56px] sm:grid-cols-[78px_1fr_70px] items-center gap-2 px-4 py-3 hover:bg-white/[.025] transition"><div className="text-center"><b className="block text-[10px]">{live?"زنده":m.statusShort==="NS"?faTime(m.date):faDate(m.date)}</b><span className="text-[8px] text-slate-500">{live?`${m.elapsed?`${m.elapsed}′`:"LIVE"}`:m.statusShort==="NS"?faDate(m.date):"پایان"}</span></div><div className="grid grid-cols-[1fr_44px_1fr] items-center gap-2 text-[10px] sm:text-[11px]"><span className="font-bold text-left truncate">{m.home}</span><b className={`text-center ${live?"text-rose-300":""}`}>{m.statusShort==="NS"?"—":`${m.homeScore??"-"} : ${m.awayScore??"-"}`}</b><span className="font-bold text-right truncate">{m.away}</span></div><span className={`text-center text-[8px] font-bold ${live?"text-rose-300":"text-slate-500"}`}>{live?"LIVE":m.statusShort==="NS"?"آینده":"نتیجه"}</span></div>;return m?.id?<Link href={`/matches/${m.id}`} key={`${m.id}-${i}`}>{content}</Link>:<div key={`${m?.home}-${m?.away}-${i}`}>{content}</div>})}{!visibleMatches.length&&<p className="text-center text-slate-500 text-xs py-10">مسابقه‌ای در دسترس نیست.</p>}</div></section>;

  return <main className="fot-shell min-h-screen pb-12"><div className="fot-container space-y-3 sm:space-y-4"><header className="flex items-center gap-2.5 py-1"><Link href="/leagues" className="glass h-9 w-9 rounded-xl grid place-items-center shrink-0"><ArrowRight size={18}/></Link><div className="h-10 w-10 rounded-xl bg-white/[.05] border border-white/10 grid place-items-center overflow-hidden shrink-0">{leagueLogo(leagueId)?<img src={leagueLogo(leagueId)} alt="" className="h-8 w-8 object-contain"/>:<span>{league.flag||"🏆"}</span>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h1 className="font-black text-sm sm:text-base truncate">{league.leagueName}</h1><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"/></div><p className="text-[9px] text-slate-500 truncate">{entry?entry.name:league.apiCountry} · فصل {season||"—"}</p></div><FavoriteButton type="league" name={league.leagueName||""}/></header>

  <section className="glass rounded-[22px] border border-white/10 overflow-hidden"><div className="px-4 py-3 flex items-center justify-between gap-3 bg-gradient-to-l from-cyan-400/[.09] to-transparent"><div><span className="text-[8px] font-black text-cyan-300 tracking-[.16em]">{entry?entry.name:"رقابت فوتبال"}</span><h2 className="text-lg sm:text-xl font-black mt-1">{league.leagueName}</h2><p className="text-[9px] text-slate-500 mt-1">جدول، نتایج، برنامه و آمار در یک نگاه</p></div><div className="h-14 w-14 rounded-2xl bg-white/[.05] border border-white/10 grid place-items-center shrink-0">{leagueLogo(leagueId)?<img src={leagueLogo(leagueId)} alt="" className="h-11 w-11 object-contain"/>:<span className="text-3xl">{league.flag||"🏆"}</span>}</div></div></section>

  <nav className="glass rounded-2xl p-1 grid grid-cols-5 gap-0.5 sticky top-1 z-20 backdrop-blur-xl border border-white/10">{TABS.map(([id,label,I])=><Link key={id} href={`/leagues/${params.slug}?tab=${id}`} className={`rounded-xl py-2 text-[8px] sm:text-[9px] font-bold text-center flex flex-col items-center gap-1 ${tab===id?"bg-cyan-400 text-slate-950 shadow-lg":"text-slate-400 hover:bg-white/5"}`}><I size={14}/>{label}</Link>)}</nav>

  {warning&&<div className="rounded-xl border border-amber-300/10 bg-amber-400/[.04] px-3 py-2 text-center text-[9px] text-amber-300">{warning}</div>}
  {tab==="overview"&&<><Table/><Stats/><Matches/></>}
  {tab==="table"&&<Table/>}
  {tab==="stats"&&<Stats/>}
  {tab==="matches"&&<Matches/>}
  {tab==="news"&&<section className="glass rounded-[24px] p-8 text-center"><Newspaper className="mx-auto text-cyan-300" size={26}/><h2 className="font-black mt-3">اخبار این رقابت</h2><p className="text-xs text-slate-500 mt-2">مرکز اخبار رقابت در حال تکمیل است.</p></section>}
  </div></main>;
}
