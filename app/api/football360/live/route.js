import { NextResponse } from "next/server";
import {
  DEFAULT_FOOTBALL360_LIVE_URL,
  normalizeFootball360LiveResponse,
} from "../../../../lib/football360-live.cjs";

export const dynamic = "force-dynamic";

const CACHE_SECONDS = 15;

export async function GET() {
  const checkedAt = new Date().toISOString();
  const url = process.env.FOOTBALL360_LIVE_API_URL || DEFAULT_FOOTBALL360_LIVE_URL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "FOT10/1.0" },
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, source: "football360-public-signal-proxy", checkedAt, matches: [], error: "منبع سیگنال فوتبال ۳۶۰ پاسخ معتبر نداد." },
        { status: 200, headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}` } },
      );
    }
    const matches = normalizeFootball360LiveResponse(payload);
    return NextResponse.json(
      { ok: true, source: "football360-public-signal-proxy", checkedAt, matches, count: matches.length },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}` } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, source: "football360-public-signal-proxy", checkedAt, matches: [], error: error?.name === "AbortError" ? "سیگنال فوتبال ۳۶۰ دیر پاسخ داد." : "سیگنال فوتبال ۳۶۰ در دسترس نیست." },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timer);
  }
}
