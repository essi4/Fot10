"use client";

import Link from "next/link";
import { Activity, Heart, Radio, Shield, ChevronLeft } from "lucide-react";
import HomeMatchdayHub from "./components/HomeMatchdayHub";

const core = [
  { title: "Match Visualization", fa: "نمایش زنده بازی", desc: "رویدادهای واقعی مسابقه", icon: Activity, href: "/matches/visualization" },
  { title: "فوتبال منتخب", fa: "لیگ‌ها و تیم‌های ملی", desc: "لیگ‌های منتخب و تیم‌های ملی بزرگسالان", icon: Shield, href: "/matches" },
  { title: "نتایج زنده", fa: "نتایج مسابقات", desc: "فقط مسابقات داخل محدوده FOT10", icon: Radio, href: "/matches?live=1" },
  { title: "علاقه‌مندی", fa: "بازی‌های ذخیره‌شده", desc: "دسترسی سریع به انتخاب‌های شما", icon: Heart, href: "/favorites" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950" dir="rtl">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-28 pt-3 sm:px-5 sm:pt-5">
        <header className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,.07)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-slate-900" />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-sm font-black italic text-white">10</div>
                <div>
                  <div className="text-2xl font-black tracking-tight text-slate-950">FOT10</div>
                  <div className="text-[9px] font-bold text-slate-500">Football Data · Match Center</div>
                </div>
              </div>
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[8px] font-black text-slate-600 sm:block">
                فوتبال منتخب
              </div>
            </div>
            <div className="mt-7">
              <div className="mb-2 text-[9px] font-black tracking-[.14em] text-slate-500">MATCH CENTER</div>
              <h1 className="text-[28px] font-black leading-tight tracking-tight text-slate-950 sm:text-[36px]">مرکز فوتبال</h1>
              <p className="mt-3 max-w-2xl text-[11px] font-bold leading-6 text-slate-500">
                فوتبال منتخب، لیگ‌های منتخب و تیم‌های ملی بزرگسالان؛ نتایج، اتفاقات مسابقه و Match Visualization در یک مرکز ساده و ورزشی.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {core.map(({ title, fa, desc, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 active:scale-[.98]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Icon size={18} /></span>
                <ChevronLeft size={14} className="text-slate-300 transition-transform group-hover:-translate-x-1" />
              </div>
              <div className="mt-4 text-[10px] font-black text-slate-500">{title}</div>
              <div className="mt-1 text-sm font-black text-slate-950">{fa}</div>
              <p className="mt-1.5 text-[8px] font-bold leading-4 text-slate-400">{desc}</p>
            </Link>
          ))}
        </section>

        <HomeMatchdayHub />
      </div>
    </main>
  );
}
