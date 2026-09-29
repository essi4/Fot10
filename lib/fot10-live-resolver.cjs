'use strict';

const { DEFAULT_FOOTBALL360_LIVE_URL, normalizeFootball360LiveResponse, sameMatch } = require('./football360-live.cjs');
const { getEspnLiveMatches } = require('./espn-live.cjs');

const ESPN_FALLBACK_FEEDS = [
  ['premier-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard'],
  ['la-liga', 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard'],
  ['serie-a', 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard'],
  ['bundesliga', 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard'],
  ['ligue-1', 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard'],
  ['eredivisie', 'https://site.api.espn.com/apis/site/v2/sports/soccer/ned.1/scoreboard'],
  ['liga-portugal', 'https://site.api.espn.com/apis/site/v2/sports/soccer/por.1/scoreboard'],
  ['super-lig', 'https://site.api.espn.com/apis/site/v2/sports/soccer/tur.1/scoreboard'],
  ['saudi-pro-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/sau.1/scoreboard'],
  ['iran-premier-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/irn.1/scoreboard'],
  ['champions-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard'],
  ['europa-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard'],
  ['conference-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa.conf/scoreboard'],
  ['nations-league', 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard'],
  ['international-friendly', 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard'],
];

const TOP_COMPETITION_PATTERNS = [/premier league/i, /la liga/i, /serie a/i, /bundesliga/i, /ligue 1/i, /eredivisie/i, /primeira/i, /super lig/i, /superliga/i, /saudi pro league/i, /champions league/i, /europa league/i, /conference league/i, /copa libertadores/i, /copa sudamericana/i, /mls/i, /brasileir/i];
const IRAN_PATTERNS = [/\biran\b/i, /\birn\b/i, /ایران/, /persian gulf/i, /azadegan/i, /خلیج فارس/, /آزادگان/];
const INTERNATIONAL_PATTERNS = [/nations? league/i, /friendly/i, /world cup/i, /euro(\s|$)/i, /asian cup/i, /national team/i, /qualification/i, /qualifier/i, /بین[\s‌-]?الملل/, /ملت[\s‌-]?ها/];
const CUP_PATTERNS = [/champions league/i, /europa league/i, /conference league/i, /world cup/i, /copa/i, /cup/i, /trophy/i, /super cup/i, /playoff/i, /knockout/i, /جام/];

function normalizeText(value = '') { return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[‐‑‒–—]/g, '-').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function teamText(match) { return [match?.home, match?.away, match?.teams?.home?.name, match?.teams?.away?.name].filter(Boolean).join(' | '); }
function competitionText(match) { return [match?.league, match?.league?.name, match?.competition, match?.competition?.name, match?.country, match?.round].filter(Boolean).join(' | '); }
function categoryOf(match) {
  const declaredType = String(match?.competitionType || match?.leagueType || '').toLowerCase();
  const text = competitionText(match);
  if (declaredType.includes('league')) return 'league';
  if (declaredType.includes('cup')) return 'cup';
  if (INTERNATIONAL_PATTERNS.some((pattern) => pattern.test(text))) return 'international';
  if (CUP_PATTERNS.some((pattern) => pattern.test(text))) return 'cup';
  if (/league|division|liga|serie|bundesliga|ligue|eredivisie|premier|super lig|pro league|پرولیگ|لیگ/i.test(text)) return 'league';
  return 'other';
}
function hasIran(match) { return IRAN_PATTERNS.some((pattern) => pattern.test(teamText(match)) || pattern.test(competitionText(match))); }
function isTopCompetition(match) { return TOP_COMPETITION_PATTERNS.some((pattern) => pattern.test(competitionText(match))); }
function importanceScore(match) {
  let score = 100;
  const category = categoryOf(match);
  if (category === 'league') score += 100;
  if (category === 'cup') score += 90;
  if (category === 'international') score += 80;
  if (isTopCompetition(match)) score += 160;
  if (hasIran(match)) score += 220;
  if (match?.broadcastAvailable) score += 40;
  if (match?.statusShort === 'HT') score += 5;
  return score;
}
function reasonsFor(match) {
  const reasons = [];
  if (hasIran(match)) reasons.push('ایران');
  if (isTopCompetition(match)) reasons.push('رقابت مهم');
  const category = categoryOf(match);
  if (category === 'league') reasons.push('لیگ');
  if (category === 'cup') reasons.push('جام');
  if (category === 'international') reasons.push('ملی');
  if (match?.broadcastAvailable) reasons.push('سیگنال ۳۶۰');
  return reasons;
}
function mapApiFootballMatch(match) { return { ...match, id: String(match?.id ?? ''), provider: 'api-football', source: 'api-football-live', sourceMatchId: String(match?.id ?? ''), isLive: true }; }
function mapExternalMatch(match, provider, source) { return { ...match, id: String(match?.id ?? (provider + '-' + normalizeText(match?.home) + '-' + normalizeText(match?.away))), provider, source, sourceMatchId: null, isLive: true }; }

function mergeLiveMatches({ football360 = [], apiFootball = [], espn = [] } = {}) {
  const canonical = [];
  for (const match of apiFootball) canonical.push(mapApiFootballMatch(match));
  for (const signal of football360) {
    const existing = canonical.find((match) => sameMatch(match, signal));
    if (existing) {
      existing.broadcastAvailable = true;
      existing.broadcastSource = 'football360';
      existing.football360MatchId = signal.sourceMatchId ?? signal.id ?? null;
      existing.sources = Array.from(new Set([...(existing.sources || []), 'api-football', 'football360']));
      continue;
    }
    canonical.push({ ...mapExternalMatch(signal, 'football360', 'football360-public-signal-proxy'), broadcastAvailable: true, broadcastSource: 'football360', football360MatchId: signal.sourceMatchId ?? signal.id ?? null, sources: ['football360'] });
  }
  for (const match of espn) {
    const existing = canonical.find((candidate) => sameMatch(candidate, match));
    if (existing) { existing.sources = Array.from(new Set([...(existing.sources || []), 'espn'])); continue; }
    canonical.push({ ...mapExternalMatch(match, 'espn', 'espn-public-fallback'), sources: ['espn'] });
  }
  return canonical.filter((match) => match.home && match.away).map((match) => {
    const category = categoryOf(match);
    const priority = importanceScore(match);
    return { ...match, category, categoryLabel: category === 'league' ? 'لیگ' : category === 'cup' ? 'جام' : category === 'international' ? 'ملی' : 'مسابقه', priority, priorityReasons: reasonsFor(match), priorityNote: 'اولویت بر پایه اهمیت رقابت و حضور ایران؛ آمار واقعی بینندگان نیست.' };
  }).sort((a, b) => b.priority - a.priority || String(a.league || '').localeCompare(String(b.league || ''), 'fa'));
}

async function fetchFootball360({ fetchImpl = fetch, url = process.env.FOOTBALL360_LIVE_API_URL || DEFAULT_FOOTBALL360_LIVE_URL, timeout = 3000 } = {}) {
  const response = await fetchImpl(url, { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': 'FOT10/1.0' }, signal: AbortSignal.timeout(timeout) });
  const payload = await response.json();
  if (!response.ok) throw new Error('Football360 HTTP ' + response.status);
  return normalizeFootball360LiveResponse(payload);
}
async function fetchEspnFallback({ timeout = 2500 } = {}) {
  const results = await Promise.allSettled(ESPN_FALLBACK_FEEDS.map(async ([name, url]) => ({ name, matches: await getEspnLiveMatches({ url, timeout }) })));
  const matches = [];
  const sources = [];
  for (const result of results) {
    if (result.status === 'fulfilled') { sources.push({ provider: result.value.name, status: 'ok', count: result.value.matches.length }); matches.push(...result.value.matches); }
    else sources.push({ provider: 'espn', status: 'down', count: 0 });
  }
  return { matches, sources, allDown: results.length > 0 && results.every((result) => result.status === 'rejected') };
}
function resolveLiveMatches({ football360, apiFootball, espn } = {}) { return mergeLiveMatches({ football360, apiFootball, espn }); }
module.exports = { ESPN_FALLBACK_FEEDS, categoryOf, importanceScore, mergeLiveMatches, fetchFootball360, fetchEspnFallback, resolveLiveMatches };