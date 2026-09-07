"use client";

import Link from "next/link";
import { ArrowRight, Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(silent = false) {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "خطا در دریافت اخبار");
      setNews(Array.isArray(data.news) ? data.news : []);
    } catch (e) {
      setError(e.message || "ارتباط با سرویس اخبار برقرار نشد");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  return <main className="fot-shell"><div className="fot-container space-y-5 pb-10">
    <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="بازگشت"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">اخبار فوتبال</h1><p className="text-[11px] text-slate-500">آخرین خبرهای فوتبال جهان</p></div></div><button onClick={() => load(true)} disabled={refreshing} className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""}/></button></header>
    <section className="glass rounded-2xl p-4 flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-emerald-400/10 grid place-items-center"><Newspaper size={20} className="text-emerald-400"/></div><div><b className="text-sm">اتاق خبر FOT10</b><p className="text-[10px] text-slate-500 mt-1">خبرهای تازه از منابع ورزشی</p></div></section>
    {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-200">{error}</div>}
    {loading ? <div className="glass rounded-2xl p-10 text-center text-xs text-slate-500">در حال دریافت اخبار واقعی…</div> : news.length ? <section className="space-y-3">{news.map(item => <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="glass card block rounded-2xl p-4 active:scale-[.99] transition-transform"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] text-emerald-300">{item.tag}</span><span className="text-[9px] text-slate-500">{item.source}</span></div><h2 className="mt-3 text-sm font-black leading-6">{item.title}</h2><div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>{item.publishedAt ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.publishedAt)) : "خبر تازه"}</span><ExternalLink size={14}/></div></a>)}</section> : <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">فعلاً خبری از منابع در دسترس نیست. دوباره تلاش کن.</div>}
  </div></main>;
}
