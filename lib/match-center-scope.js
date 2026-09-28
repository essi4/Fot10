const CLUB_LEAGUE_SCOPE = [
  { key: "Iran", label: "ایران", leagueNames: ["Persian Gulf Pro League", "Iranian Pro League", "خلیج فارس"], leagueIds: [195] },
  { key: "England", label: "انگلیس", leagueNames: ["Premier League"], leagueIds: [39] },
  { key: "Spain", label: "اسپانیا", leagueNames: ["La Liga", "Laliga"], leagueIds: [140] },
  { key: "Italy", label: "ایتالیا", leagueNames: ["Serie A"], leagueIds: [135] },
  { key: "Germany", label: "آلمان", leagueNames: ["Bundesliga"], leagueIds: [78] },
  { key: "France", label: "فرانسه", leagueNames: ["Ligue 1"], leagueIds: [61] },
  { key: "Netherlands", label: "هلند", leagueNames: ["Eredivisie"], leagueIds: [88] },
  { key: "Portugal", label: "پرتغال", leagueNames: ["Liga Portugal", "Primeira Liga"], leagueIds: [94] },
  { key: "Turkey", label: "ترکیه", leagueNames: ["Super Lig", "Süper Lig"], leagueIds: [203] },
  { key: "Saudi Arabia", label: "عربستان", leagueNames: ["Saudi Pro League", "Saudi Professional League"], leagueIds: [307] },
];

const NATIONAL_COMPETITION_PATTERNS = [
  /international friendlies?/,
  /world cup(?!.*club)/,
  /world cup qualifying|world cup qualification|world cup qualifiers/,
  /uefa.*(euro|european championship|nations league|under[- ]?(17|19|20|21))/,
  /fifa.*(world|friendly|international|u17|u19|u20|u21)/,
  /afc.*(asian cup|qualif|u17|u19|u20|u21)/,
  /caf.*(africa cup|qualif|u17|u20|u23)/,
  /concacaf.*(gold cup|nations league|qualif|u17|u20|u23)/,
  /conmebol.*(copa america|qualif|u17|u20|u23)/,
  /ofc.*(nations cup|qualif|u17|u20|u23)/,
  /copa america/,
  /africa cup of nations|afcon/,
  /asian cup/,
  /gold cup/,
  /nations league/,
  /european championship/,
  /european under[- ]?(17|19|20|21) championship/,
  /under[- ]?(17|19|20|21).*championship/,
  /international friendlies?/,
  /olympic football/,
  /دوستانه بین المللی|دوستانه بین‌المللی/,
  /جام جهانی|انتخابی جام جهانی/,
  /جام ملت(?:ها|‌ها)?ی اروپا|یورو/,
  /لیگ ملت(?:ها|‌ها)?ی اروپا/,
  /جام ملت(?:ها|‌ها)?ی آسیا/,
  /جام ملت(?:ها|‌ها)?ی آفریقا/,
  /جام طلایی/,
  /کوپا آمریکا/,
];

const NATIONAL_ONLY_COUNTRIES = new Set([
  "world",
  "europe",
  "asia",
  "africa",
  "south america",
  "north america",
  "north & central america",
  "oceania",
]);

const normalizeScopeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

function getClubLeagueScope(match) {
  if (!match) return null;
  const leagueId = Number(match.leagueId);
  const byId = CLUB_LEAGUE_SCOPE.find((item) => item.leagueIds.includes(leagueId));
  if (byId) return byId;

  const league = normalizeScopeText(match.league);
  const country = normalizeScopeText(match.country);
  return CLUB_LEAGUE_SCOPE.find(
    (item) =>
      item.leagueNames.some((name) => normalizeScopeText(name) === league) &&
      (item.key !== "Iran" || country.includes("iran") || country.includes("ایران")),
  ) || null;
}

export function getMatchCenterScope(match) {
  const clubLeague = getClubLeagueScope(match);
  if (clubLeague) return { kind: "club-league", key: clubLeague.key, label: clubLeague.label, entry: clubLeague };

  const league = normalizeScopeText(match?.league);
  const country = normalizeScopeText(match?.country);
  const nationalCompetition = NATIONAL_COMPETITION_PATTERNS.some((pattern) => pattern.test(league));
  if (nationalCompetition) {
    return { kind: "national-team", key: "national-team", label: "تیم‌های ملی", competition: match?.league || "مسابقات ملی" };
  }

  if (NATIONAL_ONLY_COUNTRIES.has(country) && /\b(international|world|euro|nations|asian|africa|america|oceania)\b/.test(league)) {
    return { kind: "national-team", key: "national-team", label: "تیم‌های ملی", competition: match?.league || "مسابقات ملی" };
  }

  return null;
}

export function isMatchCenterScope(match) {
  return Boolean(getMatchCenterScope(match));
}

export const MATCH_CENTER_CLUB_LEAGUES = CLUB_LEAGUE_SCOPE;
export const MATCH_CENTER_LEAGUE_IDS = new Set(CLUB_LEAGUE_SCOPE.flatMap((item) => item.leagueIds));
export const NATIONAL_TEAM_SCOPE = NATIONAL_COMPETITION_PATTERNS;

export { normalizeScopeText };
