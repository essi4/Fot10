import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../../lib/fot10-universe";
import { getMatchesResilient } from "../../../../lib/football-resilient";

export const dynamic = "force-dynamic";

const iranWeekOne = [
  ["Tractor", "Paykan", "2026-08-14T18:00:00+03:30", 2, 0],
  ["Kheybar", "Fajr Sepasi", "2026-08-14T19:30:00+03:30", 1, 1],
  ["Esteghlal", "Mes Shahr", "2026-08-14T19:30:00+03:30", 4, 0],
  ["Chadormalu SC", "Sepahan", "2026-08-14T20:00:00+03:30", 0, 2],
  ["Esteghlal Khuzestan", "Aluminium Arak", "2026-08-14T20:00:00+03:30", 0, 2],
  ["Gol Gohar FC", "Nassaji", "2026-08-14T20:15:00+03:30", 1, 0],
  ["Zob Ahan", "Foolad", "2026-08-15T19:30:00+03:30", 0, 0],
  ["Shams Azar", "Persepolis", "2026-08-15T19:30:00+03:30", 0, 2],
  ["Sanat Naft", "Malavan", "2026-08-15T20:00:00+03:30", 1, 1],
];

function formatDate(date) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}

function formatTime(date) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function LeagueMatchesPage({ params }) {
  const league = LEAGUE_ENTRIES.find((x) => x.slug === params.slug);
  const cup = CLUB_CUPS.find((x) => x.slug === params.slug);
  if (!league && !cup) {
    return <main className="fot-shell"><div className="fot-container py-20 text-center">رقابت پیدا نشد</div></main>;
  }

  const item = league || { leagueName: cup.name, leagueId: cup.id, flag: cup.icon, name: cup.name };
  let matches = [];

  if (item.leagueId) {
    try {
      const result = await getMatchesResilient({ league: item.leagueId, season: Number(item.leagueId) === 195 ? 2026 : undefined });
      matches = result?.data || [];
    } catch {}
  }

  const apiWeekOne = matches.filter((m) => {
    const round = String(m?.round || m?.week || "").toLowerCase();
    return round === "1" || /(?:week|matchweek|round|مرحله|هفته)\s*1\b/.test(round);
  });

  const rows = apiWeekOne.length
    ? apiWeekOne.sort((a, b) => new Date(a.date) - new Date(b.date))
    : item.leagueId === 195
      ? iranWeekOne.map(([home, away, date, homeScore, awayScore], index) => ({ id: `iran-w1-${index + 1}`, home, away, date, homeScore, awayScore, statusShort: "FT" }))
      : [];

  return (
    <main className="fot-shell min-h-screen pb-24">
      <div className="fot-container space-y-4 sm:space-y-5">
        <header className="flex items-center gap-3 pt-1">
          <Link href={`/leagues/${params.slug}`} aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center hover:bg-white/10">
            <ArrowRight size={19} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-emerald-400 font-black tracking-widest">FOT10 MATCH CENTER</p>
            <h1 className="text-xl font-black truncate">{item.flag} {item.leagueName}</h1>
            <p className="text-[10px] text-slate-500 mt-1">برنامه و نتایج هفته اول · فصل ۲۰۲۶</p>
          </div>
        </header>

        <section className="glass rounded-[28px] overflow-hidden border border-white/10">
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-cyan-400/[.10] to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] text-cyan-300 font-black tracking-widest">MATCHWEEK 01</p>
                <h2 className="text-lg font-black mt-1">هفته اول</h2>
              </div>
              <span className="rounded-full bg-white/[.06] px-3 py-1.5 text-[9px] text-slate-400">{rows.length} بازی</span>
            </div>
          </div>

          {rows.length ? (
            <div className="divide-y divide-white/[.06]">
              {rows.map((m, index) => {
                const content = (
                  <div className="grid grid-cols-[2rem_minmax(0,1fr)_4rem_minmax(0,1fr)_7rem] items-center gap-2 px-3 py-3.5 sm:px-5 hover:bg-white/[.035] transition">
                    <span className="h-7 w-7 rounded-lg bg-white/[.05] grid place-items-center text-[9px] font-black text-slate-500">{index + 1}</span>
                    <div className="min-w-0 text-right"><b className="block text-[10px] sm:text-xs truncate">{m.home}</b><span className="text-[8px] text-slate-600">میزبان</span></div>
                    <div className="text-center"><b className="inline-flex min-w-[42px] justify-center rounded-xl bg-cyan-400/10 px-2 py-1.5 text-[11px] font-black text-cyan-200">{m.statusShort === "NS" ? "—" : `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`}</b></div>
                    <div className="min-w-0 text-right"><b className="block text-[10px] sm:text-xs truncate">{m.away}</b><span className="text-[8px] text-slate-600">مهمان</span></div>
                    <div className="text-left text-[8px] text-slate-400"><span className="flex items-center gap-1 justify-end"><CalendarDays size={11} />{formatDate(m.date)}</span><span className="flex items-center gap-1 justify-end mt-1"><Clock3 size={11} />{formatTime(m.date)}</span></div>
                  </div>
                );
                return m.id && !String(m.id).startsWith("iran-w1-") ? <Link key={m.id} href={`/matches/${m.id}`}>{content}</Link> : <div key={m.id}>{content}</div>;
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">برای این رقابت، برنامه هفته اول هنوز ثبت نشده است.</div>
          )}
        </section>

        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[.04] px-4 py-3 text-[9px] text-slate-500 leading-5">
          تاریخ و ساعت بازی‌ها بر اساس زمان تهران نمایش داده می‌شود.
        </div>
      </div>
    </main>
  );
}
