"use client";

import Link from "next/link";
import { Activity, ArrowRight, Flag, Radio } from "lucide-react";

export default function NationalTeamsPage() {
  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container space-y-4 pb-28">
        <header className="flex items-center gap-3">
          <Link href="/matches" className="glass grid h-11 w-11 shrink-0 place-items-center rounded-2xl" aria-label="بازگشت">
            <ArrowRight size={19} />
          </Link>
          <div>
            <div className="text-[9px] font-black tracking-[.18em] text-emerald-300">NATIONAL MATCHES</div>
            <h1 className="mt-1 text-xl font-black">بازی‌های ملی</h1>
            <p className="mt-1 text-[10px] text-slate-500">مسابقات واقعی تیم‌های ملی داخل مرکز بازی‌ها</p>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[28px] border border-emerald-300/10 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,.18),transparent_35%),linear-gradient(145deg,#101c29,#060b12)] p-5">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Flag size={25} />
            </div>
            <div>
              <h2 className="text-lg font-black">مسابقات ملی منتخب</h2>
              <p className="mt-2 text-[10px] leading-5 text-slate-400">
                بازی‌های ملی بزرگسالان و رده‌های ملی مثل U21، U19 و رقابت‌های بین‌المللی از همان Scope اصلی FOT10 دریافت می‌شوند.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/matches" className="glass rounded-2xl p-4">
            <Activity size={19} className="text-emerald-300" />
            <b className="mt-2 block text-sm">مرکز بازی‌ها</b>
            <p className="mt-1 text-[9px] text-slate-500">۱۰ لیگ منتخب + تیم‌های ملی</p>
          </Link>
          <Link href="/matches?live=1" className="glass rounded-2xl p-4">
            <Radio size={19} className="text-red-300" />
            <b className="mt-2 block text-sm">نتایج زنده</b>
            <p className="mt-1 text-[9px] text-slate-500">فقط بازی‌های زنده داخل Scope</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
