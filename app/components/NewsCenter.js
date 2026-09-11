"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, Flame, Globe2, Heart, Newspaper, RefreshCw, Search, Users } from "lucide-react";

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "iran", label: "ایران" },
  { id: "world", label: "جهان" },
  { id: "perspolis", label: "پرسپولیس", query: "پرسپولیس" },
  { id: "esteghlal", label: "استقلال", query: "استقلال" },
  { id: "national", label: "تیم ملی", query: "تیم ملی" },
];

const fa = (value) => String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const normalize = (value = "") => String(value).toLowerCase().replace(/[يى]/g, "ی").replace(/[ك]/g, "ک").replace(/‌/g, " ").replace(/\s+/g, " ").trim();

function readFavorites() {
  try {
    const profile = JSON.parse(localStorage.getItem("fot10-profile") || "{}");
    return {
      teams: Array.isArray(profile.favorites) ? profile.favorites : [],
      leagues: Array.isArray(profile.favoriteLeagues) ? profile.favoriteLeagues : [],
    };
  } catch {
    return { teams: [], leagues: [] };
  }
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 2) return "همین حالا";
  if (minutes < 60) return `${fa(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${fa(hours)} ساعت پیش`;
  return `${fa(Math.floor(hours / 24))} روز پیش`;
}

function imageUrl(item) {
  return item?.image ? `/api/news/image?url=${encodeURIComponent(item.image)}` : "";
}

function isIran(item) {
  const text = `${item?.title || ""} ${item?.description || ""}`;
  return /ایران|استقلال|پرسپولیس|تراکتور|سپاهان|فولاد|ذوب|ملوان|تیم ملی|جام حذفی|لیگ برتر/.test(text);
}

function dedupe(items) {
  return items.filter((item, index, all) => all.findIndex((other) => normalize(other.title) === normalize(item.title)) === index);
}

export default function NewsCenter() {
  const [allNews, setAllNews] = useState([]);
  const [personalNews, setPersonalNews] = useState([]);
  const [favorites, setFavorites] = useState({ teams: [], leagues: [] });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const syncFavorites = () => setFavorites(readFavorites());

  const loadPersonal = async (current = readFavorites()) => {
    const teams = current.teams.slice(0, 6);
    const leagues = current.leagues.slice(0, 8);
    if (!teams.length && !leagues.length) {
      setPersonalNews([]);
      return;
    }
    setPersonalLoading(true);
    try {
      const teamResults = await Promise.all(teams.map(async (team) => {
        try {
          const response = await fetch(`/api/team-news?team=${encodeURIComponent(team)}&t=${Date.now()}`, { cache: "no-store" });
          const json = await response.json();
          return Array.isArray(json.news) ? json.news.map((item) => ({ ...item, favoriteKind: "team", favoriteName: team })) : [];
        } catch { return []; }
      }));
      const favoriteLeagueNews = allNews
        .filter((item) => {
          const text = normalize(`${item.title || ""} ${item.description || ""}`);
          return leagues.some((league) => text.includes(normalize(league)));
        })
        .map((item) => ({ ...item, favoriteKind: "league", favoriteName: leagues.find((league) => normalize(`${item.title || ""} ${item.description || ""}`).includes(normalize(league))) }));
      const merged = dedupe([...teamResults.flat(), ...favoriteLeagueNews]).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 12);
      setPersonalNews(merged);
    } finally {
      setPersonalLoading(false);
    }
  };

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/news?limit=18&t=${Date.now()}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error("news");
      const news = Array.isArray(json.news) ? json.news : [];
      setAllNews(news);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const current = readFavorites();
    setFavorites(current);
    load(false);
    const onFavorites = () => syncFavorites();
    window.addEventListener("fot10-favorites-changed", onFavorites);
    window.addEventListener("fot10-profile-changed", onFavorites);
    const timer = setInterval(() => load(true), 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("fot10-favorites-changed", onFavorites);
      window.removeEventListener("fot10-profile-changed", onFavorites);
    };
  }, []);

  useEffect(() => {
    if (!loading) loadPersonal(favorites);
  }, [loading, favorites.teams.join("|"), favorites.leagues.join("|")]);

  const filtered = useMemo(() => {
    const selected = FILTERS.find((item) => item.id === filter);
    const q = search.trim().toLowerCase();
    return allNews.filter((item) => {
      const text = `${item.title || ""} ${item.description || ""}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (filter === "iran") return isIran(item);
      if (filter === "world") return !isIran(item);
      if (selected?.query) return text.includes(selected.query.toLowerCase());
      return true;
    });
  }, [allNews, filter, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <section className="mt-5" dir="rtl">
      <div className="mb-4 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-slate-900/70 to-cyan-400/5 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Newspaper size={22} /></div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-emerald-300">FOT10 NEWS CENTER</div>
              <h2 className="mt-1 text-xl font-black text-white">نبض خبر فوتبال</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-500">خبرهای عمومی + فید اختصاصی علاقه‌مندی‌های تو</p>
            </div>
          </div>
          <button onClick={() => load(true)} disabled={refreshing} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300" aria-label="به‌روزرسانی خبرها"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
        </div>

        {(favorites.teams.length > 0 || favorites.leagues.length > 0) && (
          <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-400/5 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-rose-300"><Heart size={14} fill="currentColor" /> فید اختصاصی شما</div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {[...favorites.teams.map((name) => ({ name, kind: "تیم" })), ...favorites.leagues.map((name) => ({ name, kind: "لیگ" }))].slice(0, 10).map((item) => (
                <span key={`${item.kind}-${item.name}`} className="shrink-0 rounded-xl bg-white/5 px-3 py-2 text-[9px] font-black text-slate-300">{item.kind}: {item.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button key={item.id} onClick={() => setFilter(item.id)} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black transition ${filter === item.id ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>{item.label}</button>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-slate-500">
          <Search size={15} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی خبر..." className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-slate-600" />
        </label>
      </div>

      {personalNews.length > 0 && (
        <div className="mb-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.035] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Users size={16} className="text-cyan-300" /><h3 className="text-sm font-black text-white">خبرهای محبوب من</h3></div>
            <span className="text-[9px] font-black text-slate-600">{personalLoading ? "در حال بروزرسانی..." : `${fa(personalNews.length)} خبر`}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {personalNews.slice(0, 6).map((item) => (
              <a key={`${item.id}-${item.favoriteName}`} href={item.link} target="_blank" rel="noreferrer" className="group flex min-h-28 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30 hover:border-cyan-300/25">
                {item.image ? <img src={imageUrl(item)} alt="" className="h-28 w-28 shrink-0 object-cover" loading="lazy" /> : <div className="grid h-28 w-28 shrink-0 place-items-center bg-cyan-400/5 text-cyan-300"><Heart size={18} /></div>}
                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-center gap-2 text-[8px] font-black text-cyan-300"><span>{item.favoriteKind === "league" ? "لیگ محبوب" : "تیم محبوب"}</span><span className="text-slate-600">•</span><span className="truncate">{item.favoriteName}</span></div>
                  <h4 className="mt-2 line-clamp-3 text-xs font-black leading-6 text-white group-hover:text-cyan-300">{item.title}</h4>
                  <div className="mt-1 text-[9px] font-bold text-slate-600">{relativeTime(item.publishedAt)} • {item.source}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3"><div className="h-64 animate-pulse rounded-3xl bg-white/5" /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-white/5" /><div className="h-32 animate-pulse rounded-2xl bg-white/5" /></div></div>
      ) : failed ? (
        <div className="rounded-3xl border border-red-400/15 bg-red-400/5 p-7 text-center"><div className="font-black text-white">دریافت خبرها با مشکل روبه‌رو شد</div><button onClick={() => load(false)} className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-[10px] font-black text-slate-950">تلاش دوباره</button></div>
      ) : !filtered.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center"><div className="font-black text-white">خبری برای این فیلتر پیدا نشد</div><p className="mt-2 text-[10px] font-bold text-slate-500">فیلتر دیگری را امتحان کن.</p></div>
      ) : (
        <>
          {featured && (
            <a href={featured.link} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
              {featured.image ? <img src={imageUrl(featured)} alt="" className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-80" /> : <div className="h-64 bg-gradient-to-br from-emerald-400/20 to-cyan-400/5 sm:h-80" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 pt-24">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-300"><Flame size={13} /> خبر داغ <span className="text-slate-500">•</span> {featured.source}</div>
                <h3 className="mt-2 text-lg font-black leading-8 text-white sm:text-2xl">{featured.title}</h3>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400"><Clock3 size={12} /> {relativeTime(featured.publishedAt)} <ExternalLink size={12} className="mr-1" /></div>
              </div>
            </a>
          )}

          <div className="my-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><h3 className="text-sm font-black text-white">آخرین خبرها</h3></div><span className="text-[10px] font-black text-slate-600">{fa(filtered.length)} خبر</span></div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rest.map((item) => (
              <a key={item.id} href={item.link} target="_blank" rel="noreferrer" className="group flex min-h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] hover:border-emerald-400/25">
                {item.image ? <img src={imageUrl(item)} alt="" className="h-32 w-32 shrink-0 object-cover" loading="lazy" /> : <div className="grid h-32 w-32 shrink-0 place-items-center bg-emerald-400/5 text-emerald-300"><Newspaper size={20} /></div>}
                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-500"><span style={{ color: item.color || "#22c55e" }}>{item.source}</span><span>•</span><span>{relativeTime(item.publishedAt)}</span></div>
                  <h4 className="mt-2 line-clamp-3 text-xs font-black leading-6 text-white group-hover:text-emerald-300">{item.title}</h4>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-slate-600">ادامه خبر <ExternalLink size={11} /></div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><Globe2 size={16} className="text-cyan-300" /><div className="mt-2 text-[10px] font-black text-white">ایران + جهان</div><div className="mt-1 text-[9px] font-bold text-slate-600">پوشش چندمنبعی فوتبال</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><Clock3 size={16} className="text-emerald-300" /><div className="mt-2 text-[10px] font-black text-white">تازه‌سازی خودکار</div><div className="mt-1 text-[9px] font-bold text-slate-600">هر ۵ دقیقه</div></div>
      </div>
    </section>
  );
}
