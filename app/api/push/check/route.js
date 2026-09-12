import { NextResponse } from "next/server";
import { sendWebPush } from "../../../../lib/webpush";

const liveStatuses = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"];
const finishedStatuses = ["FT", "AET", "PEN"];
const baseUrl = () => process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL;
const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = async (path, options = {}) => {
  const url = supabaseUrl();
  const key = serviceKey();
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
};

function eventFor(previous, current) {
  const currentLive = liveStatuses.includes(current.statusShort);
  const previousLive = previous && liveStatuses.includes(previous.status_short);
  const currentFinished = finishedStatuses.includes(current.statusShort);
  const previousFinished = previous && finishedStatuses.includes(previous.status_short);
  const oldHome = Number(previous?.home_goals ?? 0);
  const oldAway = Number(previous?.away_goals ?? 0);
  const home = Number(current.homeScore ?? 0);
  const away = Number(current.awayScore ?? 0);

  if (previous && !previousLive && currentLive) return { key: "started", title: "🔴 بازی شروع شد", body: `${current.home} - ${current.away} وارد جریان شد.` };
  if (previous && (home > oldHome || away > oldAway)) {
    const team = home > oldHome ? current.home : current.away;
    return { key: `goal-${home}-${away}`, title: "⚽ گل!", body: `${team} گل زد • ${home} - ${away}` };
  }
  if (previous && !previousFinished && currentFinished) return { key: "finished", title: "🏁 بازی تمام شد", body: `${current.home} ${home} - ${away} ${current.away}` };
  return null;
}

async function saveState(match) {
  const response = await db("push_match_states", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ fixture_id: match.id, status_short: match.statusShort, status_long: match.status, elapsed: match.elapsed ?? null, home_goals: Number(match.homeScore ?? 0), away_goals: Number(match.awayScore ?? 0), home_name: match.home, away_name: match.away, match_date: match.date || null, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`State save failed: ${response.status}`);
}

async function notify(event, fixtureId) {
  const insert = await db("push_events", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ fixture_id: fixtureId, event_key: event.key, title: event.title, body: event.body }),
  });
  if (insert.status === 409) return { sent: 0, skipped: true };
  if (!insert.ok) throw new Error(`Event save failed: ${insert.status}`);

  const subscriptionsResponse = await db("push_subscriptions?active=eq.true&select=id,endpoint,p256dh,auth");
  if (!subscriptionsResponse.ok) throw new Error(`Subscription read failed: ${subscriptionsResponse.status}`);
  const subscriptions = await subscriptionsResponse.json();
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await sendWebPush(subscription, { title: event.title, body: event.body, url: `/matches/${fixtureId}`, tag: `fixture-${fixtureId}-${event.key}`, renotify: true });
      sent += 1;
    } catch (error) {
      if (error.status === 404 || error.status === 410) {
        await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}`, { method: "PATCH", body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }) });
      }
    }
  }
  return { sent, skipped: false };
}

export async function GET(request) {
  const supplied = request.headers.get("x-push-secret");
  if (!process.env.PUSH_CRON_SECRET || supplied !== process.env.PUSH_CRON_SECRET) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const url = baseUrl();
    if (!url) throw new Error("APP_BASE_URL_NOT_CONFIGURED");
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
    const footballResponse = await fetch(`${url}/api/football/fixtures?date=${date}`, { cache: "no-store" });
    if (!footballResponse.ok) throw new Error(`Football API returned ${footballResponse.status}`);
    const data = await footballResponse.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const results = [];
    for (const match of matches) {
      const stateResponse = await db(`push_match_states?fixture_id=eq.${encodeURIComponent(match.id)}&select=*`);
      if (!stateResponse.ok) throw new Error(`State read failed: ${stateResponse.status}`);
      const previousRows = await stateResponse.json();
      const event = eventFor(previousRows[0], match);
      if (event) results.push({ fixture: match.id, event, ...(await notify(event, match.id)) });
      await saveState(match);
    }
    return NextResponse.json({ ok: true, checked: matches.length, results });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "PUSH_CHECK_FAILED" }, { status: 500 });
  }
}
