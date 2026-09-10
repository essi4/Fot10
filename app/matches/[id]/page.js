"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CircleAlert, Goal, MapPin, RefreshCw, Repeat2, Shield, ShieldAlert, Users, WifiOff, Zap } from "lucide-react";

const tabs = [["events", "گزارش زنده", Zap], ["statistics", "آمار", BarChart3], ["lineups", "ترکیب", Users], ["players", "بازیکنان", Shield], ["details", "اطلاعات", MapPin]];

function formatDate(value) { if (!value) return "—"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }); }
function isLive(status) { return ["1H", "HT", "2H", "ET", "P", "BT"].includes(status); }
function statusLabel(status) { const map = { NS: "شروع نشده", TBD: "زمان نامشخص", "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "بین دو وقت اضافه", FT: "پایان بازی", AET: "پایان وقت اضافه", PEN: "پایان پنالتی" }; return map[status] || status || "—"; }
function eventMinute(e) { return `${e?.time?.elapsed ?? "—"}${e?.time?.extra ? `+${e.time.extra}` : ""}'`; }
function eventText(e) { return `${e?.type || ""} ${e?.detail || ""}`.toLowerCase(); }
function isCancelledGoal(e) { return e?.type === "Goal" && /cancel|cancelled|disallowed|var|مردود/i.test(eventText(e)); }
function isPenalty(e) { return /penalty|پنالتی/i.test(eventText(e)); }
function isMissedPenalty(e) { return /penalty.*(missed|saved)|missed.*penalty|پنالتی.*(از دست|مهار)/i.test(eventText(e)); }
function isRedCard(e) { return e?.type === "Card" && /red|second yellow|قرمز/i.test(String(e?.detail || "")); }
function isYellowCard(e) { return e?.type === "Card" && !isRedCard(e); }
function isSubstitution(e) { return e?.type === "subst" || /substitution|تعویض/i.test(String(e?.type || "")); }
function eventMeta(e) {
  if (isCancelledGoal(e)) return { icon: ShieldAlert, label: "گل مردود · VAR", tone: "text-violet-300", box: "border-violet-400/20 bg-violet-400/[.06]" };
  if (e?.type === "Goal" && isPenalty(e)) return { icon: Goal, label: "گل از روی پنالتی", tone: "text-emerald-300", box: "border-emerald-400/20 bg-emerald-400/[.06]" };
  if (e?.type === "Goal") return { icon: Goal, label: "گل", tone: "text-emerald-300", box: "border-emerald-400/20 bg-emerald-400/[.06]" };
  if (isMissedPenalty(e)) return { icon: Goal, label: "پنالتی از دست رفت", tone: "text-amber-300", box: "border-amber-400/20 bg-amber-400/[.05]" };
  if (isPenalty(e)) return { icon: Goal, label: "پنالتی", tone: "text-amber-300", box: "border-amber-400/20 bg-amber-400/[.05]" };
  if (isRedCard(e)) return { icon: CircleAlert, label: "کارت قرمز", tone: "text-rose-300", box: "border-rose-400/20 bg-rose-400/[.05]" };
  if (isYellowCard(e)) return { icon: CircleAlert, label: "کارت زرد", tone: "text-yellow-300", box: "border-yellow-400/20 bg-yellow-400/[.04]" };
  if (isSubstitution(e)) return { icon: Repeat2, label: "تعویض", tone: "text-sky-300", box: "border-sky-400/20 bg-sky-400/[.05]" };
  return { icon: Zap, label: e?.detail || e?.type || "رویداد", tone: "text-slate-300", box: "border-white/10 bg-white/[.025]" };
}

export default function MatchDetailPage({ params }) {
  const id = params?.id;
  const [section, setSection] = useState("events");
  const [fixture, setFixture] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (nextSection, silent = false) => {
    if (!id || String(id).startsWith("demo-")) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/football/fixture?id=${encodeURIComponent(id)}&section=${nextSection}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (payload.ok) {
        setDegraded(false); setError("");
        if (nextSection === "details") setFixture(payload.data?.fixture ?? payload.data ?? null);
        else setData(Array.isArray(payload.data) ? payload.data : []);
      } else {
        setDegraded(true);
        if (!silent) setError(payload.error || "اطلاعات این بخش موقتاً در دسترس نیست.");
        if (nextSection === "details") setFixture(null); else setData([]);
      }
    } catch {
      setDegraded(true);
      if (!silent) setError("ارتباط با سرویس فوتبال برقرار نشد. صفحه در حالت بدون داده ادامه می‌دهد.");
      if (nextSection === "details") setFixture(null); else setData([]);
    } finally { if (!silent) setLoading(false); }
  }, [id]);

  useEffect(() => { load("details"); }, [id, load]);
  useEffect(() => { if (section !== "details") load(section); }, [section, load]);

  const match = useMemo(() => fixture?.fixture ? fixture : fixture, [fixture]);
  const live = isLive(match?.fixture?.status?.short);
  useEffect(() => {
    if (!match || !live) return undefined;
    const timer = setInterval(() => { load("details", true); if (section !== "details") load(section, true); }, 30000);
    return () => clearInterval(timer);
  }, [match, live, section, load]);

  return <main className="fot-shell"><div className="fot-container space-y-4 pb-10">
    <header className="flex items-center gap-3"><Link href="/matches" className="glass h-10 w-10 rounded-xl grid place-items-center shrink-0" aria-label="بازگشت"><ArrowRight size={19} /></Link><div><h1 className="text-xl font-black">مرکز مسابقه</h1><p className="text-[11px] text-slate-500">اطلاعات، رویدادها و آمار واقعی مسابقه</p></div></header>
    {degraded && <FallbackBanner onRetry={() => load(section)} />}
    <MatchHeader match={match} loading={loading && !match} />
    <nav className="glass rounded-2xl p-1.5 grid grid-cols-5 gap-1 overflow-x-auto" aria-label="بخش‌های مسابقه">{tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`rounded-xl px-2 py-3 text-[10px] font-bold whitespace-nowrap transition ${section === key ? "bg-emerald-400 text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/5"}`}><Icon size={15} className="mx-auto mb-1" />{label}</button>)}</nav>
    {error && !degraded && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">{error}</div>}
    <section className="space-y-3">{loading ? <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400"><Activity className="mx-auto mb-2 animate-pulse" size={20} />در حال بارگذاری…</div> : section === "events" ? <Events data={data} /> : section === "statistics" ? <Statistics data={data} /> : section === "lineups" ? <Lineups data={data} /> : section === "players" ? <Players data={data} /> : <Details data={fixture} />}</section>
  </div></main>;
}

function FallbackBanner({ onRetry }) { return <section className="glass rounded-2xl border border-amber-300/10 bg-amber-300/[.035] p-4 md:p-5"><div className="flex items-start gap-3"><div className="h-10 w-10 shrink-0 rounded-xl bg-amber-300/10 grid place-items-center"><WifiOff size={18} className="text-amber-300" /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-black text-amber-300">حالت پایدار FOT10</p><h2 className="mt-1 text-sm font-black">سرویس داده فوتبال فعلاً در دسترس نیست</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">هیچ نتیجه یا رویداد ساختگی نمایش نمی‌دهیم. به محض برقرار شدن سرویس، اطلاعات واقعی دوباره دریافت می‌شود.</p></div><button onClick={onRetry} className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-white/10"><RefreshCw size={13} className="mx-auto mb-1" />تلاش مجدد</button></div></section>; }

function MatchHeader({ match, loading }) {
  if (loading) return <section className="glass rounded-3xl p-7"><div className="mx-auto max-w-sm space-y-4 text-center"><div className="h-3 w-32 mx-auto rounded bg-white/5 animate-pulse" /><div className="h-20 rounded-2xl bg-white/5 animate-pulse" /><p className="text-xs text-slate-500">در حال دریافت اطلاعات مسابقه…</p></div></section>;
  if (!match) return <section className="glass rounded-3xl p-7 md:p-10 text-center"><div className="mx-auto h-14 w-14 rounded-2xl bg-white/5 grid place-items-center"><WifiOff size={22} className="text-slate-500" /></div><h2 className="mt-4 font-black">اطلاعات مسابقه فعلاً قابل نمایش نیست</h2><p className="mt-2 text-[10px] text-slate-500">برای جلوگیری از نمایش اطلاعات نادرست، نتیجه و مشخصات مسابقه بدون تأیید منبع نشان داده نمی‌شود.</p></section>;
  const teams = match.teams; const goals = match.goals; const score = match.score; const live = isLive(match.fixture?.status?.short);
  return <section className="glass rounded-3xl p-5 md:p-7 overflow-hidden"><div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 mb-6"><span>{match.league?.name || "مسابقه فوتبال"}</span><span className={live ? "text-emerald-400 font-black" : "font-bold"}>{statusLabel(match.fixture?.status?.short)}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8"><TeamHero team={teams?.home} /><div className="text-center min-w-[92px]"><div className="text-3xl md:text-4xl font-black tracking-tight">{goals?.home ?? "—"} - {goals?.away ?? "—"}</div><div className={live ? "mt-2 text-[11px] font-black text-emerald-400" : "mt-2 text-[10px] text-slate-500"}>{match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : formatDate(match.fixture?.date)}</div><div className="mt-1 text-[9px] text-slate-600">نیمه اول: {score?.halftime?.home ?? "—"} - {score?.halftime?.away ?? "—"}</div></div><TeamHero team={teams?.away} /></div>{live && <div className="mt-6 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 py-2.5 text-center text-[10px] font-bold text-emerald-300">● مسابقه زنده است · بروزرسانی خودکار هر ۳۰ ثانیه</div>}</section>;
}

function TeamHero({ team }) { if (!team) return <div className="text-center text-slate-500">—</div>; return <div className="text-center min-w-0"><Link href={`/teams/${team.id}`} className="inline-flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/5"><img src={team.logo} alt="" className="h-14 w-14 md:h-16 md:w-16 object-contain" /></Link><Link href={`/teams/${team.id}`} className="block mt-3 font-black text-sm md:text-base truncate hover:text-emerald-300">{team.name || "تیم"}</Link></div>; }
function Empty({ text }) { return <div className="glass rounded-2xl p-8 text-center"><div className="mx-auto h-11 w-11 rounded-xl bg-white/5 grid place-items-center"><WifiOff size={18} className="text-slate-600" /></div><p className="mt-3 text-xs text-slate-500">{text}</p></div>; }

function Events({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="هنوز رویدادی برای این مسابقه ثبت نشده است." />;
  const events = [...data].sort((a, b) => (Number(a?.time?.elapsed || 0) * 100 + Number(a?.time?.extra || 0)) - (Number(b?.time?.elapsed || 0) * 100 + Number(b?.time?.extra || 0)));
  let homeScore = 0; let awayScore = 0;
  const timeline = [];
  events.forEach((e, index) => {
    const meta = eventMeta(e);
    timeline.push({ kind: "event", event: e, meta, minute: eventMinute(e), index });
    if (e?.type === "Goal" && !isCancelledGoal(e)) {
      if (e?.team?.id === events[0]?.team?.id) homeScore += 1;
      else if (e?.team?.id) awayScore += 1;
      timeline.push({ kind: "score", score: `${homeScore} - ${awayScore}`, minute: eventMinute(e), index: `${index}-score` });
    }
  });
  return <div className="glass rounded-2xl p-3 md:p-5">
    <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-black text-sm">Timeline زنده</h2><p className="text-[9px] text-slate-500 mt-1">گل، VAR، پنالتی، کارت و تعویض به ترتیب دقیقه</p></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[8px] font-black text-emerald-300">LIVE CENTER</span></div>
    <div className="relative">
      <div className="absolute right-[22px] top-2 bottom-2 w-px bg-white/8" />
      <div className="space-y-2">
        {timeline.map((item) => item.kind === "score" ? <div key={item.index} className="relative pr-11 py-1"><div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.035] px-3 py-2 text-center"><span className="text-[8px] text-slate-500">{item.minute}</span><div className="mt-0.5 text-[11px] font-black text-emerald-300">🔄 نتیجه عوض شد · {item.score}</div></div></div> : <TimelineEvent key={`${item.index}-${item.event?.type}-${item.event?.detail || ""}`} {...item} />)}
      </div>
    </div>
  </div>;
}

function TimelineEvent({ event, meta, minute }) {
  const Icon = meta.icon;
  const incoming = isSubstitution(event) ? event?.player?.name : "";
  const outgoing = isSubstitution(event) ? (event?.assist?.name || event?.assist?.player || "") : "";
  const player = event?.player?.name || "";
  return <div className="relative pr-11">
    <div className={`absolute right-2.5 top-3 h-6 w-6 rounded-lg border grid place-items-center ${meta.box} ${meta.tone}`}><Icon size={13} /></div>
    <div className={`rounded-2xl border px-3 py-2.5 ${meta.box}`}>
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 min-w-0"><span className={`text-[10px] font-black ${meta.tone}`}>{meta.label}</span>{event?.team?.name && <span className="text-[8px] text-slate-500 truncate">· {event.team.name}</span>}</div><span className="shrink-0 text-[10px] font-black text-slate-400 tabular-nums">{minute}</span></div>
      {isCancelledGoal(event) ? <p className="mt-1.5 text-[10px] font-bold text-slate-300">گل {player ? `توسط ${player} ` : ""}پس از بررسی VAR مردود شد.</p> : isSubstitution(event) ? <p className="mt-1.5 text-[10px] text-slate-300">ورود: <b>{incoming || "—"}</b>{outgoing ? ` · خروج: ${outgoing}` : ""}</p> : player ? <p className="mt-1.5 text-[10px] text-slate-300"><b>{player}</b>{event?.assist?.name ? ` · پاس گل: ${event.assist.name}` : ""}</p> : null}
      {event?.detail && !isCancelledGoal(event) && <p className="mt-1 text-[9px] text-slate-500">{event.detail}</p>}
    </div>
  </div>;
}

function Statistics({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="آمار این مسابقه هنوز در دسترس نیست." />; const home = data[0]?.statistics || []; const away = data[1]?.statistics || []; const awayMap = new Map(away.map((item) => [String(item.type).toLowerCase(), item.value])); return <div className="glass rounded-2xl p-4 md:p-5 space-y-1">{home.map((item, i) => { const left = item.value ?? "—"; const right = awayMap.get(String(item.type).toLowerCase()) ?? "—"; return <div key={item.type || i} className="py-3 border-b border-white/5 last:border-0"><div className="grid grid-cols-[1fr_100px_1fr] items-center gap-2"><span className="text-center font-black text-xs">{left}</span><span className="text-center text-[10px] text-slate-500">{item.type}</span><span className="text-center font-black text-xs">{right}</span></div></div>; })}</div>; }
function Lineups({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="ترکیب رسمی هنوز اعلام نشده است." />; return <div className="grid gap-3 md:grid-cols-2">{data.map((team, i) => <div key={team.team?.id || i} className="glass rounded-2xl p-4"><div className="flex items-center gap-2 mb-4"><img src={team.team?.logo} alt="" className="h-8 w-8 object-contain" /><b>{team.team?.name}</b><span className="mr-auto rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-500">{team.formation || "—"}</span></div><div className="text-[10px] font-black text-emerald-300 mb-2">ترکیب اصلی</div><div className="grid grid-cols-2 gap-2">{(team.startXI || []).map((p, j) => <div key={p.player?.id || j} className="rounded-xl bg-white/5 p-2.5 text-[10px] flex justify-between gap-2"><span className="truncate">{p.player?.name}</span><span className="shrink-0 text-slate-500">{p.player?.number ?? ""}</span></div>)}</div></div>)}</div>; }
function Players({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="اطلاعات بازیکنان این مسابقه هنوز در دسترس نیست." />; return <div className="grid gap-3 md:grid-cols-2">{data.map((team, i) => <div key={team.team?.id || i} className="glass rounded-2xl p-4"><div className="flex items-center gap-2 mb-4"><img src={team.team?.logo} alt="" className="h-8 w-8 object-contain" /><b>{team.team?.name || "تیم"}</b></div><div className="space-y-2">{(team.players || []).map((row, j) => <div key={row.player?.id || j} className="rounded-xl bg-white/5 p-2.5 text-[10px] flex justify-between"><span>{row.player?.name || "بازیکن"}</span><span className="text-slate-500">{row.statistics?.[0]?.games?.minutes ?? "—"} دقیقه</span></div>)}</div></div>)}</div>; }
function Details({ data }) { const match = data?.fixture ? data : null; if (!match) return <Empty text="جزئیات مسابقه فعلاً در دسترس نیست." />; return <div className="glass rounded-2xl p-5 space-y-3 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-500">ورزشگاه</span><b>{match.fixture?.venue?.name || "—"}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">شهر</span><b>{match.fixture?.venue?.city || "—"}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">داور</span><b>{match.fixture?.referee || "—"}</b></div><div className="flex justify-between gap-4"><span className="text-slate-500">زمان</span><b>{formatDate(match.fixture?.date)}</b></div></div>; }
