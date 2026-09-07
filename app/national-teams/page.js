import Link from "next/link";
import { ArrowRight, ChevronLeft, Flag, Search, Trophy } from "lucide-react";

const teams = [
  { slug: "iran", name: "ایران", code: "IRN", flag: "🇮🇷", teamId: 19 },
  { slug: "japan", name: "ژاپن", code: "JPN", flag: "🇯🇵", teamId: 12 },
  { slug: "south-korea", name: "کره جنوبی", code: "KOR", flag: "🇰🇷", teamId: 17 },
  { slug: "saudi-arabia", name: "عربستان", code: "KSA", flag: "🇸🇦", teamId: 23 },
  { slug: "qatar", name: "قطر", code: "QAT", flag: "🇶🇦", teamId: 156 },
  { slug: "australia", name: "استرالیا", code: "AUS", flag: "🇦🇺", teamId: 20 },
  { slug: "france", name: "فرانسه", code: "FRA", flag: "🇫🇷", teamId: 2 },
  { slug: "england", name: "انگلیس", code: "ENG", flag: "🏴", teamId: 10 },
  { slug: "spain", name: "اسپانیا", code: "ESP", flag: "🇪🇸", teamId: 9 },
  { slug: "germany", name: "آلمان", code: "GER", flag: "🇩🇪", teamId: 25 },
  { slug: "italy", name: "ایتالیا", code: "ITA", flag: "🇮🇹", teamId: 768 },
  { slug: "brazil", name: "برزیل", code: "BRA", flag: "🇧🇷", teamId: 6 },
  { slug: "argentina", name: "آرژانتین", code: "ARG", flag: "🇦🇷", teamId: 26 },
  { slug: "portugal", name: "پرتغال", code: "POR", flag: "🇵🇹", teamId: 27 },
  { slug: "netherlands", name: "هلند", code: "NED", flag: "🇳🇱", teamId: 1118 },
  { slug: "turkey", name: "ترکیه", code: "TUR", flag: "🇹🇷", teamId: 777 },
  { slug: "usa", name: "آمریکا", code: "USA", flag: "🇺🇸", teamId: 20 },
];

export const dynamic = "force-dynamic";

export default function NationalTeamsPage() {
  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="بازگشت"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">تیم‌های ملی</h1><p className="text-[11px] text-slate-500">کشورها · بازی‌ها · نتایج · بازیکنان</p></div>
        </header>
        <div className="glass rounded-2xl p-4 flex items-center gap-3"><Flag className="text-emerald-400" size={20}/><div><b className="text-sm">مرکز تیم‌های ملی</b><p className="text-[10px] text-slate-500 mt-1">تیم موردنظرت را انتخاب کن</p></div></div>
        <section className="grid grid-cols-2 gap-2">
          {teams.map((team) => <Link key={team.slug} href={`/national-teams/${team.slug}`} className="glass rounded-2xl p-4 flex items-center gap-3 active:scale-[.98] transition-transform"><span className="text-3xl">{team.flag}</span><span className="flex-1 min-w-0"><b className="block text-sm truncate">{team.name}</b><small className="text-[10px] text-slate-500">{team.code} · بازی‌ها</small></span><ChevronLeft size={15} className="text-slate-600" /></Link>)}
        </section>
      </div>
    </main>
  );
}
