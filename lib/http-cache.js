export const CACHE_PROFILES = {
  live: { sMaxAge: 10, stale: 20 },
  fixture: { sMaxAge: 30, stale: 60 },
  fixtures: { sMaxAge: 60, stale: 120 },
  standings: { sMaxAge: 300, stale: 600 },
  team: { sMaxAge: 300, stale: 600 },
  static: { sMaxAge: 3600, stale: 7200 },
};

export function publicCacheHeaders(profile = "fixtures") {
  const policy = CACHE_PROFILES[profile] || CACHE_PROFILES.fixtures;
  return {
    "Cache-Control": `public, s-maxage=${policy.sMaxAge}, stale-while-revalidate=${policy.stale}`,
    "CDN-Cache-Control": `public, s-maxage=${policy.sMaxAge}, stale-while-revalidate=${policy.stale}`,
  };
}

export function noStoreHeaders() {
  return { "Cache-Control": "private, no-store" };
}

export function jsonWithCache(NextResponse, body, profile = "fixtures", init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.cache !== false) {
    Object.entries(publicCacheHeaders(profile)).forEach(([key, value]) => headers.set(key, value));
  } else {
    Object.entries(noStoreHeaders()).forEach(([key, value]) => headers.set(key, value));
  }
  return NextResponse.json(body, { ...init, headers });
}
