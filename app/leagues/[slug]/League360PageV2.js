"use strict";

import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Goal, Hand, ListOrdered, Users, Activity } from "lucide-react";
import { LEAGUE_ENTRIES, CLUB_CUPS } from "../../../lib/fot10-universe";
import { getLeagueByCountry, getLeagueCurrentSeason, getTopScorers, getTopAssists } from "../../../lib/sports-data";
import { getMatchesResilient, getStandingsResilient, getPlayerStatsResilient } from "../../../lib/football-resilient";
import { teamName } from "../../../lib/team-identity";
import FavoriteButton from "../../../components/FavoriteButton";

const TABS = [
  ["table", "جدول", ListOrdered],
  ["matches", "بازی‌ها", CalendarDays],
  ["stats", "آمار", BarChart3],
];

const FINISHED = ["FT", "AET", "PEN"];
const LIVE = ["1H", "HT", "2H", "ET", "P", "LIVE", "IN PLAY"];

const todayTehran = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());

const faDate = (value) =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(value));

const faTime = (value) =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const faNow = () =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

const sourceLabel = (source) =>
  source === "api-football"
    ? "API-Football"
    : source === "thesportsdb"
      ? "TheSportsDB"
      : source === "thesportsdb-events"
        ? "TheSportsDB · نتایج"
        : "منبع نامشخص";

const seasonLabel = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const start = n > 1800 ? n - 621 : n;
  return `${start}-${start + 1}`;
};

const isLive = (match) => LIVE.includes(String(match?.statusShort || "").toUpperCase());

const norm = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\b(fc|sc|club|sazi)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

function resultForTeam(match, team) {
  const target = norm(team);
  const home = norm(match?.home);
  const away = norm(match?.away);
  if (target !== home && target !== away) return null;

  const homeScore = Number(match?.homeScore);
  const awayScore = Number(match?.awayScore);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;
  if (homeScore === awayScore) return "D";

  return target === home
    ? homeScore > awayScore ? "W" : "L"
    : awayScore > homeScore ? "W" : "L";
}

export default async function League360PageV2({ params, searchParams }) {
  const entry = LEAGUE_ENTRIES.find((item) => item.slug === params.slug);
  const cup = CLUB_CUPS.find((item) => item.slug === params.slug);

  if (!entry && !cup) {
    return (
      <main className="fot-shell">
        <div className="fot-container py-20 text-center">
          <h1 className="text-xl font-black">رقابت پیدا نشد</h1>
          <Link href="/leagues" className="mt-4 inline-block text-sm text-cyan-400">
            بازگشت به لیگ‌ها
          </Link>
        </div>
      </main>
    );
  }

  const league = entry || {
    name: cup.name,
    leagueName: cup.name,
    apiCountry: cup.country,
    flag: cup.icon,
    leagueId: cup.id,
  };

  const requestedTab = searchParams?.tab;
  const tab = TABS.some(([id]) => id === requestedTab) ? requestedTab : "table";
  const tableView = searchParams?.view === "summary" ? "summary" : "full";

  let today = [];
  let seasonMatches = [];
  let standings = [];
  let scorers = [];
  let assists = [];
  let season = null;
  let resolved = null;
  let warning = null;

  let standingsMeta = { source: "none", fetchedAt: null, fallback: false };
  let matchesMeta = { source: "none", fetchedAt: null, fallback: false };
  let scorersMeta = { source: "none", fetchedAt: null, fallback: false };
  let assistsMeta = { source: "none", fetchedAt: null, fallback: false };

  try {
    resolved = league.leagueId
      ? { league: { id: league.leagueId, name: league.leagueName } }
      : await getLeagueByCountry(league.apiCountry, league.leagueName);

    const id = resolved?.league?.id;
    if (!id) throw new Error("league unavailable");

    season = Number(id) === 195 ? 2026 : await getLeagueCurrentSeason(id);

    const results = await Promise.allSettled([
      getMatchesResilient({ date: todayTehran(), league: id, season }),
      getMatchesResilient({ league: id, season }),
      getStandingsResilient(id, season),
      getPlayerStatsResilient("scorers", id, season, getTopScorers),
      getPlayerStatsResilient("assists", id, season, getTopAssists),
    ]);

    if (results[0].status === "fulfilled") {
      today = results[0].value.data || [];
      matchesMeta = results[0].value;
    }
    if (results[1].status === "fulfilled") {
      seasonMatches = results[1].value.data || [];
      if (results[1].value.fetchedAt) matchesMeta = results[1].value;
    }
    if (results[2].status === "fulfilled") {
      standings = results[2].value.data || [];
      standingsMeta = results[2].value;
    }
    if (results[3].status === "fulfilled") {
      scorers = results[3].value.data || [];
      scorersMeta = results[3].value;
    }
    if (results[4].status === "fulfilled") {
      assists = results[4].value.data || [];
      assistsMeta = results[4].value;
    }

    const fallbackUsed = results.some(
      (item) => item.status === "fulfilled" && item.value?.fallback,
    );
    if (fallbackUsed) {
      warning = "داده اصلی در دسترس نبود؛ داده منبع جایگزین معتبر نمایش داده شده است.";
    }
  } catch (error) {
    warning = error instanceof Error
      ? error.message
      : "دریافت اطلاعات رقابت ناموفق بود.";
  }

  const leagueId = resolved?.league?.id || league.leagueId || null;
  const rows = standings.flatMap((item) => item?.league?.standings || []).flat();
  const hasVerifiedTable = rows.length > 0 && standingsMeta.source !== "none" && Boolean(standingsMeta.fetchedAt);

  const finished = seasonMatches
    .filter((match) => FINISHED.includes(match?.statusShort))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const upcoming = seasonMatches
    .filter(
      (match) =>
        match?.date &&
        new Date(match.date) > new Date() &&
        !FINISHED.includes(match?.statusShort),
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const matchMap = new Map();
  [...today, ...upcoming, ...finished].forEach((match) => {
    if (match?.id && !matchMap.has(String(match.id))) {
      matchMap.set(String(match.id), match);
    }
  });

  const visibleMatches = [...matchMap.values()]
    .sort((a, b) => {
      const liveDiff = Number(isLive(b)) - Number(isLive(a));
      if (liveDiff) return liveDiff;
      return new Date(a.date || 0) - new Date(b.date || 0);
    })
    .slice(0, 24);

  const standingsPlayed = rows.reduce(
    (sum, row) => sum + Number(row?.all?.played || 0),
    0,
  );

  const totalMatches = standingsPlayed > 0
    ? Math.round(standingsPlayed / 2)
    : finished.length;

  const totalGoals = rows.reduce(
    (sum, row) => sum + Number(row?.all?.goals?.for || 0),
    0,
  );

  const bestAttack = [...rows].sort(
    (a, b) =>
      Number(b?.all?.goals?.for || 0) -
      Number(a?.all?.goals?.for || 0),
  )[0];

  const bestDefense = [...rows].sort(
    (a, b) =>
      Number(a?.all?.goals?.against || 999) -
      Number(b?.all?.goals?.against || 999),
  )[0];

  const bestWins = [...rows].sort(
    (a, b) => Number(b?.all?.win || 0) - Number(a?.all?.win || 0),
  )[0];

  const latestFetchedAt = [
    standingsMeta,
    matchesMeta,
    scorersMeta,
    assistsMeta,
  ]
    .map((item) => item.fetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const metadataText = latestFetchedAt
    ? `آخرین دریافت داده: ${new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(latestFetchedAt))}`
    : "زمان دریافت داده در دسترس نیست.";

  const source = standingsMeta.source !== "none"
    ? standingsMeta.source
    : matchesMeta.source;

  const Table = () => {
    const summary = tableView === "summary";

    return (
      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)]">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-base font-black">
            جدول رده‌بندی · فصل {seasonLabel(season)}
          </h2>
          <p className="mt-1 text-[10px] font-bold text-slate-400">
            {metadataText}
          </p>

          <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Link
              href={`/leagues/${params.slug}?tab=table&view=full`}
              className={`rounded-lg px-3 py-1.5 text-[9px] font-black ${
                !summary
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              جدول کامل
            </Link>
            <Link
              href={`/leagues/${params.slug}?tab=table&view=summary`}
              className={`rounded-lg px-3 py-1.5 text-[9px] font-black ${
                summary
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              جدول خلاصه
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto" dir="rtl">
          <table
            className={`w-full border-collapse text-[10px] sm:text-[11px] ${
              summary ? "min-w-[430px]" : "min-w-[690px]"
            }`}
          >
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="w-10 p-3">رتبه</th>
                <th className="sticky right-0 bg-slate-50 p-3 text-right">
                  تیم
                </th>
                <th className="p-3">بازی</th>
                {!summary && <th className="p-3">برد</th>}
                {!summary && <th className="p-3">مساوی</th>}
                {!summary && <th className="p-3">باخت</th>}
                {!summary && <th className="p-3">گل زده</th>}
                {!summary && <th className="p-3">گل خورده</th>}
                <th className="p-3">تفاضل</th>
                <th className="p-3 font-black text-slate-800">امتیاز</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const name = teamName(row?.team?.name);
                const gd = Number(row?.goalsDiff || 0);

                return (
                  <tr
                    key={`${row?.team?.id || name}-${index}`}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 text-center font-black text-slate-400">
                      {row?.rank ?? index + 1}
                    </td>
                    <td className="sticky right-0 bg-white p-3">
                      <Link
                        href={
                          row?.team?.id
                            ? `/teams/${row.team.id}`
                            : `/teams?search=${encodeURIComponent(row?.team?.name || "")}`
                        }
                        className="font-black text-slate-900"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="p-3 text-center">
                      {row?.all?.played ?? 0}
                    </td>
                    {!summary && (
                      <>
                        <td className="p-3 text-center">{row?.all?.win ?? 0}</td>
                        <td className="p-3 text-center">{row?.all?.draw ?? 0}</td>
                        <td className="p-3 text-center">
                          {row?.all?.lose ?? row?.all?.loss ?? 0}
                        </td>
                        <td className="p-3 text-center">
                          {row?.all?.goals?.for ?? 0}
                        </td>
                        <td className="p-3 text-center">
                          {row?.all?.goals?.against ?? 0}
                        </td>
                      </>
                    )}
                    <td
                      className={`p-3 text-center font-bold ${
                        gd > 0
                          ? "text-emerald-600"
                          : gd < 0
                            ? "text-rose-600"
                            : "text-slate-500"
                      }`}
                    >
                      {gd > 0 ? "+" : ""}
                      {gd}
                    </td>
                    <td className="p-3 text-center font-black text-slate-950">
                      {row?.points ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!rows.length && (
            <div className="p-10 text-center text-xs text-slate-400">
              جدول این لیگ فعلاً از منبع معتبر دریافت نشد.
            </div>
          )}
        </div>
      </section>
    );
  };

  const Matches = () => (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-black">بازی‌های لیگ</h2>
        <p className="mt-1 text-[10px] text-slate-400">
          برنامه و نتایج دریافت‌شده از منبع مسابقات
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {visibleMatches.map((match, index) => {
          const live = isLive(match);
          const home = teamName(match.home);
          const away = teamName(match.away);

          return (
            <Link
              href={`/matches/${match.id}`}
              key={`${match.id}-${index}`}
              className="grid grid-cols-[72px_1fr_54px] items-center gap-2 px-4 py-3 hover:bg-slate-50"
            >
              <div className="text-center">
                <b className="block text-[10px]">
                  {live
                    ? "زنده"
                    : match.statusShort === "NS"
                      ? faTime(match.date)
                      : faDate(match.date)}
                </b>
                <span className="text-[8px] text-slate-400">
                  {live
                    ? `${match.elapsed ? `${match.elapsed}′` : "LIVE"}`
                    : match.statusShort === "NS"
                      ? faDate(match.date)
                      : "پایان"}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_46px_1fr] items-center gap-2 text-[10px] sm:text-[11px]">
                <span className="truncate text-left font-bold">{home}</span>
                <b className={live ? "text-center text-rose-600" : "text-center"}>
                  {match.statusShort === "NS"
                    ? "—"
                    : `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`}
                </b>
                <span className="truncate text-right font-bold">{away}</span>
              </div>

              <span
                className={`text-center text-[8px] font-bold ${
                  live ? "text-rose-600" : "text-slate-400"
                }`}
              >
                {live ? "زنده" : match.statusShort === "NS" ? "آینده" : "نتیجه"}
              </span>
            </Link>
          );
        })}

        {!visibleMatches.length && (
          <p className="py-10 text-center text-xs text-slate-400">
            برنامه یا نتیجه‌ای از منبع معتبر در دسترس نیست.
          </p>
        )}
      </div>
    </section>
  );

  const Stats = () => (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-black">
          آمار رقابت · فصل {seasonLabel(season)}
        </h2>
        <p className="mt-1 text-[10px] text-slate-400">{metadataText}</p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
        {[
          ["تیم‌ها", rows.length, Users],
          ["بازی‌ها", totalMatches, CalendarDays],
          ["گل‌ها", totalGoals, Goal],
          [
            "میانگین گل",
            totalMatches ? (totalGoals / totalMatches).toFixed(2) : "—",
            Activity,
          ],
        ].map(([label, value, Icon]) => (
          <div key={label} className="bg-white p-4">
            <Icon size={16} className="text-slate-500" />
            <span className="mt-2 block text-[9px] text-slate-400">{label}</span>
            <b className="mt-1 block text-xl">{value || "—"}</b>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="grid gap-2 p-4 sm:grid-cols-3">
          {[
            [bestAttack, "بهترین حمله", bestAttack?.all?.goals?.for, "گل"],
            [bestDefense, "بهترین دفاع", bestDefense?.all?.goals?.against, "گل خورده"],
            [bestWins, "بیشترین برد", bestWins?.all?.win, "برد"],
          ]
            .filter((item) => item[0])
            .map(([row, label, value, suffix]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span className="text-[9px] text-slate-400">{label}</span>
                <strong className="mt-1 block text-xs">
                  {teamName(row.team?.name)}
                </strong>
                <span className="text-[9px] text-slate-600">
                  {value} {suffix}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-black">
            <Goal size={15} />
            برترین گلزنان
          </h3>
          {scorers.slice(0, 5).map((item, index) => (
            <div
              key={item?.player?.id || index}
              className="flex items-center justify-between border-b border-slate-100 py-2 text-[10px]"
            >
              <span>
                <b className="ml-2 text-slate-400">{index + 1}</b>
                {teamName(item?.player?.name)}
              </span>
              <strong>
                {item?.statistics?.[0]?.goals?.total ?? item?.goals ?? "—"}
              </strong>
            </div>
          ))}
          {!scorers.length && (
            <p className="text-[10px] text-slate-400">
              آمار گلزنان از منبع معتبر در دسترس نیست.
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-black">
            <Hand size={15} />
            برترین پاسورها
          </h3>
          {assists.slice(0, 5).map((item, index) => (
            <div
              key={item?.player?.id || index}
              className="flex items-center justify-between border-b border-slate-100 py-2 text-[10px]"
            >
              <span>
                <b className="ml-2 text-slate-400">{index + 1}</b>
                {teamName(item?.player?.name)}
              </span>
              <strong>
                {item?.statistics?.[0]?.goals?.assists ?? item?.assists ?? "—"}
              </strong>
            </div>
          ))}
          {!assists.length && (
            <p className="text-[10px] text-slate-400">
              آمار پاسورها از منبع معتبر در دسترس نیست.
            </p>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <main className="fot-shell min-h-screen pb-12" dir="rtl">
      <div className="fot-container space-y-3 sm:space-y-4">
        <header className="flex items-center gap-2.5 py-1">
          <Link
            href="/leagues"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"
            aria-label="بازگشت به لیگ‌ها"
          >
            <ArrowRight size={18} />
          </Link>

          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {leagueId ? (
              <img
                src={`https://media.api-sports.io/football/leagues/${leagueId}.png`}
                alt=""
                className="h-8 w-8 object-contain"
              />
            ) : (
              <span>{league.flag || "🏆"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black sm:text-base">
              {league.leagueName}
            </h1>
            <p className="truncate text-[9px] text-slate-500">
              {entry?.name || league.apiCountry} · فصل {seasonLabel(season)}
            </p>
          </div>

          <FavoriteButton type="league" name={league.leagueName || ""} />
        </header>

        <nav
          className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
          aria-label="بخش‌های لیگ"
        >
          {TABS.map(([id, label, Icon]) => (
            <Link
              key={id}
              href={`/leagues/${params.slug}?tab=${id}`}
              className={`flex items-center justify-center gap-1 rounded-xl py-2.5 text-[9px] font-black ${
                tab === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {warning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[9px] text-amber-700">
            {warning}
          </div>
        )}

        {source !== "none" && (
          <div className="text-center text-[8px] font-bold text-slate-400">
            منبع: <span dir="ltr">{sourceLabel(source)}</span>
          </div>
        )}

        {tab === "table" && (hasVerifiedTable ? <Table /> : <section className="rounded-[22px] border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">جدول این لیگ فعلاً از منبع معتبر و زمان‌دار دریافت نشد.</section>)}
        {tab === "matches" && <Matches />}
        {tab === "stats" && <Stats />}
      </div>
    </main>
  );
}
