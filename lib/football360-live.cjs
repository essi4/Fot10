
'use strict';

const DEFAULT_FOOTBALL360_LIVE_URL = 'https://api.majidapi.ir/football360?action=live';

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function sideName(item, side) {
  return item?.[side]?.name || item?.[side] || item?.[side === 'home' ? 'homeTeam' : 'awayTeam']?.name || item?.[side === 'home' ? 'homeTeam' : 'awayTeam'] || item?.teams?.[side]?.name || '';
}

function readLiveRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['matches', 'live', 'items', 'results', 'events', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = readLiveRows(payload[key]);
      if (nested.length) return nested;
    }
  }
  return [payload];
}

function liveStatus(value) {
  const text = normalizeText(value);
  if (!text) return true;
  if (/(finished|final|ft|ended|پایان|تمام)/i.test(text)) return false;
  return /(live|in play|playing|زنده|در جریان|نیمه|شروع شده)/i.test(text);
}

function normalizeLiveRow(item) {
  const home = String(sideName(item, 'home') || '').trim();
  const away = String(sideName(item, 'away') || '').trim();
  if (!home || !away) return null;

  const explicitLive = item?.isLive ?? item?.live ?? item?.is_live ?? item?.streaming ?? item?.hasLive;
  const status = item?.status || item?.statusText || item?.state || item?.matchStatus || '';
  const isLive = explicitLive === false ? false : explicitLive === true ? true : liveStatus(status);
  if (!isLive) return null;

  const rawId = item?.id ?? item?.matchId ?? item?.fixtureId ?? item?.fixture?.id ?? null;
  const id = rawId ?? `360-${normalizeText(home).replace(/\s+/g, '-')}-${normalizeText(away).replace(/\s+/g, '-')}`;
  return {
    id,
    home,
    away,
    homeScore: item?.homeScore ?? item?.score?.home ?? item?.goals?.home ?? item?.result?.home ?? null,
    awayScore: item?.awayScore ?? item?.score?.away ?? item?.goals?.away ?? item?.result?.away ?? null,
    elapsed: item?.elapsed ?? item?.minute ?? item?.time?.elapsed ?? null,
    status: status || 'LIVE',
    statusShort: 'LIVE',
    date: item?.date || item?.startAt || item?.kickoff || item?.fixture?.date || null,
    league: item?.league?.name || item?.league || item?.competition?.name || item?.competition || '',
    sourceMatchId: item?.id ?? item?.matchId ?? item?.fixtureId ?? item?.fixture?.id ?? null,
    broadcastAvailable: true,
    broadcastSource: 'football360-public-signal-proxy',
  };
}

function normalizeFootball360LiveResponse(payload) {
  const rows = readLiveRows(payload);
  return rows.map(normalizeLiveRow).filter(Boolean);
}

function sameMatch(a, b) {
  const ah = normalizeText(sideName(a, 'home'));
  const aa = normalizeText(sideName(a, 'away'));
  const bh = normalizeText(sideName(b, 'home'));
  const ba = normalizeText(sideName(b, 'away'));
  return ah && aa && ((ah === bh && aa === ba) || (ah === ba && aa === bh));
}

function annotateMatchesWithFootball360Signal(matches = [], live360 = []) {
  return matches.map((match) => {
    const signal = live360.find((candidate) => sameMatch(match, candidate));
    return signal
      ? { ...match, broadcastAvailable: true, broadcastSource: 'football360', football360MatchId: signal.sourceMatchId ?? null }
      : match;
  });
}

module.exports = {
  DEFAULT_FOOTBALL360_LIVE_URL,
  normalizeText,
  normalizeFootball360LiveResponse,
  annotateMatchesWithFootball360Signal,
  sameMatch,
};
