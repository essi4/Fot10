import { NextResponse } from "next/server";
import { getSportsDataConfig } from "../../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSportsDataConfig();

  if (!config.hasApiKey) {
    return NextResponse.json({
      ok: false,
      provider: config.provider,
      demoMode: config.demoMode,
      connected: false,
      error: "SPORTS_API_KEY is missing from the server environment.",
    }, { status: 503 });
  }

  try {
    const response = await fetch("https://v3.football.api-sports.io/status", {
      headers: {
        "x-apisports-key": process.env.SPORTS_API_KEY || process.env.API_SPORTS_KEY || process.env.FOOTBALL_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json();
    const errors = payload?.errors;
    const hasErrors = errors && ((Array.isArray(errors) && errors.length) || (!Array.isArray(errors) && Object.keys(errors).length));

    if (!response.ok || hasErrors) {
      return NextResponse.json({
        ok: false,
        provider: config.provider,
        demoMode: config.demoMode,
        connected: false,
        error: typeof errors === "string" ? errors : JSON.stringify(errors || `HTTP ${response.status}`),
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      provider: config.provider,
      demoMode: config.demoMode,
      connected: true,
      account: payload?.response?.account || null,
      subscription: payload?.response?.subscription || null,
      quota: payload?.response?.requests || null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      provider: config.provider,
      demoMode: config.demoMode,
      connected: false,
      error: error?.message || "Unable to reach API-Football",
    }, { status: 502 });
  }
}
