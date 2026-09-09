"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, ExternalLink, Newspaper, RefreshCw } from "lucide-react";

const fa = (value) => String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const NEWS_TTL = 60 * 60 * 1000;

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "همین حالا";
  if (minutes < 60) return `${fa(minutes)} دقیقه پیش`;
  return `${fa(Math.floor(minutes / 60))} ساعت پیش`;
}

function isFresh(item) {
  const time = new Date(item?.publishedAt).getTime();
  return Number.isFinite(time) && Date.now() - time <= NEWS_TTL && Date.now() - time >= -5 * 60 * 1000;
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
      const response = await fetch(`/api/news?t=${Date.now()}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error("news");
      setNews((Array.isArray(json.news) ? json.news : []).filter(isFresh));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNews((items) => items.filter(isFresh)), 30 * 1000);
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
            <h2 className="text-xl font-black">خبر روز فوتبال</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-600">فقط خبرهای فوتبال؛ تازه، تصویری و حداکثر تا ۶۰ دقیقه</p>
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
              {item.image ? (
                <div className="home-news-image-wrap">
                  <img src={item.image} alt="" className="home-news-image" loading={index < 2 ? "eager" : "lazy"} referrerPolicy="no-referrer" />
                  <span className="home-news-fresh">تازه</span>
                </div>
              ) : null}
              <div className="home-news-card-top">
                <span className="home-news-source" style={{ "--source-color": item.color || "#22c55e" }}>{item.source}</span>
                <span className="home-news-time">{relativeTime(item.publishedAt)}</span>
              </div>
              <h3>{item.title}</h3>
              {item.description ? <p>{item.description}</p> : null}
              <div className="home-news-meta">
                <span><CalendarDays size={12} /> {formatDate(item.publishedAt)}</span>
                <span><Clock3 size={12} /> {formatTime(item.publishedAt)}</span>
              </div>
              <div className="home-news-more">مشاهده خبر <ExternalLink size={13} /></div>
            </a>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-7 text-center">
          <div className="text-sm font-black">در ۶۰ دقیقه اخیر خبر فوتبالی تازه‌ای پیدا نشد</div>
          <p className="mt-2 text-[10px] font-bold text-slate-600">منابع به‌صورت خودکار هر دقیقه بررسی می‌شوند.</p>
          <button onClick={() => load(false)} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-[10px] font-black text-slate-950">بررسی دوباره</button>
        </div>
      )}
    </section>
  );
}
