import { NextResponse } from "next/server";
import { getTeamBySearch, getMatches, getFixtureEvents } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"];
const FINISHED_STATUSES = ["FT", "AET", "PEN"];
const GOAL_TYPES = new Set(["Goal", "goal"]);
const RED_CARD_DETAILS = new Set(["Red Card", "Second Yellow card", "Second Yellow"]);

function todayTehran() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

function eventId(event) {
  return event?.id || `${event?.time?.elapsed || 0}-${event?.team?.id || 0}-${event?.player?.id || event?.player?.name || "event"}-${event?.type || "event"}-${event?.detail || "detail"}`;
}

function eventMinute(event) {
  const elapsed = Number(event?.time?.elapsed);
  const extra = Number(event?.time?.extra);
  if (!Number.isFinite(elapsed) || elapsed <= 0) return "";
  return `${elapsed}${Number.isFinite(extra) && extra > 0 ? `+${extra}` : ""}'`;
}

function eventScore(events, targetEvent, homeId, awayId, baseHome, baseAway) {
  let home = Number(baseHome) || 0;
  let away = Number(baseAway) || 0;
  const targetId = eventId(targetEvent);
  const goals = events
    .filter((event) => GOAL_TYPES.has(event?.type) && !/missed|cancelled|var/i.test(String(event?.detail || "")))
    .sort((a, b) => Number(a?.time?.elapsed || 0) - Number(b?.time?.elapsed || 0));
  if (!goals.length) return `${home} - ${away}`;
  home = Number(baseHome) || 0;
  away = Number(baseAway) || 0;
  let beforeHome = 0;
  let beforeAway = 0;
  for (const event of goals) {
    if (eventId(event) === targetId) break;
    if (Number(event?.team?.id) === Number(homeId)) beforeHome += 1;
    if (Number(event?.team?.id) === Number(awayId)) beforeAway += 1;
  }
  const isHome = Number(targetEvent?.team?.id) === Number(homeId);
  return `${beforeHome + (isHome ? 1 : 0)} - ${beforeAway + (isHome ? 0 : 1)}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("teams") || "";
  const names = [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 8);
  if (!names.length) return NextResponse.json({ ok: true, notifications: [], trackedTeams: [] });

  const tracked = [];
  const notifications = [];
  const date = todayTehran();
  const now = Date.now();

  await Promise.all(names.map(async (name) => {
    try {
      const result = await getTeamBySearch(name);
      const team = result?.team;
      if (!team?.id) return;
      tracked.push({ id: team.id, name: team.name, logo: team.logo || null });
      const matches = await getMatches({ date, team: team.id });

      await Promise.all(matches.slice(0, 10).map(async (match) => {
        const live = LIVE_STATUSES.includes(match.statusShort);
        const finished = FINISHED_STATUSES.includes(match.statusShort);
        const opponent = match.homeId === team.id ? match.away : match.home;
        const score = match.homeScore != null && match.awayScore != null ? `${match.homeScore} - ${match.awayScore}` : "";
        const prefix = `match-${match.id}`;

        if (live) {
          if (Number(match.elapsed) <= 2 || (match.statusShort === "1H" && Number(match.elapsed) <= 2)) {
            notifications.push({ id: `${prefix}-started`, kind: "started", title: `🚀 ${team.name} بازی را شروع کرد`, body: `${team.name} مقابل ${opponent} شروع شد${score ? ` • ${score}` : ""}.`, match_id: String(match.id), team_name: team.name });
          }

          try {
            const events = await getFixtureEvents(match.id);
            events.filter((event) => GOAL_TYPES.has(event?.type) && Number(event?.team?.id) === Number(team.id) && !/missed|cancelled|var/i.test(String(event?.detail || ""))).forEach((event) => {
              const minute = eventMinute(event);
              const scorer = event?.player?.name ? ` توسط ${event.player.name}` : "";
              const eventScoreText = eventScore(events, event, match.homeId, match.awayId, match.homeScore, match.awayScore);
              notifications.push({ id: `${prefix}-goal-${eventId(event)}`, kind: "goal", title: `⚽ ${team.name} گل زد`, body: `${team.name}${scorer} گل زد${minute ? ` در دقیقه ${minute}` : ""} • نتیجه: ${eventScoreText}`, match_id: String(match.id), team_name: team.name });
            });

            events.filter((event) => Number(event?.team?.id) === Number(team.id) && RED_CARD_DETAILS.has(String(event?.detail || ""))).forEach((event) => {
              const minute = eventMinute(event);
              const player = event?.player?.name ? ` • ${event.player.name}` : "";
              notifications.push({ id: `${prefix}-red-${eventId(event)}`, kind: "red-card", title: `🟥 کارت قرمز برای ${team.name}`, body: `${team.name}${player}${minute ? ` • دقیقه ${minute}` : ""}${score ? ` • نتیجه: ${score}` : ""}`, match_id: String(match.id), team_name: team.name });
            });
          } catch {}

          notifications.push({ id: `${prefix}-live`, kind: "live", title: `🔴 ${team.name} در حال بازی است`, body: `${team.name} مقابل ${opponent}${score ? ` • ${score}` : ""}${match.elapsed ? ` • دقیقه ${match.elapsed}` : ""}`, match_id: String(match.id), team_name: team.name });
        } else if (finished) {
          notifications.push({ id: `${prefix}-result`, kind: "result", title: `🏁 بازی ${team.name} تمام شد`, body: `${team.name} مقابل ${opponent} با نتیجه ${score || "ثبت‌شده"} به پایان رسید.`, match_id: String(match.id), team_name: team.name });
        } else if (match.date) {
          const minutes = Math.round((new Date(match.date).getTime() - now) / 60000);
          if (minutes > 0 && minutes <= 120) notifications.push({ id: `${prefix}-soon`, kind: "match", title: `⏰ بازی ${team.name} نزدیک است`, body: `${team.name} تا حدود ${minutes} دقیقه دیگر مقابل ${opponent} بازی دارد.`, match_id: String(match.id), team_name: team.name });
        }
      }));
    } catch {}
  }));

  const unique = [...new Map(notifications.map((item) => [item.id, item])).values()];
  return NextResponse.json({ ok: true, date, trackedTeams: tracked, notifications: unique.slice(0, 30) });
}
