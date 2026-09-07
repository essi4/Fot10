import Link from "next/link";
import { ArrowRight, CalendarDays, Flag, Trophy } from "lucide-react";
import { getMatches, getTeamBySearch } from "../../../lib/sports-data";

const TEAMS = {
  iran: { name: "Iran", fa: "ایران", flag: "🇮🇷" },
  japan: { name: "Japan", fa: "ژاپن", flag: "🇯🇵" },
  "south-korea": { name: "South Korea", fa: "کره جنوبی", flag: "🇰🇷" },
  "saudi-arabia": { name: "Saudi Arabia", fa: "عربستان", flag: "🇸🇦" },
  qatar: { name: "Qatar", fa: "قطر", flag: "🇶🇦" },
  australia: { name: "Australia", fa: "استرالیا", flag: "🇦🇺" },
  france: { name: "France", fa: "فرانسه", flag: "🇫🇷" },
  england: { name: "England", fa: "انگلیس", flag: "🏴" },
  spain: { name: "Spain", fa: "اسپانیا", flag: "🇪🇸" },
  germany: { name: "Germany", fa: "آلمان", flag: "🇩🇪" },
  italy: { name: "Italy", fa: "ایتالیا", flag: "🇮🇹" },
  brazil: { name: "Brazil", fa: "برزیل", flag: "🇧🇷" },
  argentina: { name: "Argentina", fa: "آرژانتین", flag: "🇦🇷" },
  portugal: { name: "Portugal", fa: "پرتغال", flag: "🇵🇹" },
  netherlands: { name: "Netherlands", fa: "هلند", flag: "🇳🇱" },
  turkey: { name: "Turkey", fa: "ترکیه", flag: "🇹🇷" },
  usa: { name: "United States", fa: "آمریکا", flag: "🇺🇸" },
};

export const dynamic = "force-dynamic";

const faTime = (date) => new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));

export default async function NationalTeamPage({ params }) {
  const team = TEAMS[params.slug];
  if (!team) return <main className="fot-shell"><div className="fot-container py-16 text-center"><h1 className="text-xl font-black">تیم پیدا نشد</h1><Link href="/national-teams" className="text-cyan-400 text-sm mt-3 inline-block">بازگشت</Link></div></main>;

  let profile = null;
  let matches = [];
  try {
    profile = await getTeamBySearch(team.name);
    if (profile?.team?.id) matches = await getMatches({ team: profile.team.id, season: 2026 });
  } catch {}

  const upcoming = matches.filter((m) => new Date(m.date) >= new Date()).slice(0, 8);
  const recent = matches.filter((m) => new Date(m.date) < new Date()).slice(-8).reverse();
  const logo = profile?.team?.logo;

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3"><Link href="/national-teams" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">{team.flag} {team.fa}</h1><p className="text-[11px] text-slate-500">تیم ملی · اطلاعات و بازی‌ها</p></div></header>
        <section className="glass card p-5"><div className="flex items-center gap-4"><div className="h-20 w-20 rounded-3xl bg-white/[.04] grid place-items-center overflow-hidden text-5xl">{logo ? <img src={logo} alt="" className="h-16 w-16 object-contain"/> : team.flag}</div><div><p className="text-xs text-slate-500">تیم ملی</p><h2 className="text-2xl font-black">{team.fa}</h2><p className="text-[10px] text-slate-500 mt-1">{profile?.team?.code || "—"} · {profile?.team?.country || team.name}</p></div></div></section>
        <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><CalendarDays size={16}/> برنامه و نتایج</h2>{upcoming.length ? upcoming.map((m) => <Link key={m.id} href={`/matches/${m.id}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="flex-1"><b className="block text-sm">{m.home}</b><b className="block text-sm mt-1">{m.away}</b></span><span className="text-[10px] text-slate-500">{faTime(m.date)}</span></Link>) : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">بازی آینده‌ای در داده فعلی پیدا نشد.</div>}</section>
        <section className="space-y-2"><h2 className="flex items-center gap-2 text-sm font-black"><Trophy size={16}/> آخرین نتایج</h2>{recent.length ? recent.map((m) => <Link key={m.id} href={`/matches/${m.id}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="flex-1"><b className="block text-sm">{m.home}</b><b className="block text-sm mt-1">{m.away}</b></span><strong>{m.homeScore ?? "—"} - {m.awayScore ?? "—"}</strong></Link>) : <div className="glass rounded-2xl p-5 text-center text-sm text-slate-500">نتیجه‌ای در داده فعلی پیدا نشد.</div>}</section>
      </div>
    </main>
  );
}
