import { checkSportsApiConnection, getSportsDataConfig } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSportsDataConfig();
  const result = await checkSportsApiConnection();

  return Response.json({
    ok: Boolean(result.ok),
    provider: config.provider,
    demoMode: config.demoMode,
    hasApiKey: config.hasApiKey,
    upstream: result.ok ? "connected" : "unavailable",
    code: result.code || null,
    status: result.status || null,
    message: result.ok ? "API فوتبال متصل است." : result.message,
    results: result.results ?? null,
    dailyRemaining: result.dailyRemaining ?? null,
    minuteRemaining: result.minuteRemaining ?? null,
    checkedAt: new Date().toISOString(),
  });
}
