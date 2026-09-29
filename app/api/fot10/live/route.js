import { NextResponse } from "next/server";
import { getMatches } from "../../../../lib/sports-data";
import { fetchEspnFallback, fetchFootball360, resolveLiveMatches } from "../../../../lib/fot10-live-resolver.cjs";
import { noStoreHeaders } from "../../../../lib/http-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();
  const [football360Result, apiFootballResult] = await Promise.allSettled([fetchFootball360({ timeout: 3000 }), getMatches({ live: true })]);
  const football360 = football360Result.status === 'fulfilled' ? football360Result.value : [];
  const apiFootball = apiFootballResult.status === 'fulfilled' ? apiFootballResult.value : [];
  let espn = [];
  let espnSources = [];
  let espnAttempted = false;
  if (!football360.length && !apiFootball.length) {
    espnAttempted = true;
    const fallback = await fetchEspnFallback({ timeout: 2500 });
    espn = fallback.matches;
    espnSources = fallback.sources;
  }
  const matches = resolveLiveMatches({ football360, apiFootball, espn });
  const football360Ok = football360Result.status === 'fulfilled';
  const apiFootballOk = apiFootballResult.status === 'fulfilled';
  const espnOk = !espnAttempted || espn.length > 0 || espnSources.some((item) => item.status === 'ok');
  const state = matches.length ? 'LIVE' : (football360Ok || apiFootballOk || espnOk ? 'NO_MATCH' : 'SOURCE_DOWN');
  return NextResponse.json({ ok: true, state, checkedAt, elapsedMs: Date.now() - startedAt, matches, count: matches.length, sources: [
    { provider: 'football360', status: football360Result.status === 'fulfilled' ? 'ok' : 'down', count: football360.length, error: football360Result.status === 'rejected' ? String(football360Result.reason?.message || 'unavailable') : null },
    { provider: 'api-football', status: apiFootballResult.status === 'fulfilled' ? 'ok' : 'down', count: apiFootball.length, error: apiFootballResult.status === 'rejected' ? String(apiFootballResult.reason?.message || 'unavailable') : null },
    ...(espnAttempted ? [{ provider: 'espn', status: espnSources.some((item) => item.status === 'ok') ? 'ok' : 'down', count: espn.length, feeds: espnSources }] : []),
  ] }, { status: 200, headers: noStoreHeaders() });
}