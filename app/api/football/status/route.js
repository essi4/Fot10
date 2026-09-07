import { NextResponse } from "next/server";
import { checkSportsApiConnection } from "../../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkSportsApiConnection();
  return NextResponse.json(
    {
      ok: result.ok,
      provider: result.provider,
      demoMode: result.demoMode,
      connected: result.ok,
      keyConfigured: Boolean(result.hasApiKey),
      code: result.ok ? "OK" : result.code,
      message: result.ok ? "اتصال API فوتبال سالم است." : result.message,
      status: result.status || null,
      results: result.results || null,
      quota: {
        dailyRemaining: result.dailyRemaining || null,
        minuteRemaining: result.minuteRemaining || null,
      },
      checkedAt: new Date().toISOString(),
      secretExposed: false,
    },
    { status: result.ok ? 200 : 503 },
  );
}
