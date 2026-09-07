"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Crown, Search, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

const leagues = [
  { name: "لیگ برتر ایران", country: "ایران", icon: "🏆", slug: "iran" },
  { name: "لیگ قهرمانان اروپا", country: "اروپا", icon: "⭐", slug: "ucl" },
  { name: "جام جهانی", country: "تیم‌های ملی", icon: "🌍", slug: "world-cup" },
  { name: "جام ملت‌های آسیا", country: "آسیا · تیم‌های ملی", icon: "🏆", slug: "asian-cup" },
  { name: "مقدماتی جام جهانی آسیا", country: "آسیا · تیم‌های ملی", icon: "🌏", slug: "world-cup-qualifiers-asia" },
  { name: "AFC Champions League Elite", country: "آسیا · باشگاهی", icon: "👑", slug: "afc-champions-league" },
  { name: "AFC Champions League Two", country: "آسیا · باشگاهی", icon: "🏆", slug: "afc-champions-league-two" },
  { name: "AFC Challenge League", country: "آسیا · باشگاهی", icon: "⚽", slug: "afc-challenge-league" },
  { name: "AFC U20 Asian Cup", country: "آسیا · جوانان", icon: "🌟", slug: "afc-u20" },
  { name: "AFC U17 Asian Cup", country: "آسیا · نوجوانان", icon: "⭐", slug: "afc-u17" },
  { name: "AFC Women's Champions League", country: "آسیا · زنان", icon: "👑", slug: "afc-womens-champions-league" },
  { name: "Asian Cup Women", country: "آسیا · تیم‌های ملی زنان", icon: "🏆", slug: "asian-cup-women" },
  { name: "Premier League", country: "انگلیس", icon: "🏴", slug: "premier-league" },
  { name: "LaLiga", country: "اسپانیا", icon: "🇪🇸", slug: "laliga" },
  { name: "Bundesliga", country: "آلمان", icon: "🇩🇪", slug: "bundesliga" },
  { name: "Serie A", country: "ایتالیا", icon: "🇮🇹", slug: "serie-a" },
  { name: "Ligue 1", country: "فرانسه", icon: "🇫🇷", slug: "ligue-1" },
  { name: "Eredivisie", country: "هلند", icon: "🇳🇱", slug: "eredivisie" },
  { name: "Primeira Liga", country: "پرتغال", icon: "🇵🇹", slug: "primeira-liga" },
  { name: "Saudi Pro League", country: "عربستان", icon: "🇸🇦", slug: "saudi-pro-league" },
  { name: "Süper Lig", country: "ترکیه", icon: "🇹🇷", slug: "super-lig" },
  { name: "Qatar Stars League", country: "قطر", icon: "🇶🇦", slug: "qatar-stars-league" },
  { name: "UAE Pro League", country: "امارات", icon: "🇦🇪", slug: "uae-pro-league" },
  { name: "J1 League", country: "ژاپن", icon: "🇯🇵", slug: "j1-league" },
  { name: "K League 1", country: "کره جنوبی", icon: "🇰🇷", slug: "k-league-1" },
  { name: "Chinese Super League", country: "چین", icon: "🇨🇳", slug: "chinese-super-league" },
  { name: "A-League Men", country: "استرالیا", icon: "🇦🇺", slug: "a-league" },
  { name: "Brasileirão Série A", country: "برزیل", icon: "🇧🇷", slug: "brasileirao" },
  { name: "Liga Profesional", country: "آرژانتین", icon: "🇦🇷", slug: "liga-profesional" },
  { name: "MLS", country: "آمریکا", icon: "🇺🇸", slug: "mls" },
  { name: "Liga MX", country: "مکزیک", icon: "🇲🇽", slug: "liga-mx" },
];

export default function LeaguesPage() {
  const [query, setQuery] = useState("");
  const filteredLeagues = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return leagues;
    return leagues.filter((league) => `${league.name} ${league.country}`.toLowerCase().includes(value));
  }, [query]);

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">لیگ‌ها و رقابت‌ها</h1><p className="text-[11px] text-slate-500">باشگاهی · تیم‌های ملی · آسیا · جهان</p></div>
        </header>
        <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none" placeholder="جستجوی لیگ، کشور یا رقابت..." aria-label="جستجوی لیگ" /></div>
        <Link href="/leagues/ucl" className="glass card p-5 relative overflow-hidden block active:scale-[.99] transition-transform"><Crown className="absolute left-4 top-4 text-yellow-400/50" /><p className="text-xs text-slate-400">لیگ منتخب</p><h2 className="text-2xl font-black mt-1">لیگ قهرمانان اروپا</h2><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/[.04] p-3"><b>۳۶</b><p className="text-[9px] text-slate-500 mt-1">تیم</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>زنده</b><p className="text-[9px] text-slate-500 mt-1">نتایج</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>کامل</b><p className="text-[9px] text-slate-500 mt-1">پوشش</p></div></div></Link>
        <section className="space-y-2">{filteredLeagues.map((league) => <Link key={league.slug} href={`/leagues/${league.slug}`} className="glass w-full rounded-2xl p-4 flex items-center gap-3 text-right active:scale-[.99] transition-transform"><span className="h-11 w-11 rounded-2xl bg-white/[.04] grid place-items-center text-xl">{league.icon}</span><span className="flex-1"><b className="block text-sm">{league.name}</b><small className="text-[10px] text-slate-500">{league.country} · جدول · نتایج · برنامه</small></span><Trophy size={16} className="text-slate-600" /><ChevronLeft size={16} className="text-slate-600" /></Link>)}{filteredLeagues.length === 0 && <div className="glass rounded-2xl p-6 text-center text-sm text-slate-500">رقابتی با این نام پیدا نشد.</div>}</section>
      </div>
    </main>
  );
}
