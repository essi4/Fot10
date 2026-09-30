'use strict';

const DEFAULT_ESPN_FRIENDLY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard';

function todayKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function normalizeTeam(competitor) {
  const team = competitor?.team || {};
  return {
    id: team.id ?? competitor?.id ?? null,
    name: team.displayName || team.name || competitor?.displayName || competitor?.name || '',
    logo: team.logo || team.logos?.[0]?.href || '',
  };
}

function isLiveEvent(event) {
  const status = event?.competitions?.[0]?.status || event?.status;
  const state = String(status?.type?.state || status?.state || '').toLowerCase();
  const name = String(status?.type?.name || status?.name || '').toLowerCase();
  return state === 'in' || /in_progress|halftime|end_period|overtime/.test(name);
}

function normalizeEspnLiveEvent(event) {
  if (!isLiveEvent(event)) return null;
  const competition = event?.competitions?.[0];
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  if (competitors.length < 2) return null;

  const homeRaw = competitors.find((item) => item?.homeAway === 'home') || competitors[0];
  const awayRaw = competitors.find((item) => item?.homeAway === 'away') || competitors[1];
  const home = normalizeTeam(homeRaw);
  const away = normalizeTeam(awayRaw);
  if (!home.name || !away.name) return null;

  const status = competition?.status || event?.status || {};
  const statusName = String(status?.type?.name || status?.name || '').toUpperCase();
  const short = /HALFTIME|END_PERIOD/.test(statusName)
    ? 'HT'
    : 'LIVE';

  const venue = competition?.venue || event?.venue || {};
  const venueName =
    venue?.fullName ||
    venue?.name ||
    venue?.address?.city ||
    null;

  return {
    id: event?.id ? `espn-${event.id}` : `espn-${home.id || home.name}-${away.id || away.name}`,
    home: home.name,
    away: away.name,
    homeId: home.id,
    awayId: away.id,
    homeLogo: home.logo,
    awayLogo: away.logo,
    homeScore: homeRaw?.score != null ? Number(homeRaw.score) : null,
    awayScore: awayRaw?.score != null ? Number(awayRaw.score) : null,
    elapsed: status?.displayClock || null,
    status: statusName || 'LIVE',
    statusShort: short,
    date: event?.date || competition?.date || null,
    league: event?.league?.name || 'International Friendly',
    venue: venueName,
    sourceMatchId: null,
    broadcastAvailable: false,
    broadcastSource: 'espn-public',
  };
}

function normalizeEspnLiveResponse(payload) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return events.map(normalizeEspnLiveEvent).filter(Boolean);
}

async function getEspnLiveMatches({ url = DEFAULT_ESPN_FRIENDLY_URL, fetchImpl = fetch, timeout = 8000 } = {}) {
  const endpoint = new URL(url);
  endpoint.searchParams.set('dates', todayKey());

  const response = await fetchImpl(endpoint, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'FOT10/1.0',
    },
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error(`ESPN live source HTTP ${response.status}`);
  }

  const payload = await response.json();
  return normalizeEspnLiveResponse(payload);
}

// DIAGNOSTIC ONLY — not a production fallback.

async function probeEspnHosts(url, { fetchImpl = fetch, timeout = 2500 } = {}) {
  const pathAndQuery = (() => {
    try {
      const endpoint = new URL(url);
      endpoint.searchParams.set('dates', todayKey());
      return endpoint.pathname + endpoint.search;
    } catch {
      return null;
    }
  })();
  if (!pathAndQuery) return 'probe_bad_url';

  const hosts = [
    ['api', 'https://site.api.espn.com'],
    ['web', 'https://site.web.api.espn.com'],
  ];

  const results = await Promise.allSettled(
    hosts.map(async ([label, base]) => {
      const response = await fetchImpl(new URL(base + pathAndQuery), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FOT10/1.0',
        },
        signal: AbortSignal.timeout(timeout),
      });
      let eventsInfo = '';
      if (response.ok) {
        try {
          const payload = await response.json();
          const count = Array.isArray(payload?.events) ? payload.events.length : -1;
          eventsInfo = `(events=${count})`;
        } catch {
          eventsInfo = '(parse_error)';
        }
      }
      return `${label}:${response.status}${eventsInfo}`;
    })
  );

  return results
    .map((result, index) => {
      const label = index === 0 ? 'api' : 'web';
      if (result.status === 'rejected') {
        const message = String(result.reason?.message ?? result.reason);
        const short = /abort|timeout/i.test(message) ? 'timeout' : message;
        return `${label}:ERR(${short})`;
      }
      return result.value;
    })
    .join(' | ');
}

module.exports = {
  DEFAULT_ESPN_FRIENDLY_URL,
  todayKey,
  isLiveEvent,
  normalizeEspnLiveResponse,
  getEspnLiveMatches,
  probeEspnHosts,
};
