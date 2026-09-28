"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Heart, Search, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { MATCH_CENTER_CLUB_LEAGUES } from "../../lib/match-center-scope";
import { LEAGUE_ENTRIES } from "../../lib/fot10-universe";
import FavoriteButton from "../../components/FavoriteButton";

const SELECTED_LEAGUE_SLUGS = {
  Iran: "iran",
  England: "premier-league",
  Spain: "laliga",
  Italy: "serie-a",
  Germany: "bundesliga",
  France: "ligue-1",
  Netherlands: "eredivisie",
  Portugal: "primeira-liga",
  Turkey: "super-lig",
  "Saudi Arabia": "saudi-pro-league",
  Argentina: "liga-profesional",
  Brazil: "brasileirao",
};

const SELECTED_LEAGUES = MATCH_CENTER_CLUB_LEAGUES.map((scope) => {
  const entry = LEAGUE_ENTRIES.find(
    (item) => item.slug === SELECTED_LEAGUE_SLUGS[scope.key],
  );
  return {
    ...scope,
    slug: entry?.slug || SELECTED_LEAGUE_SLUGS[scope.key],
    leagueName: entry?.leagueName || scope.label,
    apiCountry: entry?.apiCountry || scope.key,
    leagueId: scope.leagueIds[0],
  };
});

function LeagueLogo({ league }) {
  const src = league.leagueId
    ? `https://media.api-sports.io/football/leagues/${league.leagueId}.png`
    : "/league-default.svg";
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <img
        src={src}
        alt={`${league.leagueName} logo`}
        width="40"
        height="40"
        className="h-9 w-9 object-contain"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = "/league-default.svg";
        }}
      />
    </span>
  );
}

function LeagueCard({ league }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_25px_rgba(15,23,42,.045)]">
      <Link href={`/leagues/${league.slug}`} className="group flex items-center gap-3 active:scale-[.995]">
        <LeagueLogo league={league} />
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-1.5">
            <span className="text-base leading-none">{league.flag}</span>
            <b className="truncate text-[12px] font-black text-slate-950">{league.leagueName}</b>
          </span>
          <small className="block truncate text-[9px] font-bold text-slate-400">{league.apiCountry}</small>
        </span>
        <ChevronLeft size={16} className="shrink-0 text-slate-400 transition group-hover:text-slate-900" />
      </Link>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        <Link
          href={`/leagues/${league.slug}?tab=table`}
          className="rounded-xl border border-slate-200 bg-slate-50 px-1 py-2 text-center text-[8px] font-black text-slate-700"
        >
          جدول
        </Link>
        <span className="rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[8px] font-bold text-slate-400">آمار</span>
        <span className="rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[8px] font-bold text-slate-400">برنامه</span>
        <span className="rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[8px] font-bold text-slate-400">نقل‌وانتقالات</span>
        <span className="rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[8px] font-bold text-slate-400">بهترین‌های ماه</span>
      </div>

      <div className="mt-2 flex justify-end">
        <FavoriteButton
          type="league"
          name={league.leagueName}
          className="px-3 py-2 text-[9px]"
        />
      </div>
    </article>
  );
}

export default function LeaguesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return SELECTED_LEAGUES;
    return SELECTED_LEAGUES.filter((league) =>
      `${league.label} ${league.leagueName} ${league.apiCountry}`.toLowerCase().includes(value),
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950" dir="rtl">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-3 pb-28 pt-3 sm:px-5 sm:pt-5">
        <header className="flex items-center gap-3 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
          <Link href="/" aria-label="بازگشت به خانه" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
            <ArrowRight size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-black text-slate-400">FOT10</div>
            <h1 className="text-xl font-black">فوتبال منتخب</h1>
            <p className="text-[10px] font-bold text-slate-500">۱۲ لیگ منتخب</p>
          </div>
          <Trophy size={21} className="text-slate-700" />
        </header>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black text-slate-400">لیگ‌ها</p>
              <h2 className="mt-1 text-base font-black">جدول لیگ‌ها</h2>
              <p className="mt-1 text-[9px] font-bold leading-5 text-slate-400">
                فقط ۱۲ لیگ منتخب FOT10؛ بدون نمایش نتایج زنده و لیست بازی‌ها در این بخش.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black text-slate-500">۱۲ لیگ</span>
          </div>

          <label className="relative mt-4 block">
            <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-bold outline-none placeholder:text-slate-400"
              placeholder="جستجوی بین ۱۲ لیگ..."
              aria-label="جستجوی لیگ"
            />
          </label>
        </section>

        {filtered.length ? (
          <section className="space-y-2.5">
            {filtered.map((league, index) => (
              <div key={league.key} className="relative">
                <span className="absolute -right-1 top-4 z-10 grid h-6 min-w-6 place-items-center rounded-full border border-slate-200 bg-white px-1 text-[8px] font-black text-slate-500 shadow-sm">
                  {index + 1}
                </span>
                <LeagueCard league={league} />
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-[26px] border border-slate-200 bg-white p-10 text-center">
            <Heart size={24} className="mx-auto text-slate-300" />
            <b className="mt-3 block text-sm text-slate-700">لیگی پیدا نشد</b>
            <p className="mt-1 text-[9px] font-bold text-slate-400">عبارت جستجو را تغییر بده.</p>
          </section>
        )}
      </div>
    </main>
  );
}
