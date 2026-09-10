"use client";

import { BarChart3, ChevronLeft, Medal, Search, Settings, Shield, Trophy, Users } from "lucide-react";
import Link from "next/link";
import HomeMatchdayHub from "./components/HomeMatchdayHub";
import HomeNews from "./components/HomeNews";

const quickNav = [
  ["نتایج زنده", Trophy, "/matches?live=1"],
  ["لیگ‌ها", Trophy, "/leagues"],
  ["تیم ملی", Shield, "/national-teams"],
  ["بازیکنان", Users, "/players"],
  ["آمار", BarChart3, "/stats"],
  ["برترین‌های ماه", Medal, "/players"],
  ["تنظیمات", Settings, "/settings"],
];

export default function HomePage() {
  return (
    <main className="fot-container pb-28" dir="rtl">
      <header className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#07101d] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_95%_100%,rgba(16,185,129,.12),transparent_30%)]" />
        <div className="relative p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-[18px] font-black italic text-slate-950 shadow-[0_8px_28px_rgba(34,211,238,.18)]">10</div>
              <div className="min-w-0">
                <div className="text-xl font-black tracking-tight text-white">FOT<span className="text-cyan-300">10</span></div>
                <div className="text-[8px] font-bold text-slate-500">رسانه و نبض زنده فوتبال</div>
              </div>
            </Link>
            <Link href="/search" aria-label="جستجو" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300 transition hover:bg-white/[.08]">
              <Search size={17} />
            </Link>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div className="max-w-[520px]">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-black text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> فوتبال، همین حالا
              </div>
              <h1 className="text-[25px] font-black leading-[1.25] tracking-tight text-white sm:text-[30px]">همه فوتبال، یک‌جا</h1>
              <p className="mt-2 text-[10px] font-bold leading-5 text-slate-400">خبر، نتیجه، بازی زنده، لیگ، آمار و بازیکن؛ سریع و ساده، با تمرکز روی چیزی که برای هوادار مهم است.</p>
            </div>
            <div className="hidden select-none text-[92px] font-black italic leading-none text-white/[.035] sm:block">360</div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 border-t border-white/10 bg-black/10">
          <Link href="/matches" className="flex items-center justify-center gap-1.5 py-3 text-[9px] font-black text-slate-300 transition hover:bg-white/[.04]">بازی‌ها <ChevronLeft size={12} /></Link>
          <Link href="/leagues" className="flex items-center justify-center gap-1.5 border-x border-white/10 py-3 text-[9px] font-black text-slate-300 transition hover:bg-white/[.04]">رقابت‌ها <ChevronLeft size={12} /></Link>
          <Link href="/players" className="flex items-center justify-center gap-1.5 py-3 text-[9px] font-black text-slate-300 transition hover:bg-white/[.04]">بازیکنان <ChevronLeft size={12} /></Link>
        </div>
      </header>

      <HomeMatchdayHub />
      <HomeNews />

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-black text-white">فوتبال را انتخاب کن</h2>
            <p className="mt-1 text-[9px] font-bold text-slate-600">دسترسی سریع به بخش‌های اصلی</p>
          </div>
          <Link href="/settings" className="text-[8px] font-black text-cyan-300">شخصی‌سازی</Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickNav.map(([label, Icon, href], index) => (
            <Link key={label} href={href} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1422] p-3 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-[#0d1928] active:scale-[.98]">
              <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-cyan-400/5 blur-2xl" />
              <div className="relative flex items-center gap-2.5">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${index === 0 ? "border-red-300/20 bg-red-400/10 text-red-300" : index === 1 ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/[.04] text-slate-300"}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] font-black text-slate-100">{label}</div>
                  <div className="mt-1 text-[7px] font-bold text-slate-600">مشاهده</div>
                </div>
                <ChevronLeft size={13} className="shrink-0 text-slate-700 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
