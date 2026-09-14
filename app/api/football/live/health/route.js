import { NextResponse } from "next/server";
import { getLiveHealth } from "../../../../../lib/live-health";

export const dynamic = "force-dynamic";

function authorized(request) {
  const configured = process.env.HEALTH_CHECK_TOKEN || process.env.CRON_SECRET;
  if (!configured) return true;
  const authorization = request.headers.get("authorization") || "";
  const token = request.headers.get("x-fot10-health-token") || (authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
  return token === configured;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  const force = url.searchParams.get("force") === "1";
  const health = await getLiveHealth({ deep, force });

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
