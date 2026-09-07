import Link from "next/link";
import { ArrowRight, Newspaper, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const news = [
  { id: "football-center", title: "مرکز اخبار FOT10 به‌زودی با اخبار واقعی فوتبال تکمیل می‌شود", tag: "FOT10", text: "این بخش برای نمایش اخبار تازه فوتبال و اتفاقات مهم دنیای شماره ۱۰ آماده شده است." },
  { id: "live-football", title: "مرکز مسابقات زنده FOT10 فعال شد", tag: "مسابقات", text: "نتایج، زمان بازی‌ها و وضعیت مسابقات از منبع داده فوتبال در مرکز مسابقات نمایش داده می‌شود." },
  { id: "golden-ten", title: "۱۰ طلایی؛ خانه ستاره‌های شماره ۱۰", tag: "۱۰ طلایی", text: "پروفایل ستاره‌ها، تیم‌ها و آمار بازیکنان شماره ۱۰ در حال توسعه است." },
];

export default function NewsPage() {
  return <main className="fot-shell"><div className="fot-container space-y-5 pb-10">
    <header className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="بازگشت"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">اخبار فوتبال</h1><p className="text-[11px] text-slate-500">تازه‌ترین مطالب FOT10</p></div></header>
    <section className="glass rounded-2xl p-4 flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-emerald-400/10 grid place-items-center"><Newspaper size={20} className="text-emerald-400"/></div><div><b className="text-sm">اتاق خبر FOT10</b><p className="text-[10px] text-slate-500 mt-1">اخبار، تحلیل و داستان‌های فوتبال</p></div></section>
    <section className="space-y-3">{news.map((item) => <article key={item.id} className="glass card rounded-2xl p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] text-emerald-300">{item.tag}</span><ChevronLeft size={15} className="text-slate-600"/></div><h2 className="mt-4 text-sm font-black leading-6">{item.title}</h2><p className="mt-2 text-[11px] leading-5 text-slate-500">{item.text}</p></article>)}</section>
  </div></main>;
}
