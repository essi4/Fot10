"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, Heart, Radio, RefreshCw, Shield, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getMatchCenterScope, MATCH_CENTER_CLUB_LEAGUES } from "../../lib/match-center-scope";

const COUNTRY_FLAGS = Object.fromEntries(MATCH_CENTER_CLUB_LEAGUES.map((item) => [item.key, item.flag]));
const TEAM_FLAGS = [
  [/argentina|آرژانتین/i, "🇦🇷"],
  [/brazil|brasil|برزیل/i, "🇧🇷"],
  [/iran|ایران/i, "🇮🇷"],
  [/england|انگلیس/i, "🇬🇧"],
  [/spain|اسپانیا/i, "🇪🇸"],
  [/italy|ایتالیا/i, "🇮🇹"],
  [/germany|آلمان/i, "🇩🇪"],
  [/france|فرانسه/i, "🇫🇷"],
  [/netherlands|هلند/i, "🇳🇱"],
  [/portugal|پرتغال/i, "🇵🇹"],
  [/turkey|ترکیه/i, "🇹🇷"],
  [/saudi|عربستان/i, "🇸🇦"],
];

function flagForTeam(name) {
  const match = TEAM_FLAGS.find(([pattern]) => pattern.test(String(name || "")));
  return match?.[1] || "";
}

function scopeMeta(match) {
  const scope = getMatchCenterScope(match);
  return {
    flag: scope?.kind === "club-league" ? scope.entry?.flag || COUNTRY_FLAGS[scope.key] || "" : "🌍",
    badge: scope?.key === "Argentina" ? "LPF" : scope?.key === "Brazil" ? "CBF" : "",
  };
}
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const SETTINGS_KEY = "fot10-settings";
const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);
const LIVE_LABELS = { "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "استراحت", LIVE: "در جریان", "IN PLAY": "در جریان" };

function readFavorites() { try { const raw = JSON.parse(localStorage.getItem("fot10-profile") || "{}"); return Array.isArray(raw.favoriteMatches) ? raw.favoriteMatches : []; } catch { return []; } }
function writeFavorites(items) { try { const raw = JSON.parse(localStorage.getItem("fot10-profile") || "{}"); localStorage.setItem("fot10-profile", JSON.stringify({ ...raw, favoriteMatches: items })); } catch {} }
function favoriteKey(game) { return String(game.id); }
function readSettings() { try { return { autoRefresh: true, compactScores: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return { autoRefresh: true, compactScores: true }; } }
function iranDate(offset = 0) { const now = new Date(); const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {}); const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
function toTime(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" }); }
function toFaDate(value) { return new Date(`${value}T12:00:00+03:30`).toLocaleDateString("fa-IR", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Tehran" }); }
function mapGame(match) { const statusCode = String(match.statusShort || match.status || "").toUpperCase(); const live = LIVE_CODES.has(statusCode) || /LIVE|IN PLAY|HALF/i.test(statusCode); const finished = FINISHED_CODES.has(statusCode); return { ...match, league: match.league || "مسابقات فوتبال", country: match.country || "", home: match.home || "میزبان", away: match.away || "مهمان", statusCode, statusLabel: live ? (LIVE_LABELS[statusCode] || "در جریان") : finished ? "پایان" : toTime(match.date), minute: live && match.elapsed != null ? `${match.elapsed}'` : finished ? "پایان" : toTime(match.date), live, finished }; }
function sortLive(a, b) { return Number(b.live) - Number(a.live) || String(a.league).localeCompare(String(b.league)); }
function scopeLabel(match) {
  const scope = getMatchCenterScope(match);
  return scope?.kind === "national-team" ? "تیم‌های ملی بزرگسالان" : scope?.label || match?.league || "فوتبال";
}

function scopeKey(match) {
  const scope = getMatchCenterScope(match);
  return scope?.kind === "national-team" ? "national-team" : scope?.key || "unknown";
}

function ScopeSelector({ selected, onSelect, counts }) {
  const items = [
    { key: "all", label: "همه", icon: Shield },
    ...MATCH_CENTER_CLUB_LEAGUES.map(({ key, label, flag }) => ({ key, label: `${flag || ""} ${label}`.trim(), icon: Trophy })),
    { key: "national-team", label: "ملی", icon: Shield },
  ];
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <p className="text-[9px] font-black text-slate-400">فوتبال منتخب</p>
          <h2 className="text-sm font-black text-slate-950">انتخاب محدوده مسابقات</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-500">۱۲ لیگ + ملی</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = selected === key;
          const count = counts[key] || 0;
          return (
            <button key={key} type="button" onClick={() => onSelect(key)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-right transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
              aria-pressed={active}>
              <span className="flex items-center gap-1.5">
                <Icon size={13} />
                <span className="text-[9px] font-black">{label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[7px] ${active ? "bg-white/15 text-white" : "bg-white text-slate-400"}`}>{count}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayFilters({ liveOnly, day, summary }) {
  const fallback = { count: 0, leagues: 0, finished: 0, goals: 0 };
  const stats = { live: summary?.live || fallback, yesterday: summary?.yesterday || fallback, today: summary?.today || fallback, tomorrow: summary?.tomorrow || fallback };
  const items = [
    { key: "live", label: "زنده", date: "لحظه‌ای", meta: stats.live.count ? `${stats.live.count} بازی` : "بدون بازی", href: "/matches?live=1", icon: Radio },
    { key: "yesterday", label: "دیروز", date: toFaDate(iranDate(-1)), meta: `${stats.yesterday.count} بازی`, href: `/matches?date=${iranDate(-1)}`, icon: CalendarDays },
    { key: "today", label: "امروز", date: toFaDate(iranDate(0)), meta: `${stats.today.count} بازی`, href: `/matches?date=${iranDate(0)}`, icon: CalendarDays },
    { key: "tomorrow", label: "فردا", date: toFaDate(iranDate(1)), meta: `${stats.tomorrow.count} بازی`, href: `/matches?date=${iranDate(1)}`, icon: CalendarDays },
  ];
  const active = liveOnly ? "live" : day === -1 ? "yesterday" : day === 1 ? "tomorrow" : "today";
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map(({ key, label, date, meta, href, icon: Icon }) => {
          const activeItem = active === key;
          return (
            <Link key={key} href={href} className={`rounded-[20px] border p-2.5 text-center transition ${activeItem ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"}`}>
              <span className={`mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-xl ${activeItem ? "bg-white/10" : "bg-white"}`}><Icon size={14} /></span>
              <b className="block text-[10px]">{label}</b>
              <span className={`mt-0.5 block text-[7px] ${activeItem ? "text-slate-300" : "text-slate-400"}`}>{date}</span>
              <strong className={`mt-1 block text-[8px] ${activeItem ? "text-white" : "text-slate-600"}`}>{meta}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const liveOnly = searchParams.get("live") === "1";
  const requestedDate = searchParams.get("date");
  const [games, setGames] = useState([]);
  const [day, setDay] = useState(0);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState({ autoRefresh: true, compactScores: true });
  const [updatedAt, setUpdatedAt] = useState(null);
  const [summary, setSummary] = useState(null);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const requestInFlight = useRef(false);
  const date = useMemo(() => requestedDate || iranDate(day), [requestedDate, day]);

  useEffect(() => {
    const sync = () => { setSettings(readSettings()); setFavoriteMatches(readFavorites()); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("fot10-settings-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("fot10-settings-changed", sync);
    };
  }, []);

  useEffect(() => {
    if (!requestedDate) { setDay(0); return; }
    const today = iranDate(0);
    const yesterday = iranDate(-1);
    const tomorrow = iranDate(1);
    setDay(requestedDate === yesterday ? -1 : requestedDate === tomorrow ? 1 : requestedDate === today ? 0 : 0);
  }, [requestedDate]);

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const q = `today=${iranDate(0)}&yesterday=${iranDate(-1)}&tomorrow=${iranDate(1)}`;
        const response = await fetch(`/api/football/fixtures/summary?${q}`, { cache: "no-store" });
        const payload = await response.json();
        if (!cancelled && response.ok && payload.ok) setSummary(payload);
      } catch {}
    };
    loadSummary();
    const timer = setInterval(loadSummary, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const loadMatches = useCallback(async ({ manual = false } = {}) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (manual) setRefreshing(true);
    setLoading(true);
    setError("");
    try {
      const endpoint = liveOnly ? "/api/football/live" : `/api/football/fixtures?date=${date}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), liveOnly ? 18000 : 12000);
      let response;
      try {
        response = await fetch(`${endpoint}${liveOnly ? `?t=${Date.now()}` : ""}`, { cache: "no-store", signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "دریافت مسابقات ناموفق بود");
      const sourceMatches = Array.isArray(payload.matches) ? payload.matches : [];
      const mapped = sourceMatches.map(mapGame).filter((g) => liveOnly ? g.live : true).sort(sortLive);
      setGames(mapped);
      setUpdatedAt(payload.checkedAt ? new Date(payload.checkedAt) : new Date());
      if (!mapped.length) setError(liveOnly ? "در حال حاضر مسابقه زنده‌ای در محدوده فوتبال منتخب دریافت نشد." : "برای این روز مسابقه‌ای از محدوده فوتبال منتخب دریافت نشد.");
    } catch (err) {
      setError(err?.name === "AbortError" ? "پاسخ سرویس دیر رسید؛ دوباره بررسی می‌کنیم." : err?.message || "اتصال داده مسابقات برقرار نشد.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, liveOnly]);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useEffect(() => {
    if (!settings.autoRefresh) return;
    const timer = setInterval(() => loadMatches(), liveOnly ? 15000 : 30000);
    return () => clearInterval(timer);
  }, [loadMatches, settings.autoRefresh, liveOnly]);

  const counts = useMemo(() => {
    const next = { all: games.length, "national-team": 0 };
    for (const item of MATCH_CENTER_CLUB_LEAGUES) next[item.key] = 0;
    for (const game of games) {
      const key = scopeKey(game);
      if (key in next) next[key] += 1;
    }
    return next;
  }, [games]);

  const filteredGames = useMemo(
    () => scopeFilter === "all" ? games : games.filter((game) => scopeKey(game) === scopeFilter),
    [games, scopeFilter],
  );

  const grouped = useMemo(() => filteredGames.reduce((acc, game) => {
    const key = `${scopeLabel(game)} · ${game.league || "مسابقات ملی"}`;
    (acc[key] ||= []).push(game);
    return acc;
  }, {}), [filteredGames]);

  const liveCount = filteredGames.filter((g) => g.live).length;
  const toggleFavorite = useCallback(async (game) => {
    const key = favoriteKey(game);
    const current = readFavorites();
    const exists = current.some((item) => favoriteKey(item) === key);
    const snapshot = { id: game.id, home: game.home, away: game.away, homeLogo: game.homeLogo, awayLogo: game.awayLogo, league: game.league, country: game.country, date: game.date, homeScore: game.homeScore, awayScore: game.awayScore, statusLabel: game.statusLabel, live: game.live };
    const next = exists ? current.filter((item) => favoriteKey(item) !== key) : [...current, snapshot];
    writeFavorites(next);
    setFavoriteMatches(next);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      if (exists) await supabase.from("fot10_favorites").delete().eq("user_id", auth.user.id).eq("item_type", "match").eq("item_name", JSON.stringify(snapshot));
      else await supabase.from("fot10_favorites").insert({ user_id: auth.user.id, item_type: "match", item_name: JSON.stringify(snapshot) });
    } catch {}
  }, []);
  const dayLabel = day === -1 ? "دیروز" : day === 1 ? "فردا" : "امروز";

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950" dir="rtl">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-28 pt-3 sm:px-5 sm:pt-5">
        <header className="flex items-center justify-between rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white" aria-label="بازگشت به خانه"><ArrowRight size={18}/></Link>
            <div className="min-w-0">
              <div className="text-[9px] font-black text-slate-400">FOT10</div>
              <h1 className="text-xl font-black">فوتبال منتخب</h1>
              <p className="text-[10px] font-bold text-slate-500">۱۲ لیگ منتخب و تیم‌های ملی بزرگسالان</p>
            </div>
          </div>
          <button onClick={() => loadMatches({ manual: true })} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700" aria-label="به‌روزرسانی مسابقات">
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""}/>
          </button>
        </header>

        <ScopeSelector selected={scopeFilter} onSelect={setScopeFilter} counts={counts}/>
        <DayFilters liveOnly={liveOnly} day={day} summary={summary}/>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><Radio size={16} className="text-slate-700"/><h2 className="text-sm font-black">{liveOnly ? "مسابقات زنده" : dayLabel}</h2></div>
              <p className="mt-1 text-[9px] font-bold text-slate-400">{filteredGames.length} مسابقه در محدوده انتخاب‌شده</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black text-slate-500">{liveCount} زنده</span>
          </div>
          {updatedAt && <div className="mt-3 border-t border-slate-100 pt-2 text-[8px] font-bold text-slate-400">آخرین به‌روزرسانی {updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
        </section>

        {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-bold text-amber-700">{error}</div>}

        {loading && !games.length ? (
          <section className="rounded-[26px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">در حال دریافت مسابقات واقعی…</section>
        ) : Object.keys(grouped).length ? (
          <section className="space-y-4">
            {Object.entries(grouped).map(([league, list]) => (
              <div key={league}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-700">{(() => { const meta = scopeMeta(list[0]); return <><span className="text-base leading-none">{meta.flag}</span><span>{league}</span>{meta.badge && <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[7px] font-black text-slate-500">{meta.badge}</span>}</>; })()}</div>
                  <span className="text-[8px] font-bold text-slate-400">{list.length} بازی</span>
                </div>
                <div className="space-y-2.5">
                  {list.map((g) => (
                    <Link key={g.id} href={g.detailAvailable === false ? `/matches?date=${date}` : `/matches/${g.id}`} className="block rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_25px_rgba(15,23,42,.04)] transition active:scale-[.995] hover:border-slate-300">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-[8px] font-bold text-slate-400"><span className="text-sm leading-none">{scopeMeta(g).flag}</span><span className="truncate">{g.country || "فوتبال منتخب"} · {g.league}</span></span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite(g); }} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500" aria-label={favoriteMatches.some((item) => favoriteKey(item) === favoriteKey(g)) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
                            <Heart size={15} fill={favoriteMatches.some((item) => favoriteKey(item) === favoriteKey(g)) ? "currentColor" : "none"} />
                          </button>
                          <span className={`rounded-full px-2 py-1 text-[8px] font-black ${g.live ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{g.live ? `${g.statusLabel}${g.elapsed != null ? ` · ${g.elapsed}'` : ""}` : g.statusLabel}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                        <div className="min-w-0 text-center">
                          <div className="mx-auto grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-slate-50 text-sm font-black text-slate-700">{g.homeLogo ? <img src={g.homeLogo} alt="" className="h-8 w-8 object-contain"/> : <><span className="text-lg">{flagForTeam(g.home)}</span>{!flagForTeam(g.home) && g.home[0]}</>}</div>
                          <div className="mt-2 truncate text-[11px] font-black text-slate-900">{g.home}</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-xl font-black tabular-nums ${g.live ? "text-slate-950" : "text-slate-500"}`}>{g.homeScore != null ? `${g.homeScore} - ${g.awayScore}` : "—"}</div>
                          <div className="mt-1 text-[7px] font-bold text-slate-400">{g.live ? "در جریان" : g.finished ? "پایان" : "زمان مسابقه"}</div>
                        </div>
                        <div className="min-w-0 text-center">
                          <div className="mx-auto grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-slate-50 text-sm font-black text-slate-700">{g.awayLogo ? <img src={g.awayLogo} alt="" className="h-8 w-8 object-contain"/> : <><span className="text-lg">{flagForTeam(g.away)}</span>{!flagForTeam(g.away) && g.away[0]}</>}</div>
                          <div className="mt-2 truncate text-[11px] font-black text-slate-900">{g.away}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] font-bold text-slate-400">
                        <span>{g.detailAvailable === false ? "اطلاعات خلاصه مسابقه" : "مشاهده جزئیات مسابقه"}</span>
                        <ChevronLeft size={13}/>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-[26px] border border-slate-200 bg-white p-10 text-center shadow-[0_8px_25px_rgba(15,23,42,.04)]">
            <Trophy size={24} className="mx-auto text-slate-300"/>
            <b className="mt-3 block text-sm text-slate-700">{liveOnly ? "مسابقه زنده‌ای پیدا نشد" : "مسابقه‌ای برای این محدوده و روز وجود ندارد"}</b>
            <p className="mt-1 text-[9px] font-bold text-slate-400">فقط داده‌های واقعی در محدوده فوتبال منتخب نمایش داده می‌شوند.</p>
          </section>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/favorites" className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.04)]">
            <Heart size={17} className="text-slate-700"/>
            <div className="mt-3 text-sm font-black">علاقه‌مندی‌ها</div>
            <div className="mt-1 text-[8px] font-bold text-slate-400">بازی‌های ذخیره‌شده</div>
          </Link>
          <Link href="/matches/visualization" className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.04)]">
            <Shield size={17} className="text-slate-700"/>
            <div className="mt-3 text-sm font-black">نمایش مسابقه</div>
            <div className="mt-1 text-[8px] font-bold text-slate-400">رویدادهای واقعی بازی</div>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function MatchesPage() { return <Suspense fallback={<main className="fot-shell"><div className="fot-container p-8 text-center text-sm text-slate-500">در حال آماده‌سازی مرکز بازی‌ها…</div></main>}><MatchesContent /></Suspense>; }