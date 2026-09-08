import { NextResponse } from "next/server";
import { getTeamBySearch, getMatches } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

function todayTehran() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date()); }

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("teams") || "";
  const names = [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 8);
  if (!names.length) return NextResponse.json({ ok: true, notifications: [], trackedTeams: [] });

  const tracked = [];
  const notifications = [];
  const date = todayTehran();

  await Promise.all(names.map(async (name) => {
    try {
      const result = await getTeamBySearch(name);
      const team = result?.team;
      if (!team?.id) return;
      tracked.push({ id: team.id, name: team.name, logo: team.logo || null });
      const matches = await getMatches({ date, team: team.id });
      matches.slice(0, 10).forEach((match) => {
        const live = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(match.statusShort);
        const finished = ["FT", "AET", "PEN"].includes(match.statusShort);
        const opponent = match.homeId === team.id ? match.away : match.home;
        const score = match.homeScore != null && match.awayScore != null ? `${match.homeScore} - ${match.awayScore}` : "";
        if (live) notifications.push({ id: `live-${match.id}`, kind: "live", title: `🔴 ${team.name} در حال بازی است`, body: `${team.name} مقابل ${opponent} ${score ? `• ${score}` : ""}`, match_id: String(match.id), team_name: team.name });
        else if (finished) notifications.push({ id: `result-${match.id}`, kind: "result", title: `نتیجه ${team.name}`, body: `${team.name} مقابل ${opponent} با نتیجه ${score || "ثبت‌شده"} به پایان رسید.`, match_id: String(match.id), team_name: team.name });
        else if (match.date) {
          const minutes = Math.round((new Date(match.date).getTime() - Date.now()) / 60000);
          if (minutes > 0 && minutes <= 120) notifications.push({ id: `soon-${match.id}`, kind: "match", title: `⏰ بازی ${team.name} نزدیک است`, body: `${team.name} تا حدود ${minutes} دقیقه دیگر مقابل ${opponent} بازی دارد.`, match_id: String(match.id), team_name: team.name });
        }
      });
    } catch {}
  }));

  return NextResponse.json({ ok: true, date, trackedTeams: tracked, notifications: notifications.slice(0, 20) });
}
