"use client";

import Link from "next/link";
import { Bell, ChevronLeft, Globe2, Info, LockKeyhole, Moon, Palette, ShieldCheck, SlidersHorizontal, Smartphone, UserRound } from "lucide-react";

const items = [
  { title: "اعلان‌ها", desc: "مدیریت خبرها و هشدارهای مسابقات", icon: Bell, href: "/notifications", tone: "emerald" },
  { title: "ظاهر برنامه", desc: "حالت نمایش و تجربه بصری FOT10", icon: Palette, href: "#appearance", tone: "cyan" },
  { title: "تنظیمات مسابقات", desc: "کنترل نمایش نتایج و مسابقات مورد علاقه", icon: SlidersHorizontal, href: "/matches", tone: "yellow" },
  { title: "زبان", desc: "فارسی · زبان پیش‌فرض FOT10", icon: Globe2, href: "#language", tone: "violet" },
  { title: "حریم خصوصی", desc: "مدیریت اطلاعات و دسترسی‌های حساب", icon: LockKeyhole, href: "#privacy", tone: "blue" },
];

export default function SettingsPage() {
  return (
    <main className="fot-container min-h-screen pb-10">
      <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#10251e] via-[#0b1517] to-[#080c15] p-5 shadow-2xl">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-slate-300"><ChevronLeft size={19} /></Link>
          <div className="text-right"><p className="text-[9px] font-black tracking-widest text-emerald-300">FOT10 · CONTROL CENTER</p><h1 className="mt-1 text-2xl font-black">تنظیمات</h1></div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"><SlidersHorizontal size={21} /></div>
        </div>
        <p className="relative mt-4 text-[10px] leading-5 text-slate-400">همه تنظیمات مهم FOT10، مرتب و سریع در یکجا.</p>
      </header>

      <section className="mt-4 space-y-2.5">
        {items.map(({ title, desc, icon: Icon, href, tone }) => (
          <Link key={title} href={href} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3.5 shadow-lg transition hover:border-emerald-300/20 hover:bg-white/[.055] active:scale-[.99]">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-${tone}-300/15 bg-${tone}-400/10 text-${tone}-300`}><Icon size={19} /></div>
            <div className="min-w-0 flex-1 text-right"><div className="text-[11px] font-black text-slate-100">{title}</div><div className="mt-1 truncate text-[8px] font-bold text-slate-600">{desc}</div></div>
            <ChevronLeft size={15} className="text-slate-700 transition-transform group-hover:-translate-x-1" />
          </Link>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <div id="appearance" className="rounded-2xl border border-white/10 bg-white/[.025] p-3.5"><div className="flex items-center gap-2"><Moon size={16} className="text-cyan-300" /><span className="text-[10px] font-black">حالت فعلی</span></div><p className="mt-2 text-[9px] font-bold text-slate-500">تیره · مناسب شب</p></div>
        <div id="language" className="rounded-2xl border border-white/10 bg-white/[.025] p-3.5"><div className="flex items-center gap-2"><Globe2 size={16} className="text-emerald-300" /><span className="text-[10px] font-black">زبان</span></div><p className="mt-2 text-[9px] font-bold text-slate-500">فارسی</p></div>
      </section>

      <section id="privacy" className="mt-4 rounded-2xl border border-emerald-300/10 bg-emerald-400/[.035] p-4">
        <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-emerald-300" /><div><h2 className="text-[11px] font-black">حریم خصوصی</h2><p className="mt-1 text-[8px] font-bold text-slate-600">اطلاعات حساب و تنظیمات شما تحت کنترل خودتان است.</p></div></div>
      </section>

      <footer className="mt-5 flex items-center justify-center gap-2 text-[8px] font-bold text-slate-700"><Smartphone size={12} /> FOT10 <span>•</span> <Info size={12} /> مرکز کنترل برنامه</footer>
    </main>
  );
}
