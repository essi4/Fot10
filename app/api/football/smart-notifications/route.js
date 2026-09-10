import { NextResponse } from "next/server";
import { getTeamBySearch, getMatches, getFixtureEvents } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"];
const FINISHED_STATUSES = ["FT", "AET", "PEN"];
const GOAL_TYPES = new Set(["Goal", "goal"]);

function todayTehran() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

function eventId(event) {
  return event?.id || `${event?.time?.elapsed || 0}-${event?.team?.id || 0}-${event?.player?.id || event?.player?.name || "event"}-${event?.type || "event"}-${event?.detail || "detail"}`;
}

function eventMinute(event) {
  const elapsed = Number(event?.time?.elapsed);
  return Number.isFinite(elapsed) && elapsed > 0 ? `${elapsed}'` : "";
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
          if (Number(match.elapsed) <= 2 || match.statusShort === "1H" && Number(match.elapsed) <= 2) {
            notifications.push({ id: `${prefix}-started`, kind: "match", title: `🚀 ${team.name} بازی را شروع کرد`, body: `${team.name} مقابل ${opponent} وارد زمین شد.`, match_id: String(match.id), team_name: team.name });
          }

          try {
            const events = await getFixtureEvents(match.id);
            events.filter((event) => GOAL_TYPES.has(event?.type) && Number(event?.team?.id) === Number(team.id)).forEach((event) => {
              const minute = eventMinute(event);
              const scorer = event?.player?.name ? ` توسط ${event.player.name}` : "";
              const detail = event?.detail && /missed|cancelled|var/i.test(String(event.detail)) ? ` (${event.detail})` : "";
              if (!detail) {
                notifications.push({ id: `${prefix}-goal-${eventId(event)}`, kind: "goal", title: `⚽ ${team.name} گل زد`, body: `${team.name}${scorer} مقابل ${opponent} گل زد${minute ? ` در دقیقه ${minute}` : ""}.${score ? ` نتیجه: ${score}` : ""}`, match_id: String(match.id), team_name: team.name });
              }
            });
          } catch {}

          notifications.push({ id: `${prefix}-live`, kind: "live", title: `🔴 ${team.name} در حال بازی است`, body: `${team.name} مقابل ${opponent} ${score ? `• ${score}` : ""}${match.elapsed ? ` • دقیقه ${match.elapsed}` : ""}`, match_id: String(match.id), team_name: team.name });
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
