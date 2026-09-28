"use client";

import Link from "next/link";
import { Activity, Heart, Radio, Shield, ChevronLeft } from "lucide-react";
import HomeMatchdayHub from "./components/HomeMatchdayHub";

const core = [
  { title: "Match Visualization", fa: "نمایش زنده بازی", desc: "رویدادهای واقعی مسابقه", icon: Activity, href: "/matches/visualization", tone: "cyan" },
  { title: "۱۰ لیگ منتخب", fa: "لیگ‌های اصلی", desc: "به‌علاوه تیم‌های ملی بزرگسالان", icon: Shield, href: "/matches", tone: "emerald" },
  { title: "نتایج زنده", fa: "نبض فوتبال", desc: "فقط مسابقات داخل محدوده FOT10", icon: Radio, href: "/matches?live=1", tone: "red" },
  { title: "علاقه‌مندی", fa: "بازی‌های محبوب", desc: "دسترسی سریع به انتخاب‌های شما", icon: Heart, href: "/favorites", tone: "violet" },
];

export default function HomePage() {
  return (
    <main className="fot-shell min-h-screen" dir="rtl">
      <div className="fot-container space-y-4 pb-28">
        <header className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#06101c] shadow-[0_24px_80px_rgba(0,0,0,.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,.18),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,.13),transparent_35%)]" />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-lg font-black italic text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,.2)]">10</div>
                <div>
                  <div className="text-2xl font-black tracking-tight text-white">FOT<span className="text-cyan-300">10</span></div>
                  <div className="text-[9px] font-bold text-slate-500">فوتبال واقعی، ساده و سریع</div>
                </div>
              </div>
              <div className="rounded-full border border-emerald-300/15 bg-emerald-400/5 px-3 py-1.5 text-[8px] font-black text-emerald-300">۱۰ لیگ + تیم ملی</div>
            </div>
            <div className="mt-8">
              <div className="mb-2 flex items-center gap-2 text-[9px] font-black tracking-wide text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" /> MATCH CENTER
              </div>
              <h1 className="text-[27px] font-black leading-tight tracking-tight text-white sm:text-[34px]">چهار قابلیت، یک مرکز فوتبال</h1>
              <p className="mt-3 max-w-xl text-[11px] font-bold leading-6 text-slate-400">
                ۱۰ لیگ منتخب، تیم‌های ملی بزرگسالان، نتایج زنده، علاقه‌مندی و Match Visualization؛ بدون کاتالوگ‌های اضافی.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {core.map(({ title, fa, desc, icon: Icon, href, tone }) => (
            <Link key={title} href={href} className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#091421] p-4 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-white/20 active:scale-[.98]">
              <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-cyan-300/5 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.045] text-cyan-300"><Icon size={19} /></span>
                  <ChevronLeft size={14} className="text-slate-700 transition-transform group-hover:-translate-x-1" />
                </div>
                <div className="mt-4 text-[10px] font-black text-cyan-200">{title}</div>
                <div className="mt-1 text-sm font-black text-white">{fa}</div>
                <p className="mt-1.5 text-[8px] font-bold leading-4 text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </section>

        <HomeMatchdayHub />
      </div>
    </main>
  );
}
