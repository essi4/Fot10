import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { noStoreHeaders } from "../../../../lib/http-cache";
import { getEspnLiveMatches } from "../../../../lib/espn-live.cjs";

export const dynamic = "force-dynamic";

function responsePayload(matches, extra = {}) {
  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    matches: Array.isArray(matches) ? matches : [],
    ...extra,
  };
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const primaryMatches = await getMatches({ live: true });
    if (primaryMatches.length) {
      return NextResponse.json(
        responsePayload(
          primaryMatches.map((match) => ({
            ...match,
            broadcastAvailable: false,
            broadcastSource: "api-football-live",
          })),
          { source: "api-football-live", fallback: false },
        ),
        { headers: noStoreHeaders() },
      );
    }

    try {
      const fallbackMatches = await getEspnLiveMatches();
      return NextResponse.json(
        responsePayload(fallbackMatches, {
          source: "espn-public-fallback",
          fallback: true,
          primary: "api-football-live",
        }),
        { headers: noStoreHeaders() },
      );
    } catch (fallbackError) {
      return NextResponse.json(
        responsePayload([], {
          source: "api-football-live",
          fallback: true,
          code: "NO_LIVE_DATA",
          fallbackCode: "ESPN_UNAVAILABLE",
          error: fallbackError?.message || "منبع پشتیبان داده زنده در دسترس نیست.",
        }),
        { status: 200, headers: noStoreHeaders() },
      );
    }
  } catch (error) {
    try {
      const fallbackMatches = await getEspnLiveMatches();
      return NextResponse.json(
        responsePayload(fallbackMatches, {
          source: "espn-public-fallback",
          fallback: true,
          primaryCode: error?.code || "API_ERROR",
        }),
        { headers: noStoreHeaders() },
      );
    } catch (fallbackError) {
      return NextResponse.json(
        {
          ok: false,
          source: "api-football-live",
          checkedAt,
          matches: [],
          code: error?.code || "API_ERROR",
          fallbackCode: fallbackError?.name || "ESPN_UNAVAILABLE",
          error:
            error?.code === "CONFIG_ERROR"
              ? "سرویس داده زنده فعلاً پیکربندی نشده است."
              : error?.code === "RATE_LIMIT"
                ? "سقف درخواست سرویس فوتبال موقتاً پر شده است."
                : error?.code === "SUSPENDED"
                  ? "منبع اصلی معلق است و منبع پشتیبان هم در دسترس نیست."
                  : "دریافت داده زنده فوتبال فعلاً ممکن نیست.",
        },
        { status: 200, headers: noStoreHeaders() },
      );
    }
  }
}
