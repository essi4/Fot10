import { NextResponse } from "next/server";
import {
  getFixtureDetails,
  getFixtureEvents,
  getFixtureStatistics,
  getFixtureLineups,
  getFixturePlayers,
} from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

const loaders = {
  details: getFixtureDetails,
  events: getFixtureEvents,
  statistics: getFixtureStatistics,
  lineups: getFixtureLineups,
  players: getFixturePlayers,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const section = searchParams.get("section") || "details";

  if (!id) {
    return NextResponse.json({ ok: false, degraded: true, code: "MISSING_ID", error: "شناسه مسابقه ارسال نشده است." }, { status: 400 });
  }

  const fixtureId = Number(id);
  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ ok: false, degraded: true, code: "INVALID_ID", error: "شناسه مسابقه معتبر نیست." }, { status: 400 });
  }

  const loader = loaders[section];
  if (!loader) {
    return NextResponse.json({ ok: false, degraded: true, code: "UNSUPPORTED_SECTION", error: "بخش انتخاب‌شده پشتیبانی نمی‌شود." }, { status: 400 });
  }

  try {
    const data = await loader(fixtureId);
    return NextResponse.json({ ok: true, degraded: false, provider: "api-football", fixtureId, section, data });
  } catch (error) {
    const code = error?.code || "API_ERROR";
    const status = error?.details?.status || null;
    const configError = code === "CONFIG_ERROR";
    const message = configError
      ? "سرویس داده فوتبال فعلاً فعال نیست. اطلاعات مسابقه بعد از اتصال API نمایش داده می‌شود."
      : code === "AUTH_ERROR"
        ? "کلید سرویس فوتبال معتبر نیست یا دسترسی آن رد شده است."
        : code === "RATE_LIMIT"
          ? "سقف درخواست سرویس فوتبال موقتاً پر شده است."
          : "دریافت این بخش از اطلاعات مسابقه فعلاً ممکن نیست.";

    return NextResponse.json({
      ok: false,
      degraded: true,
      provider: "api-football",
      fixtureId,
      section,
      code,
      upstreamStatus: status,
      error: message,
      retryable: !configError,
      data: section === "details" ? null : [],
    }, { status: 200 });
  }
}
