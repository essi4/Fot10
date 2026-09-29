"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  MessageCircle,
  Radio,
  Share2,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import visualizationNormalizer from "../../../lib/match-visualization-normalizer.cjs";
import { teamName } from "../../../lib/team-identity";
import retroPitchRenderer from "../../../lib/retro-pitch-renderer.cjs";
import { sameMatch } from "../../../lib/football360-live.cjs";

const { buildVisualizationFeed } = visualizationNormalizer;
const { selectRenderablePitchEvents } = retroPitchRenderer;

const DEMO = {
  details: {
    fixture: { status: { short: "FT", elapsed: 90 } },
    teams: {
      home: { id: "demo-home", name: "انگلیس", logo: "" },
      away: { id: "demo-away", name: "اسپانیا", logo: "" },
    },
    goals: { home: 2, away: 1 },
    league: { name: "نمونه نمایشی" },
  },
  events: [
    ["goal", 42, "انگلیس", "گل انگلیس", "⚽"],
    ["card", 55, "اسپانیا", "کارت زرد اسپانیا", "🟨"],
    ["substitution", 67, "اسپانیا", "تعویض اسپانیا", "🔄"],
    ["var", 73, "انگلیس", "VAR", "VAR"],
    ["goal", 84, "انگلیس", "گل انگلیس", "⚽"],
  ],
};

function phaseOf(details) {
  const s = String(details?.fixture?.status?.short || details?.statusShort || "").toUpperCase();
  if (["FT", "AET", "PEN"].includes(s)) return "finished";
  if (s === "HT") return "halftime";
  if (["1H", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"].includes(s)) return "live";
  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(s)) return "cancelled";
  return "upcoming";
}

function phaseLabel(phase) {
  return phase === "live"
    ? "زنده"
    : phase === "halftime"
      ? "نیمه‌وقت"
      : phase === "finished"
        ? "پایان‌یافته"
        : phase === "cancelled"
          ? "لغو/متوقف"
          : "شروع نشده";
}

function phaseClass(phase) {
  if (phase === "live") return "bg-emerald-400/10 text-emerald-200 border-emerald-300/15";
  if (phase === "halftime") return "bg-amber-400/10 text-amber-200 border-amber-300/15";
  if (phase === "finished") return "bg-slate-400/10 text-slate-300 border-white/10";
  if (phase === "cancelled") return "bg-red-400/10 text-red-200 border-red-300/15";
  return "bg-cyan-400/10 text-cyan-200 border-cyan-300/15";
}

function toFaDateTime(dateValue) {
  if (!dateValue) return { date: "—", time: "—" };
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "—" };
  return {
    date: new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(date),
    time: new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function commentsLabel(match) {
  const value = Number(match?.commentsCount ?? match?.comments);
  return Number.isFinite(value) ? `${value.toLocaleString("fa-IR")} نظر` : "نظرات";
}

const TEAM_NAME_FA = {
  Turkey: "ترکیه",
  Türkiye: "ترکیه",
  Italy: "ایتالیا",
  Spain: "اسپانیا",
  England: "انگلیس",
  Germany: "آلمان",
  France: "فرانسه",
  Netherlands: "هلند",
  Portugal: "پرتغال",
  Brazil: "برزیل",
  Argentina: "آرژانتین",
  Iran: "ایران",
  "Saudi Arabia": "عربستان",
};

function displayTeamName(name) {
  return TEAM_NAME_FA[name] || teamName(name);
}

function teamCountry(name) {
  const text = String(name || "");
  if (/turkey|türkiye|ترکیه/i.test(text)) return "ترکیه";
  if (/italy|ایتالیا/i.test(text)) return "ایتالیا";
  if (/iran|ایران/i.test(text)) return "ایران";
  if (/england|انگلیس/i.test(text)) return "انگلیس";
  if (/spain|اسپانیا/i.test(text)) return "اسپانیا";
  if (/germany|آلمان/i.test(text)) return "آلمان";
  if (/france|فرانسه/i.test(text)) return "فرانسه";
  if (/netherlands|هلند/i.test(text)) return "هلند";
  if (/portugal|پرتغال/i.test(text)) return "پرتغال";
  if (/saudi|arabia|عربستان/i.test(text)) return "عربستان";
  if (/argentina|آرژانتین/i.test(text)) return "آرژانتین";
  if (/brazil|brasil|برزیل/i.test(text)) return "برزیل";
  return "—";
}

const COMPETITION_FA = {
  "UEFA Nations League": "لیگ ملت‌های اروپا",
  "UEFA National League": "لیگ ملت‌های اروپا",
};

function EventIcon({ type }) {
  const labels = {
    goal: "⚽",
    card: "🟨",
    red_card: "🟥",
    substitution: "🔄",
    var: "VAR",
    penalty: "P",
    missed_penalty: "×",
    corner: "⌜",
    shot: "🎯",
  };
  return <span className="text-[12px] font-black">{labels[type] || "•"}</span>;
}

function eventTeamSide(canonical, match) {
  const home = String(match?.teams?.home?.id ?? match?.teams?.home?.name ?? "");
  const away = String(match?.teams?.away?.id ?? match?.teams?.away?.name ?? "");
  const team = String(canonical?.acting_team ?? "");
  if (team && team === home) return "home";
  if (team && team === away) return "away";
  return "";
}

function TeamBlock({ team, score, align = "center" }) {
  const sourceName = team?.name || "—";
  const name = displayTeamName(sourceName);
  const country = team?.country || teamCountry(sourceName);
  const logo = team?.logo || team?.image || "";
  return (
    <div className={`min-w-0 text-${align}`}>
      <span className="block truncate text-[9px] font-bold text-slate-500">{country}</span>
      <div className="mx-auto mt-1 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
        {logo ? (
          <img src={logo} alt={`لوگوی ${name}`} className="h-10 w-10 object-contain" />
        ) : (
          <Trophy size={20} className="text-slate-600" />
        )}
      </div>
      <b className="mt-2 block truncate text-sm font-black text-white">{name}</b>
      <strong className="mt-1 block text-3xl font-black tabular-nums text-white">
        {score}
      </strong>
    </div>
  );
}

const HOME_RETRO_POSITIONS = [
  [7, 50], [17, 25], [17, 50], [17, 75], [30, 18], [32, 40], [32, 60], [30, 82], [49, 32], [49, 68], [62, 50],
];
const AWAY_RETRO_POSITIONS = HOME_RETRO_POSITIONS.map(([x, y]) => [100 - x, y]);

function RetroPlayerSprite({ number = "", side, decorative = false }) {
  const home = side === "home";
  return (
    <span
      className={"retro-sprite " + (home ? "retro-sprite-home" : "retro-sprite-away")}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : (number ? "بازیکن شماره " + number : "بازیکن")}
    >
      <span className="retro-sprite-pixel retro-sprite-skin" aria-hidden="true" />
      <span className="retro-sprite-pixel retro-sprite-shirt" aria-hidden="true" />
      <span className="retro-sprite-pixel retro-sprite-legs" aria-hidden="true" />
      {number ? <span className="retro-sprite-number">{number}</span> : null}
    </span>
  );
}

function lineupNumbers(lineups, teamId) {
  const team = (Array.isArray(lineups) ? lineups : []).find((entry) => String(entry?.team?.id ?? "") === String(teamId ?? ""));
  const players = Array.isArray(team?.startXI) ? team.startXI : [];
  const numbers = players.map((entry) => entry?.player?.number ?? entry?.number).filter((value) => value !== null && value !== undefined);
  return numbers.slice(0, 11);
}

function RetroBroadcastPlayers({ match, live, lineups }) {
  if (!live) return null;
  const homeNumbers = lineupNumbers(lineups, match?.teams?.home?.id);
  const awayNumbers = lineupNumbers(lineups, match?.teams?.away?.id);
  return (
    <div className="absolute inset-0 pointer-events-none" aria-label="چیدمان پیکسلی نمایشی">
      {HOME_RETRO_POSITIONS.map(([x, y], index) => (
        <div key={`h-${index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
          <RetroPlayerSprite number={homeNumbers[index] ?? index + 1} side="home" />
        </div>
      ))}
      {AWAY_RETRO_POSITIONS.map(([x, y], index) => (
        <div key={`a-${index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
          <RetroPlayerSprite number={awayNumbers[index] ?? index + 1} side="away" />
        </div>
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[6px] font-black text-[#f5f1dc]/80 backdrop-blur">
        چیدمان پیکسلی · نمایشی؛ موقعیت لحظه‌ای نیست
      </div>
    </div>
  );
}

function RetroPitch({ events, selectedEvent, match, football360Linked, lineups }) {
  const canonicalEvents = events.map((e) => e?.canonicalEvent).filter(Boolean);
  const located = selectRenderablePitchEvents(canonicalEvents);
  const selectedCanonical = selectedEvent?.canonicalEvent;
  const selectedLocated = located.find((e) => e.event_id === selectedCanonical?.event_id);
  const homeName = match?.teams?.home?.name || "میزبان";
  const awayName = match?.teams?.away?.name || "مهمان";

  return (
    <div className="retro-pitch-card">
      <div className="retro-pitch-heading">
        <span className="retro-team-label retro-team-label-home">{homeName}</span>
        <span className="retro-micro-label">EVENT MAP · REAL DATA</span>
        <span className="retro-team-label retro-team-label-away">{awayName}</span>
      </div>

      <div className="retro-live-pitch">
        {[0, 1, 2, 3, 4, 5].map((stripe) => (
          <span key={stripe} className={"retro-pitch-stripe " + (stripe % 2 ? "retro-pitch-stripe-light" : "")} aria-hidden="true" />
        ))}
        <div className="retro-field-border" aria-hidden="true" />
        <div className="retro-halfway" aria-hidden="true" />
        <div className="retro-center-circle" aria-hidden="true" />
        <div className="retro-box retro-box-left" aria-hidden="true" />
        <div className="retro-box retro-box-right" aria-hidden="true" />
        <div className="retro-six-yard retro-six-yard-left" aria-hidden="true" />
        <div className="retro-six-yard retro-six-yard-right" aria-hidden="true" />

        <RetroBroadcastPlayers match={match} live={phaseOf(match) === "live"} lineups={lineups} />

        {located.map((p) => {
          const side = eventTeamSide(p, match);
          const active = p.event_id === selectedCanonical?.event_id;
          return (
            <div
              key={p.event_id}
              className={"retro-event-marker " + (active ? "retro-event-marker-active" : "")}
              style={{ left: p.coordinates.x + "%", top: p.coordinates.y + "%" }}
              title={(p.game_clock || "—") + " · " + p.event_type}
            >
              <span className="retro-event-core"><EventIcon type={p.event_type} /></span>
              <span className={"retro-event-team " + (side === "home" ? "retro-event-team-home" : side === "away" ? "retro-event-team-away" : "")} aria-hidden="true" />
            </div>
          );
        })}

        {selectedLocated && (
          <div
            className="retro-selected-marker"
            style={{ left: selectedLocated.coordinates.x + "%", top: selectedLocated.coordinates.y + "%" }}
            aria-hidden="true"
          />
        )}

        {!located.length && (
          <div className="retro-pitch-empty-note">
            <span className="retro-empty-lamp" aria-hidden="true" />
            <b>مختصات معتبر رویداد موجود نیست</b>
            <span>رویداد بدون مختصات روی زمین قرار نمی‌گیرد.</span>
          </div>
        )}

        <div className="retro-pitch-status">
          <span>PITCH</span>
          <span>{located.length} موقعیت واقعی</span>
        </div>

        <div className="retro-crt-lines" aria-hidden="true" />
        <div className="retro-crt-noise" aria-hidden="true" />
      </div>
    </div>
  );
}

function LiveEmptyState({ checkedAt }) {
  const checkedLabel = checkedAt
    ? new Intl.DateTimeFormat("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(checkedAt))
    : "در حال بررسی";

  return (
    <section className="retro-empty-state" data-testid="live-empty-state">
      <div className="retro-signal-bar">
        <div className="retro-signal-copy">
          <span className="retro-signal-lamp" aria-hidden="true" />
          <div>
            <b>اسکن پخش زنده</b>
            <span>در حال جست‌وجوی مسابقه‌های در حال پخش…</span>
          </div>
        </div>
        <span className="retro-live-label">● LIVE</span>
      </div>

      <div className="retro-monitor-frame">
        <div className="retro-monitor-bezel" aria-hidden="true">
          <span>FOT10</span>
          <span>LIVE BROADCAST</span>
        </div>

        <div className="retro-monitor-screen">
          {[0, 1, 2, 3, 4, 5].map((stripe) => (
            <span key={stripe} className={"retro-pitch-stripe " + (stripe % 2 ? "retro-pitch-stripe-light" : "")} aria-hidden="true" />
          ))}
          <div className="retro-field-border" aria-hidden="true" />
          <div className="retro-halfway" aria-hidden="true" />
          <div className="retro-center-circle" aria-hidden="true" />
          <div className="retro-box retro-box-left" aria-hidden="true" />
          <div className="retro-box retro-box-right" aria-hidden="true" />
          <div className="retro-six-yard retro-six-yard-left" aria-hidden="true" />
          <div className="retro-six-yard retro-six-yard-right" aria-hidden="true" />

          <div className="retro-empty-player retro-empty-player-blue retro-empty-player-1" aria-hidden="true">
            <RetroPlayerSprite side="home" decorative />
          </div>
          <div className="retro-empty-player retro-empty-player-blue retro-empty-player-2" aria-hidden="true">
            <RetroPlayerSprite side="home" decorative />
          </div>
          <div className="retro-empty-player retro-empty-player-red retro-empty-player-3" aria-hidden="true">
            <RetroPlayerSprite side="away" decorative />
          </div>
          <div className="retro-empty-player retro-empty-player-red retro-empty-player-4" aria-hidden="true">
            <RetroPlayerSprite side="away" decorative />
          </div>

          <div className="retro-empty-ball" aria-hidden="true">
            <span className="retro-ball-pixel" />
          </div>

          <div className="retro-screen-topline">
            <span className="retro-pixel-caption">RETRO PITCH</span>
            <span className="retro-pixel-caption">WAITING FOR SIGNAL</span>
          </div>

          <div className="retro-waiting-copy">
            <span className="retro-waiting-kicker">FOT10 · LIVE SIGNAL</span>
            <b>منتظر سیگنال زنده هستیم</b>
            <span>مسابقه واقعی که سیگنال زنده بگیرد، همین قاب به پخش زنده واقعی تبدیل می‌شود.</span>
          </div>

          <div className="retro-screen-status">
            <span className="retro-status-lamp" aria-hidden="true" />
            <span>WAITING</span>
          </div>

          <div className="retro-crt-lines" aria-hidden="true" />
          <div className="retro-crt-noise" aria-hidden="true" />
          <div className="retro-crt-vignette" aria-hidden="true" />
        </div>

        <div className="retro-monitor-foot" aria-hidden="true">
          <span>CHANNEL 10</span>
          <span>SCAN</span>
        </div>
      </div>

      <div className="retro-last-check">
        <span>آخرین بررسی سیگنال</span>
        <strong dir="ltr">{checkedLabel}</strong>
      </div>
    </section>
  );
}

function Visualization() {
  const sp = useSearchParams();
  const enabled = true;
  const demo = sp.get("demo") === "1";
  const initialFixture = sp.get("fixture") || "";

  const [selected, setSelected] = useState(initialFixture);
  const [details, setDetails] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [rawEvents, setRawEvents] = useState([]);
  const [index, setIndex] = useState(0);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  const [lastMatchDataAt, setLastMatchDataAt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [football360Live, setFootball360Live] = useState([]);
  const [liveFixtures, setLiveFixtures] = useState([]);
  const [football360CheckedAt, setFootball360CheckedAt] = useState(0);

  const activeDemo = demo;
  const broadcastCandidates = useMemo(() => {
    const merged = football360Live.map((item) => ({ ...item, _source: "football360" }));
    for (const item of liveFixtures) {
      if (!merged.some((candidate) => sameMatch(candidate, item))) {
        merged.push({ ...item, _source: "api-football" });
      }
    }
    return merged;
  }, [football360Live, liveFixtures]);

  const match = activeDemo
    ? DEMO.details
    : details || broadcastCandidates.find((x) => String(x.id) === String(selected));

  useEffect(() => {
    if (activeDemo || selected || !broadcastCandidates.length) return;
    const first = broadcastCandidates[0];
    if (first?.id) setSelected(String(first.id));
  }, [activeDemo, broadcastCandidates, selected]);

  useEffect(() => {
    if (activeDemo || !broadcastCandidates.length) return;
    if (!broadcastCandidates.some((item) => String(item.id) === String(selected))) {
      setSelected(String(broadcastCandidates[0]?.id || ""));
      setDetails(null);
      setLineups([]);
      setRawEvents([]);
    }
  }, [activeDemo, broadcastCandidates, selected]);

  const demoEvents = useMemo(
    () =>
      DEMO.events.map(([type, minute, team, label, icon]) => ({
        type,
        minute,
        team,
        label,
        icon,
      })),
    [],
  );

  const feedSource = activeDemo ? demoEvents : rawEvents;
  const sequence = useMemo(
    () => buildVisualizationFeed(feedSource, match, activeDemo),
    [feedSource, match, activeDemo],
  );
  const event = sequence[Math.min(index, Math.max(sequence.length - 1, 0))] || sequence[0] || null;
  const phase = stale ? "stale" : activeDemo ? "finished" : phaseOf(match);
  const phaseForUi = phase === "stale" ? "live" : phase;
  const football360Linked = Boolean(!activeDemo && match && football360Live.some((candidate) => sameMatch(match, candidate)));

  useEffect(() => {
    if (!enabled || activeDemo) return;
    loadFootball360Live();
    const timer = setInterval(loadFootball360Live, 30000);
    return () => clearInterval(timer);
  }, [enabled, activeDemo]);

  useEffect(() => {
    if (!enabled || activeDemo || !selected) return;
    setIndex(0);
    loadMatch(selected);
    const timer = setInterval(() => loadMatch(selected, true), 30000);
    return () => clearInterval(timer);
  }, [enabled, activeDemo, selected]);

  useEffect(() => {
    if (!activeDemo && sequence.length) setIndex(sequence.length - 1);
  }, [activeDemo, sequence.length]);

  useEffect(() => {
    if (!enabled || activeDemo || !lastMatchDataAt) return;
    const timer = setInterval(() => {
      const status = String(match?.fixture?.status?.short || "").toUpperCase();
      const terminal = ["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"].includes(status);
      if (!terminal && Date.now() - lastMatchDataAt > 20000) setStale(true);
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled, activeDemo, lastMatchDataAt, match]);

  async function loadFootball360Live() {
    try {
      const [signalResponse, liveResponse] = await Promise.all([
        fetch("/api/football360/live", { cache: "no-store" }),
        fetch("/api/football/live", { cache: "no-store" }),
      ]);
      const [signalJson, liveJson] = await Promise.all([
        signalResponse.json(),
        liveResponse.json(),
      ]);

      const signals = signalResponse.ok && Array.isArray(signalJson?.matches) ? signalJson.matches : [];
      const verifiedLive = liveResponse.ok && Array.isArray(liveJson?.matches) ? liveJson.matches : [];

      setFootball360Live(signals);
      setLiveFixtures(verifiedLive);
      setFootball360CheckedAt(Date.now());
    } catch {
      setFootball360Live([]);
      setLiveFixtures([]);
      setFootball360CheckedAt(Date.now());
    }
  }

  function buildLiveFallbackDetails(signal) {
    if (!signal) return null;
    return {
      fixture: {
        status: { short: signal.statusShort || "LIVE", elapsed: signal.elapsed ?? null },
        date: signal.date || null,
      },
      teams: {
        home: { id: signal.homeId ?? `live-home-${signal.id || signal.home}`, name: signal.home, logo: signal.homeLogo || "" },
        away: { id: signal.awayId ?? `live-away-${signal.id || signal.away}`, name: signal.away, logo: signal.awayLogo || "" },
      },
      goals: { home: signal.homeScore ?? null, away: signal.awayScore ?? null },
      league: { name: signal.league || "پخش زنده" },
    };
  }


  async function loadMatch(id, quiet = false) {
    if (!id) return;
    const liveCandidate = broadcastCandidates.find((item) => String(item.id || "") === String(id));
    if (liveCandidate?._source === "football360" && !liveCandidate.sourceMatchId) {
      const fallbackDetails = buildLiveFallbackDetails(liveCandidate);
      setDetails(fallbackDetails);
      setLineups([]);
      setRawEvents([]);
      setLastMatchDataAt(Date.now());
      setStale(false);
      setError("");
      return;
    }

    const providerId = liveCandidate?.sourceMatchId || id;
    try {
      const [detailsResponse, eventsResponse, lineupsResponse] = await Promise.all([
        fetch(`/api/football/fixture?id=${providerId}&section=details`, { cache: "no-store" }),
        fetch(`/api/football/fixture?id=${providerId}&section=events`, { cache: "no-store" }),
        fetch(`/api/football/fixture?id=${providerId}&section=lineups`, { cache: "no-store" }),
      ]);

      const [detailsJson, eventsJson, lineupsJson] = await Promise.all([
        detailsResponse.json(),
        eventsResponse.json(),
        lineupsResponse.json(),
      ]);

      if (!detailsResponse.ok || !detailsJson?.ok || !detailsJson?.data) {
        if (!liveCandidate) throw new Error(detailsJson?.error || "جزئیات مسابقه در دسترس نیست.");
        const fallbackDetails = buildLiveFallbackDetails(liveCandidate);
        setLineups([]);
        setRawEvents([]);
        setLastMatchDataAt(Date.now());
        setStale(false);
        setError("");
        return;
      }

      setDetails(detailsJson.data);
      setLineups(Array.isArray(lineupsJson?.data) ? lineupsJson.data : []);
      setRawEvents(Array.isArray(eventsJson?.data) ? eventsJson.data : []);
      setLastMatchDataAt(Date.now());
      setStale(false);
      setError("");
    } catch (e) {
      setError(e?.message || "داده مسابقه دریافت نشد.");
      if (!quiet && lastMatchDataAt && Date.now() - lastMatchDataAt > 20000) setStale(true);
    }
  }


  function selectFixture(id) {
    setSelected(String(id));
    setDetails(null);
    setRawEvents([]);
    setLineups([]);
    const url = new URL(window.location.href);
    url.searchParams.set("fixture", String(id));
    url.searchParams.delete("demo");
    window.history.replaceState(null, "", url);
  }

  async function shareMatch() {
    if (!match) return;
    const title = `پخش بازی ${match?.teams?.home?.name || match?.home || ""} و ${match?.teams?.away?.name || match?.away || ""}`;
    const url = window.location.href;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setError("لینک مسابقه کپی شد.");
      }
    } catch (e) {
      if (e?.name !== "AbortError") setError("اشتراک‌گذاری انجام نشد.");
    } finally {
      setSharing(false);
    }
  }

  if (!enabled) {
    return (
      <section className="glass rounded-3xl p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-300" size={28} />
        <h2 className="font-black text-slate-200">نمایش مسابقه غیرفعال است</h2>
        <p className="mt-2 text-xs text-slate-500">برای Preview می‌توان با viz=1 فعالش کرد.</p>
      </section>
    );
  }

  const scoreHomeValue = match?.goals?.home ?? match?.homeScore;
  const scoreAwayValue = match?.goals?.away ?? match?.awayScore;
  const scoreHome = Number.isFinite(Number(scoreHomeValue)) ? Number(scoreHomeValue) : "—";
  const scoreAway = Number.isFinite(Number(scoreAwayValue)) ? Number(scoreAwayValue) : "—";
  const homeTeam = match?.teams?.home || { name: match?.home || "میزبان", logo: match?.homeLogo || "" };
  const awayTeam = match?.teams?.away || { name: match?.away || "مهمان", logo: match?.awayLogo || "" };
  const homeTeamName = displayTeamName(homeTeam.name || "میزبان");
  const awayTeamName = displayTeamName(awayTeam.name || "مهمان");
  const dateTime = toFaDateTime(match?.fixture?.date || match?.date);
  const competitionRaw = match?.league?.name || match?.league || "—";
  const competition = COMPETITION_FA[competitionRaw] || competitionRaw;
  const venue = match?.fixture?.venue?.name || "—";
  const currentMinute = event?.minuteLabel || (match?.fixture?.status?.elapsed != null ? `${match.fixture.status.elapsed}'` : "—");
  const hasRenderableMatch = Boolean(match || activeDemo);

  return (
    <section className="space-y-3">
      {!activeDemo && broadcastCandidates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="انتخاب مسابقه زنده">
          {broadcastCandidates.map((fixture) => {
            const fromFootball360 = fixture._source === "football360";
            return (
              <button
                type="button"
                key={`${fixture._source}-${fixture.id}`}
                onClick={() => selectFixture(fixture.id)}
                className={`min-w-[180px] shrink-0 rounded-2xl border p-2.5 text-right touch-manipulation ${String(fixture.id) === String(selected) ? "border-cyan-300/25 bg-cyan-400/10" : "border-white/7 bg-white/[.02]"}`}
              >
                <span className="block truncate text-[8px] text-slate-500">
                  {fromFootball360 ? "۳۶۰ · سیگنال پخش" : "LIVE · داده زنده"} · {fixture.statusShort || "LIVE"}
                </span>
                <span className="mt-1 block truncate text-[9px] font-black text-slate-300">
                  {fixture.home || "—"} · {fixture.away || "—"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-3 text-[9px] text-red-200">
          {error}
        </div>
      )}

      {activeDemo && (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-3 text-[9px] text-amber-100">
          DEMO MATCH · فقط برای QA رابط؛ داده نمایشی است و به‌عنوان مسابقه واقعی ارائه نمی‌شود.
        </div>
      )}

      {!hasRenderableMatch && (
        <LiveEmptyState checkedAt={football360CheckedAt} />
      )}

      {hasRenderableMatch && (
        <>
          <article className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[.025]">
            <div className="border-b border-white/7 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Radio size={15} className="text-cyan-300" />
                  <span className="text-[9px] font-black tracking-[0.12em] text-cyan-200">MATCH CENTER</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {football360Linked ? (
                    <span className="rounded-full border border-amber-300/15 bg-amber-400/10 px-2.5 py-1 text-[8px] font-black text-amber-200">
                      ۳۶۰ · پخش زنده
                    </span>
                  ) : !activeDemo ? (
                    <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2.5 py-1 text-[8px] font-black text-cyan-200">
                      LIVE · داده واقعی
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${phase === "stale" ? "border-amber-300/15 bg-amber-400/10 text-amber-200" : phaseClass(phaseForUi)}`}
                  >
                    {phase === "stale" ? "داده قدیمی" : phaseLabel(phaseForUi)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 text-center">
                <TeamBlock team={homeTeam} score={scoreHome} />
                <div className="pt-5">
                  <span className="text-xl font-black tabular-nums text-slate-300">{currentMinute}</span>
                  <span className="mt-1 block text-[8px] text-slate-600">زمان مسابقه</span>
                </div>
                <TeamBlock team={awayTeam} score={scoreAway} />
              </div>

              <div className="mt-4 rounded-2xl border border-white/7 bg-black/15 px-3 py-3 text-center">
                <h1 className="text-sm font-black text-white">
                  پخش بازی {homeTeamName} و {awayTeamName}
                </h1>
                <div className="mt-2 flex items-center justify-center gap-3 text-[8px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={12} />
                    {commentsLabel(match)}
                  </span>
                  <button
                    type="button"
                    onClick={shareMatch}
                    disabled={sharing}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-white/8 bg-white/[.03] px-3 text-[8px] font-black text-slate-300 touch-manipulation"
                  >
                    <Share2 size={12} />
                    {sharing ? "در حال اشتراک‌گذاری…" : "اشتراک‌گذاری"}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <section className="rounded-3xl border border-white/10 bg-white/[.025] p-3.5">
            <div className="mb-3">
              <h2 className="text-xs font-black text-slate-200">هدر مسابقه</h2>
              <p className="mt-1 text-[8px] text-slate-600">نام تیم‌ها، لوگو، نتیجه و وضعیت فقط از داده مسابقه خوانده می‌شوند.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <MetaRow icon={CalendarDays} label="تاریخ پخش" value={dateTime.date} />
              <MetaRow icon={Clock3} label="زمان پخش" value={dateTime.time} />
              <MetaRow icon={Trophy} label="رقابت/لیگ" value={competition} />
              <MetaRow icon={Radio} label="وضعیت بازی" value={phase === "stale" ? "داده تازه دریافت نشد" : phaseLabel(phaseForUi)} />
              {venue !== "—" && <MetaRow icon={CalendarDays} label="ورزشگاه" value={venue} />}
            </div>
          </section>

          <RetroPitch events={sequence} selectedEvent={event} match={match || DEMO.details} football360Linked={football360Linked} lineups={lineups} />

          <section className="glass rounded-2xl p-3">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-cyan-300" />
                  <h2 className="text-[10px] font-black">Timeline رویدادها</h2>
                </div>
                <span className="mt-0.5 block text-[7px] text-slate-600">
                  {activeDemo ? "DEMO MATCH" : "فید خواندنی مسابقه"}
                </span>
              </div>
              <span className="text-[8px] text-slate-600">{sequence.length} رویداد</span>
            </div>

            <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
              {sequence.length ? (
                sequence.map((item, i) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-right touch-manipulation ${i === index ? "border-cyan-400/15 bg-cyan-400/[.05]" : "border-white/5 bg-white/[.02]"}`}
                  >
                    <EventIcon type={item.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9px] font-bold text-slate-300">{item.label}</span>
                      {(item.player || item.assist) && (
                        <span className="block truncate text-[7px] text-slate-600">
                          {item.player || ""}{item.assist ? ` · پاس: ${item.assist}` : ""}
                        </span>
                      )}
                    </span>
                    <span className="text-[8px] font-black text-slate-500">{item.minuteLabel}</span>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-white/7 bg-white/[.02] px-3 py-4 text-center text-[9px] text-slate-500">
                  هنوز رویداد معتبری برای این مسابقه دریافت نشده است.
                </div>
              )}
            </div>
          </section>

          {event?.canonicalEvent && event.canonicalEvent.coordinates.has_location === false && (
            <div className="rounded-2xl border border-slate-400/10 bg-slate-400/[.03] px-3 py-2 text-[8px] text-slate-500">
              این رویداد مختصات معتبر ندارد؛ در Timeline نمایش داده می‌شود اما روی Pitch نقطه‌ای برای آن ساخته نمی‌شود.
            </div>
          )}

          {stale && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] text-amber-200">
              داده تازه دریافت نشد؛ نمایش زنده متوقف می‌شود تا وضعیت جعلی نشان داده نشود.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setError("گزارش خرابی ثبت شد؛ این نسخه هنوز به سامانه پشتیبانی متصل نیست.")}
              className="min-h-[48px] rounded-2xl border border-red-300/10 bg-red-400/[.04] px-3 text-[9px] font-black text-red-200 touch-manipulation"
            >
              <AlertTriangle size={14} className="mx-auto mb-1" />
              گزارش خرابی
            </button>
            <button
              type="button"
              onClick={shareMatch}
              disabled={sharing}
              className="min-h-[48px] rounded-2xl border border-white/8 bg-white/[.03] px-3 text-[9px] font-black text-slate-300 touch-manipulation"
            >
              <Share2 size={14} className="mx-auto mb-1" />
              اشتراک‌گذاری
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/7 bg-black/10 px-3 py-2.5">
      <div className="flex items-center gap-2 text-[8px] text-slate-600">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <b className="mt-1 block truncate text-[10px] text-slate-300">{value || "—"}</b>
    </div>
  );
}

export default function MatchVisualizationPage() {
  return (
    <main className="fot-shell fot-retro-page">
      <div className="fot-container space-y-4 pb-28">
        <header className="flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-slate-100">FOT10 · پخش نوستالژیک</h1>
            <p className="text-[10px] text-slate-500">پخش زنده با حال‌وهوای کنسول‌های قدیمی · داده واقعی</p>
          </div>
        </header>

        <Suspense
          fallback={
            <section className="glass rounded-3xl p-6 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-pulse motion-reduce:animate-none rounded-full bg-cyan-400/20" />
              <p className="text-xs font-bold text-slate-400">در حال آماده‌سازی نمایش مسابقه…</p>
            </section>
          }
        >
          <Visualization />
        </Suspense>
      </div>
    </main>
  );
}
