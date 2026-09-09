"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";

const fa = (value) => String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

function relativeTime(value) {
  if (!value) return "تازه";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "تازه";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "همین حالا";
  if (minutes < 60) return `${fa(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${fa(hours)} ساعت پیش`;
  return `${fa(Math.floor(hours / 24))} روز پیش`;
}

export default function HomeNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setFailed(false);
    try {
      const response = await fetch("/api/news", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error("news");
      setNews(Array.isArray(json.news) ? json.news : []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="home-news mt-6" dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-yellow-300/20 bg-yellow-300/10 text-yellow-300 shadow-lg">
            <Newspaper size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black">خبر روز</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-600">تازه‌ترین خبرهای ورزشی ایران و جهان</p>
          </div>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="glass grid h-10 w-10 place-items-center rounded-xl" aria-label="به‌روزرسانی خبرها">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="home-news-grid">
          {[1, 2, 3, 4].map((item) => <div key={item} className="home-news-skeleton glass rounded-2xl" />)}
        </div>
      ) : news.length ? (
        <div className="home-news-grid">
          {news.map((item, index) => (
            <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className={`home-news-card glass group ${index === 0 ? "home-news-featured" : ""}`}>
              <div className="home-news-card-top">
                <span className="home-news-source" style={{ "--source-color": item.color || "#22c55e" }}>{item.source}</span>
                <span className="home-news-time">{relativeTime(item.publishedAt)}</span>
              </div>
              <h3>{item.title}</h3>
              {item.description ? <p>{item.description}</p> : null}
              <div className="home-news-more">مشاهده خبر <ExternalLink size={13} /></div>
            </a>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-7 text-center">
          <div className="text-sm font-black">خبرها فعلاً در دسترس نیستند</div>
          <p className="mt-2 text-[10px] font-bold text-slate-600">{failed ? "اتصال به منابع خبری برقرار نشد؛ دوباره تلاش کن." : "هنوز خبری دریافت نشده است."}</p>
          <button onClick={() => load(false)} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-[10px] font-black text-slate-950">تلاش دوباره</button>
        </div>
      )}
    </section>
  );
}
