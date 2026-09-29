import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const matches = await getMatches({ live: true });
    return NextResponse.json(
      {
        ok: true,
        source: "api-football-live",
        checkedAt,
        matches: Array.isArray(matches)
          ? matches.map((match) => ({ ...match, broadcastAvailable: false, broadcastSource: "api-football-live" }))
          : [],
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "api-football-live",
        checkedAt,
        matches: [],
        code: error?.code || "API_ERROR",
        error:
          error?.code === "CONFIG_ERROR"
            ? "سرویس داده زنده فعلاً پیکربندی نشده است."
            : error?.code === "RATE_LIMIT"
              ? "سقف درخواست سرویس فوتبال موقتاً پر شده است."
              : "دریافت داده زنده فوتبال فعلاً ممکن نیست.",
      },
      { status: 200, headers: noStoreHeaders() },
    );
  }
}
