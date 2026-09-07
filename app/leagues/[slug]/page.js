import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { getLeagueCurrentSeason, getMatches, getStandings } from "../../../lib/sports-data";

const LEAGUES = {
  iran: { name: "لیگ برتر ایران", country: "ایران", icon: "🏆", id: 290 },
  ucl: { name: "لیگ قهرمانان اروپا", country: "اروپا", icon: "⭐", id: 2 },
  "world-cup": { name: "جام جهانی", country: "تیم‌های ملی", icon: "🌍", id: 1 },
  "asian-cup": { name: "جام ملت‌های آسیا", country: "آسیا · تیم‌های ملی", icon: "🏆", id: 16 },
  "world-cup-qualifiers-asia": { name: "مقدماتی جام جهانی آسیا", country: "آسیا · تیم‌های ملی", icon: "🌏", id: 30 },
  "afc-champions-league": { name: "AFC Champions League Elite", country: "آسیا · باشگاهی", icon: "👑", id: 17 },
  "afc-champions-league-two": { name: "AFC Champions League Two", country: "آسیا · باشگاهی", icon: "🏆", id: 18 },
  "afc-challenge-league": { name: "AFC Challenge League", country: "آسیا · باشگاهی", icon: "⚽", id: 1031 },
  "afc-u20": { name: "AFC U20 Asian Cup", country: "آسیا · جوانان", icon: "🌟", id: 965 },
  "afc-u17": { name: "AFC U17 Asian Cup", country: "آسیا · نوجوانان", icon: "⭐", id: 1028 },
  "afc-womens-champions-league": { name: "AFC Women's Champions League", country: "آسیا · زنان", icon: "👑", id: 1140 },
  "asian-cup-women": { name: "Asian Cup Women", country: "آسیا · تیم‌های ملی زنان", icon: "🏆", id: 897 },
  "premier-league": { name: "Premier League", country: "انگلیس", icon: "🏴", id: 39 },
  laliga: { name: "LaLiga", country: "اسپانیا", icon: "🇪🇸", id: 140 },
  bundesliga: { name: "Bundesliga", country: "آلمان", icon: "🇩🇪", id: 78 },
  "serie-a": { name: "Serie A", country: "ایتالیا", icon: "🇮🇹", id: 135 },
  "ligue-1": { name: "Ligue 1", country: "فرانسه", icon: "🇫🇷", id: 61 },
  eredivisie: { name: "Eredivisie", country: "هلند", icon: "🇳🇱", id: 88 },
  "primeira-liga": { name: "Primeira Liga", country: "پرتغال", icon: "🇵🇹", id: 94 },
  "saudi-pro-league": { name: "Saudi Pro League", country: "عربستان", icon: "🇸🇦", id: 307 },
  "super-lig": { name: "Süper Lig", country: "ترکیه", icon: "🇹🇷", id: 203 },
  "qatar-stars-league": { name: "Qatar Stars League", country: "قطر", icon: "🇶🇦", id: 305 },
  "uae-pro-league": { name: "UAE Pro League", country: "امارات", icon: "🇦🇪", id: 301 },
  "j1-league": { name: "J1 League", country: "ژاپن", icon: "🇯🇵", id: 98 },
  "k-league-1": { name: "K League 1", country: "کره جنوبی", icon: "🇰🇷", id: 292 },
  "chinese-super-league": { name: "Chinese Super League", country: "چین", icon: "🇨🇳", id: 169 },
  "a-league": { name: "A-League Men", country: "استرالیا", icon: "🇦🇺", id: 188 },
  brasileirao: { name: "Brasileirão Série A", country: "برزیل", icon: "🇧🇷", id: 71 },
  "liga-profesional": { name: "Liga Profesional", country: "آرژانتین", icon: "🇦🇷", id: 128 },
  mls: { name: "MLS", country: "آمریکا", icon: "🇺🇸", id: 253 },
  "liga-mx": { name: "Liga MX", country: "مکزیک", icon: "🇲🇽", id: 262 },
};

export const dynamic = "force-dynamic";

function tehranToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

function formatTime(date) {
  return new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export default async function LeagueDetailPage({ params }) {
  const league = LEAGUES[params.slug];
  if (!league) return <main className="fot-shell"><div className="fot-container py-16 text-center"><h1 className="text-xl font-black">رقابت پیدا نشد</h1><Link href="/leagues" className="text-sm text-cyan-400 mt-4 inline-block">بازگشت به رقابت‌ها</Link></div></main>;

  const today = tehranToday();
  let matches = [];
  let standings = [];
  let season = null;
  try {
    season = await getLeagueCurrentSeason(league.id);
    if (!season) throw new Error("season unavailable");
    [matches, standings] = await Promise.all([
      getMatches({ date: today, league: league.id, season }),
      getStandings(league.id, season),
    ]);
  } catch {
    matches = [];
    standings = [];
  }

  const rows = standings?.[0]?.league?.standings?.[0] || [];

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/leagues" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">{league.icon} {league.name}</h1><p className="text-[11px] text-slate-500">{league.country} · اطلاعات زنده{season ? ` · فصل ${season}` : ""}</p></div>
        </header>
        <section className="glass card p-5"><div className="flex items-center gap-3"><span className="text-3xl">{league.icon}</span><div><p className="text-xs text-slate-400">رقابت</p><h2 className="text-2xl font-black">{league.name}</h2></div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.04] p-3"><b>{matches.length}</b><p className="text-[9px] text-slate-500 mt-1">بازی امروز</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>{rows.length || "—"}</b><p className="text-[9px] text-slate-500 mt-1">تیم در جدول</p></div></div></section>
        <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><CalendarDays size={16} /> بازی‌های امروز</h2>{matches.length ? matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="flex-1 text-right"><b className="block text-sm">{match.home}</b><b className="block text-sm mt-1">{match.away}</b></span><span className="text-xs text-slate-500">{match.statusShort === "NS" ? formatTime(match.date) : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}</span></Link>) : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">امروز بازی ثبت‌شده‌ای برای این رقابت پیدا نشد.</div>}</section>
        <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><Trophy size={16} /> جدول</h2>{rows.length ? <div className="glass rounded-2xl overflow-hidden">{rows.slice(0, 10).map((row) => <div key={row.team?.id} className="px-4 py-3 border-b border-white/5 flex items-center gap-3 text-xs"><b className="w-5">{row.rank}</b><span className="flex-1">{row.team?.name}</span><span>{row.points} امتیاز</span></div>)}</div> : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">جدول این رقابت در حال دریافت اطلاعات است.</div>}</section>
      </div>
    </main>
  );
}
