"use client";

import Link from "next/link";
import { Activity, ArrowLeft, Heart, Radio, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import HomeMatchdayHub from "./components/HomeMatchdayHub";

const LIVE_CODES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);

function statusCode(match) {
  return String(match?.statusShort || match?.status || "").toUpperCase();
}

function statusText(match) {
  const code = statusCode(match);
  if (LIVE_CODES.has(code)) return match?.elapsed != null ? `LIVE · ${match.elapsed}'` : "LIVE";
  if (FINISHED_CODES.has(code)) return "پایان";
  if (match?.date) {
    const date = new Date(match.date);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tehran" });
    }
  }
  return "برنامه مسابقه";
}

function normalizeMatch(match) {
  if (!match) return null;
  return {
    ...match,
    home: match.home || "میزبان",
    away: match.away || "مهمان",
    league: match.league || "مسابقات فوتبال",
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
  };
}

function eventLabel(event) {
  const type = String(event?.type || event?.detail || "").toLowerCase();
  if (type.includes("goal")) return "گل";
  if (type.includes("yellow")) return "کارت زرد";
  if (type.includes("red")) return "کارت قرمز";
  if (type.includes("subst")) return "تعویض";
  if (type.includes("var")) return "VAR";
  if (type.includes("penalty")) return "پنالتی";
  if (type.includes("corner")) return "کرنر";
  return null;
}

function FeaturedMatch() {
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const liveRes = await fetch(`/api/football/live?t=${Date.now()}`, { cache: "no-store" });
        const liveJson = await liveRes.json();
        let selected = Array.isArray(liveJson.matches)
          ? liveJson.matches.find((item) => LIVE_CODES.has(statusCode(item)))
          : null;

        if (!selected) {
          const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());

          const fixtureRes = await fetch(`/api/football/fixtures?date=${today}`, { cache: "no-store" });
          const fixtureJson = await fixtureRes.json();
          selected = Array.isArray(fixtureJson.matches) ? fixtureJson.matches[0] : null;
        }

        if (!alive) return;
        const nextMatch = normalizeMatch(selected);
        setMatch(nextMatch);

        if (nextMatch?.id) {
          const eventsRes = await fetch(`/api/football/fixture?id=${encodeURIComponent(nextMatch.id)}&section=events`, { cache: "no-store" });
          const eventsJson = await eventsRes.json();
          if (alive && eventsJson?.ok && Array.isArray(eventsJson.data)) {
            setEvents(eventsJson.data.slice(0, 5));
          }
        }
      } catch {
        if (alive) {
          setMatch(null);
          setEvents([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (loading) {
    return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,.06)]"><div className="h-44 animate-pulse rounded-2xl bg-slate-100" /></section>;
  }

  if (!match) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-9 text-center shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <Activity size={24} className="mx-auto text-slate-300" />
        <h2 className="mt-3 text-base font-black text-slate-900">مسابقه‌ای برای نمایش در حال حاضر وجود ندارد</h2>
        <p className="mt-1 text-[10px] font-bold text-slate-400">بازی‌های منتخب بعدی را بررسی کنید</p>
        <Link href="/matches" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[9px] font-black text-white">مشاهده نتایج مسابقات <ArrowLeft size={13} /></Link>
      </section>
    );
  }

  const live = LIVE_CODES.has(statusCode(match));
  const eventLabels = events.map(eventLabel).filter(Boolean).slice(0, 4);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.07)] sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="text-[8px] font-black tracking-[.12em] text-slate-400">مسابقه منتخب واقعی</div>
          <div className="mt-1 text-[10px] font-bold text-slate-500">{match.league}</div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${live ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-200 bg-white text-slate-400"}`}>
          {statusText(match)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-7">
        <div className="min-w-0 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-lg font-black text-slate-700">
            {match.homeLogo ? <img src={match.homeLogo} alt="" className="h-9 w-9 object-contain" /> : match.home[0]}
          </div>
          <div className="mt-2 truncate text-sm font-black text-slate-900">{match.home}</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-black tabular-nums tracking-tight text-slate-950">
            {match.homeScore ?? "—"} <span className="text-slate-300">—</span> {match.awayScore ?? "—"}
          </div>
          <div className="mt-1 text-[8px] font-black text-slate-400">{live ? "در جریان" : statusText(match)}</div>
        </div>

        <div className="min-w-0 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-lg font-black text-slate-700">
            {match.awayLogo ? <img src={match.awayLogo} alt="" className="h-9 w-9 object-contain" /> : match.away[0]}
          </div>
          <div className="mt-2 truncate text-sm font-black text-slate-900">{match.away}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 pt-3">
        {eventLabels.length ? eventLabels.map((label, index) => (
          <span key={`${label}-${index}`} className="rounded-full bg-slate-50 px-2.5 py-1 text-[8px] font-black text-slate-500">{label}</span>
        )) : (
          <span className="text-[8px] font-bold text-slate-400">رویدادهای ثبت‌شده مسابقه در صورت دریافت از منبع واقعی نمایش داده می‌شوند</span>
        )}
      </div>

      <Link href={`/matches/${match.id}`} className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-[9px] font-black text-white">
        مشاهده جزئیات مسابقه <ArrowLeft size={13} />
      </Link>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950" dir="rtl">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-28 pt-3 sm:px-5 sm:pt-5">
        <header className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,.06)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-slate-900" />
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-sm font-black italic text-white">10</div>
              <div>
                <div className="text-2xl font-black tracking-tight">FOT10</div>
                <div className="text-[9px] font-bold text-slate-500">Football Data · Match Center</div>
              </div>
            </div>
          </div>
        </header>

        <FeaturedMatch />

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.045)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black tracking-[.12em] text-slate-400">MATCH VISUALIZATION</div>
              <h2 className="mt-1 text-lg font-black text-slate-950">نمایش زنده اتفاقات بازی</h2>
              <p className="mt-1 text-[9px] font-bold leading-5 text-slate-400">زمین مینیمال مسابقه، رویدادهای واقعی و جزئیات ظریف 8-bit؛ بدون داده ساختگی.</p>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><Activity size={19} /></div>
          </div>
          <Link href="/matches/visualization" className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-[9px] font-black text-slate-700">ورود به Match Visualization <ArrowLeft size={13} /></Link>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.045)]">
          <div className="flex items-center gap-2"><Shield size={17} className="text-slate-700" /><h2 className="text-sm font-black text-slate-950">فوتبال منتخب</h2></div>
          <p className="mt-2 text-[10px] font-bold leading-5 text-slate-500">لیگ‌های منتخب و تیم‌های ملی بزرگسالان</p>
        </section>

        <HomeMatchdayHub />

        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/matches" className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.04)]">
            <Radio size={18} className="text-slate-700" />
            <div className="mt-3 text-sm font-black">نتایج مسابقات</div>
            <div className="mt-1 text-[8px] font-bold text-slate-400">مسابقات واقعی در محدوده FOT10</div>
          </Link>
          <Link href="/favorites" className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.04)]">
            <Heart size={18} className="text-slate-700" />
            <div className="mt-3 text-sm font-black">علاقه‌مندی‌ها</div>
            <div className="mt-1 text-[8px] font-bold text-slate-400">بازی‌های ذخیره‌شده شما</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
