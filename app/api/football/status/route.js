import { NextResponse } from "next/server";
import { checkSportsApiConnection, getMatches } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";
const todayTehran = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());

export async function GET() {
  const startedAt = Date.now();
  const connection = await checkSportsApiConnection();

  if (!connection.ok) {
    return NextResponse.json(
      {
        ok: false,
        provider: connection.provider,
        demoMode: connection.demoMode,
        connected: false,
        keyConfigured: Boolean(connection.hasApiKey),
        code: connection.code,
        message: connection.message,
        status: connection.status || null,
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        secretExposed: false,
      },
      { status: connection.code === "CONFIG_ERROR" ? 503 : 502 },
    );
  }

  // Keep diagnostics cheap: one connection check plus one fixtures request.
  // The previous smoke test called many endpoints and could consume the Free quota.
  const date = todayTehran();
  let fixtures = [];
  let fixtureCheck = true;
  let fixtureError = null;

  try {
    fixtures = await getMatches({ date });
  } catch (error) {
    fixtureCheck = false;
    fixtureError = {
      code: error?.code || "API_ERROR",
      message: error?.message || "دریافت مسابقات ناموفق بود.",
      status: error?.details?.status || null,
    };
  }

  const ok = connection.ok && fixtureCheck;

  return NextResponse.json(
    {
      ok,
      provider: connection.provider,
      demoMode: connection.demoMode,
      connected: true,
      keyConfigured: true,
      checks: { connection: true, fixtures: fixtureCheck },
      samples: { date, fixtureCount: fixtures.length },
      quota: {
        dailyRemaining: connection.dailyRemaining || null,
        minuteRemaining: connection.minuteRemaining || null,
      },
      ...(fixtureError ? { code: fixtureError.code, message: fixtureError.message, status: fixtureError.status } : {}),
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      secretExposed: false,
    },
    { status: ok ? 200 : 502 },
  );
}
