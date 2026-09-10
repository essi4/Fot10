"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Heart, RefreshCw, Shield } from "lucide-react";

const TEAM_META = {
  "پرسپولیس": { id: 154 },
  "رئال مادرید": { id: 541 },
  "بارسلونا": { id: 529 },
  "آرسنال": { id: 42 },
  "بایرن مونیخ": { id: 157 },
  "منچسترسیتی": { id: 50 },
};

function fa(value) { return String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]); }
function ago(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 2) return "همین حالا";
  if (minutes < 60) return `${fa(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${fa(hours)} ساعت پیش`;
  return `${fa(Math.floor(hours / 24))} روز پیش`;
}

function TeamCrest({ team }) {
  const [failed, setFailed] = useState(false);
  const id = TEAM_META[team]?.id;
  const src = id ? `https://media.api-sports.io/football/teams/${id}.png` : "";
  return <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/[.06] border border-white/10 grid place-items-center overflow-hidden">
    {!failed && src ? <img src={src} alt={`لوگوی ${team}`} className="h-8 w-8 object-contain" loading="lazy" onError={() => setFailed(true)} /> : <Shield size={19} className="text-emerald-300" />}
  </div>;
}

export default function FavoriteTeamNews({ teams = [] }) {
  const selected = teams.slice(0, 5);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!selected.length) { setItems({}); return; }
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const results = await Promise.all(selected.map(async (team) => {
        try {
          const res = await fetch(`/api/team-news?team=${encodeURIComponent(team)}&t=${Date.now()}`, { cache: "no-store" });
          const json = await res.json();
          return [team, Array.isArray(json.news) ? json.news.slice(0, 5) : []];
        } catch { return [team, []]; }
      }));
      setItems(Object.fromEntries(results));
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(false); }, [selected.join("|")]);
  useEffect(() => {
    const timer = setInterval(() => load(true), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [selected.join("|")]);

  if (!selected.length) return null;
  return <section className="glass card p-5" dir="rtl">
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-2xl bg-rose-400/10 grid place-items-center"><Heart size={18} className="text-rose-300" /></div><div><h2 className="font-black">اخبار تیم‌های محبوب</h2><p className="text-[10px] text-slate-500 mt-1">هر تیم ستون مستقل خودش را دارد • ۵ خبر آخر مرتبط</p></div></div>
      <button onClick={() => load(true)} disabled={refreshing} className="glass h-9 w-9 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /></button>
    </div>
    {loading ? <div className="grid gap-3 md:grid-cols-2">{selected.map((team) => <div key={team} className="rounded-2xl bg-white/[.03] h-40 animate-pulse" />)}</div> : <div className="space-y-5">{selected.map((team) => <TeamNews key={team} team={team} news={items[team] || []} />)}</div>}
  </section>;
}

function TeamNews({ team, news }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3">
    <div className="flex items-center gap-3 mb-3"><TeamCrest team={team}/><div className="min-w-0 flex-1"><div className="font-black text-sm truncate">{team}</div><div className="text-[9px] text-slate-600 mt-1">{fa(news.length)} خبر مرتبط</div></div><span className="text-[9px] text-emerald-300 font-black">TOP 5</span></div>
    {news.length ? <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{news.map((item) => <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="group rounded-xl border border-white/5 bg-black/10 overflow-hidden hover:bg-white/[.05] transition">
      {item.image ? <img src={`/api/news/image?url=${encodeURIComponent(item.image)}`} alt="" className="h-28 w-full object-cover" loading="lazy" /> : <div className="h-28 bg-white/[.03] grid place-items-center"><Shield size={22} className="text-slate-700" /></div>}
      <div className="p-3"><div className="text-[9px] text-emerald-300 font-bold">{item.source} · {ago(item.publishedAt)}</div><h3 className="mt-1.5 text-xs font-black leading-5 line-clamp-2 group-hover:text-emerald-300">{item.title}</h3><div className="mt-2 flex items-center justify-between text-[9px] text-slate-600"><span>خبر مرتبط با تیم</span><ExternalLink size={11} /></div></div>
    </a>)}</div> : <div className="rounded-xl bg-white/[.025] p-4 text-center text-[10px] text-slate-500">فعلاً خبر قابل‌تأییدی برای این تیم پیدا نشد.</div>}
  </div>;
}
