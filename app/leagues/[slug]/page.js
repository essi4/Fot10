import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { getMatches, getStandings } from "../../../lib/sports-data";

const LEAGUES = {
  iran: { name: "لیگ برتر ایران", country: "ایران", icon: "🏆", id: 290 },
  ucl: { name: "لیگ قهرمانان اروپا", country: "اروپا", icon: "⭐", id: 2 },
  "premier-league": { name: "Premier League", country: "انگلیس", icon: "🏴", id: 39 },
  laliga: { name: "LaLiga", country: "اسپانیا", icon: "🇪🇸", id: 140 },
  bundesliga: { name: "Bundesliga", country: "آلمان", icon: "🇩🇪", id: 78 },
  "serie-a": { name: "Serie A", country: "ایتالیا", icon: "🇮🇹", id: 135 },
  "ligue-1": { name: "Ligue 1", country: "فرانسه", icon: "🇫🇷", id: 61 },
  eredivisie: { name: "Eredivisie", country: "هلند", icon: "🇳🇱", id: 88 },
  "primeira-liga": { name: "Primeira Liga", country: "پرتغال", icon: "🇵🇹", id: 94 },
  "saudi-pro-league": { name: "Saudi Pro League", country: "عربستان", icon: "🇸🇦", id: 307 },
  "super-lig": { name: "Süper Lig", country: "ترکیه", icon: "🇹🇷", id: 203 },
  brasileirao: { name: "Brasileirão Série A", country: "برزیل", icon: "🇧🇷", id: 71 },
  "liga-profesional": { name: "Liga Profesional", country: "آرژانتین", icon: "🇦🇷", id: 128 },
};

export const dynamic = "force-dynamic";

function formatTime(date) {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export default async function LeagueDetailPage({ params }) {
  const league = LEAGUES[params.slug];
  if (!league) return <main className="fot-shell"><div className="fot-container py-16 text-center"><h1 className="text-xl font-black">لیگ پیدا نشد</h1><Link href="/leagues" className="text-sm text-cyan-400 mt-4 inline-block">بازگشت به لیگ‌ها</Link></div></main>;

  const today = new Date().toISOString().slice(0, 10);
  let matches = [];
  let standings = [];
  try {
    [matches, standings] = await Promise.all([
      getMatches({ date: today, league: league.id, season: 2026 }),
      getStandings(league.id, 2026),
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
          <div><h1 className="text-xl font-black">{league.icon} {league.name}</h1><p className="text-[11px] text-slate-500">{league.country} · اطلاعات زنده</p></div>
        </header>

        <section className="glass card p-5">
          <div className="flex items-center gap-3"><span className="text-3xl">{league.icon}</span><div><p className="text-xs text-slate-400">رقابت</p><h2 className="text-2xl font-black">{league.name}</h2></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.04] p-3"><b>{matches.length}</b><p className="text-[9px] text-slate-500 mt-1">بازی امروز</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>{rows.length || "—"}</b><p className="text-[9px] text-slate-500 mt-1">تیم در جدول</p></div></div>
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-black"><CalendarDays size={16} /> بازی‌های امروز</h2>
          {matches.length ? matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="flex-1 text-right"><b className="block text-sm">{match.home}</b><b className="block text-sm mt-1">{match.away}</b></span><span className="text-xs text-slate-500">{match.statusShort === "NS" ? formatTime(match.date) : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}</span></Link>) : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">امروز بازی ثبت‌شده‌ای برای این لیگ پیدا نشد.</div>}
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-black"><Trophy size={16} /> جدول</h2>
          {rows.length ? <div className="glass rounded-2xl overflow-hidden">{rows.slice(0, 10).map((row) => <div key={row.team?.id} className="px-4 py-3 border-b border-white/5 flex items-center gap-3 text-xs"><b className="w-5">{row.rank}</b><span className="flex-1">{row.team?.name}</span><span>{row.points} امتیاز</span></div>)}</div> : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">جدول این رقابت در حال دریافت اطلاعات است.</div>}
        </section>
      </div>
    </main>
  );
}
