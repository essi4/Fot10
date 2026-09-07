"use client";

import { Bell, ChevronLeft, Clock3, Flame, Trophy, Zap } from "lucide-react";
import Link from "next/link";

const notifications = [
  { id: 1, type: "live", title: "بازی داغ شروع شد", text: "یک مسابقه از تیم‌های محبوبت در حال برگزاری است.", time: "اکنون", icon: Flame, tone: "text-orange-300 bg-orange-400/10" },
  { id: 2, type: "match", title: "یادآوری مسابقه", text: "۱۵ دقیقه تا شروع یک مسابقه مهم باقی مانده است.", time: "۱۵ دقیقه پیش", icon: Trophy, tone: "text-emerald-300 bg-emerald-400/10" },
  { id: 3, type: "news", title: "خبر فوری فوتبال", text: "یک خبر جدید در مرکز اخبار FOT10 منتشر شد.", time: "۳۵ دقیقه پیش", icon: Zap, tone: "text-cyan-300 bg-cyan-400/10" },
];

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="fot-container pb-12">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2">
            <ChevronLeft size={16} /> بازگشت
          </Link>
          <div className="text-right">
            <div className="text-[10px] text-emerald-300 font-black tracking-widest">FOT10</div>
            <h1 className="text-xl font-black">اعلان‌ها</h1>
          </div>
        </header>

        <section className="glass card p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center">
              <Bell size={22} />
            </div>
            <div>
              <h2 className="font-black">مرکز اعلان FOT10</h2>
              <p className="text-xs text-slate-400 mt-1">نتایج، بازی‌های مهم و خبرهای شخصی‌سازی‌شده را از دست نده.</p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="font-black">آخرین اعلان‌ها</h2>
          <span className="text-[10px] text-slate-500">دمو • آماده اتصال به Push</span>
        </div>

        <section className="mt-3 space-y-3">
          {notifications.map(({ id, title, text, time, icon: Icon, tone }) => (
            <article key={id} className="glass card p-4 active:scale-[.99] transition-transform">
              <div className="flex gap-3">
                <div className={`h-11 w-11 shrink-0 rounded-2xl grid place-items-center ${tone}`}><Icon size={19} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm">{title}</h3>
                    <span className="text-[9px] text-slate-500 whitespace-nowrap inline-flex items-center gap-1"><Clock3 size={11} />{time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-6 mt-1">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="glass rounded-2xl p-4 mt-5 text-center">
          <p className="text-[11px] text-slate-500 leading-6">اعلان‌های واقعی بعد از اتصال سرویس Push و منبع داده زنده فعال می‌شوند؛ هیچ نتیجه زنده‌ای در این صفحه جعل نمی‌شود.</p>
        </div>
      </div>
    </main>
  );
}
