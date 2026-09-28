const CLUB_LEAGUE_SCOPE = [
  { key: "Iran", label: "ایران", flag: "🇮🇷", leagueNames: ["Persian Gulf Pro League", "Iranian Pro League", "خلیج فارس"], leagueIds: [195] },
  { key: "England", label: "انگلیس", flag: "🇬🇧", leagueNames: ["Premier League"], leagueIds: [39] },
  { key: "Spain", label: "اسپانیا", flag: "🇪🇸", leagueNames: ["La Liga", "Laliga"], leagueIds: [140] },
  { key: "Italy", label: "ایتالیا", flag: "🇮🇹", leagueNames: ["Serie A"], leagueIds: [135] },
  { key: "Germany", label: "آلمان", flag: "🇩🇪", leagueNames: ["Bundesliga"], leagueIds: [78] },
  { key: "France", label: "فرانسه", flag: "🇫🇷", leagueNames: ["Ligue 1"], leagueIds: [61] },
  { key: "Netherlands", label: "هلند", flag: "🇳🇱", leagueNames: ["Eredivisie"], leagueIds: [88] },
  { key: "Portugal", label: "پرتغال", flag: "🇵🇹", leagueNames: ["Liga Portugal", "Primeira Liga"], leagueIds: [94] },
  { key: "Turkey", label: "ترکیه", flag: "🇹🇷", leagueNames: ["Super Lig", "Süper Lig"], leagueIds: [203] },
  { key: "Saudi Arabia", label: "عربستان", flag: "🇸🇦", leagueNames: ["Saudi Pro League", "Saudi Professional League"], leagueIds: [307] },
  { key: "Argentina", label: "آرژانتین", flag: "🇦🇷", leagueNames: ["Liga Profesional Argentina", "Liga Profesional", "Primera Division"], leagueIds: [128] },
  { key: "Brazil", label: "برزیل", flag: "🇧🇷", leagueNames: ["Serie A", "Brasileirão Série A", "Brasileirao Serie A"], leagueIds: [71] },
];

const YOUTH_NATIONAL_MARKER = /(?:^|[\s-])(u17|u19|u20|u21|u23|under[- ]?(17|19|20|21|23))(?:$|[\s-])/i;

const NATIONAL_COMPETITION_PATTERNS = [
  /international friendlies?/,
  /world cup(?!.*club)/,
  /world cup qualifying|world cup qualification|world cup qualifiers/,
  /uefa.*(euro|european championship|nations league)/,
  /fifa.*(world|friendly|international)/,
  /afc.*(asian cup|qualif)/,
  /caf.*(africa cup|qualif)/,
  /concacaf.*(gold cup|nations league|qualif)/,
  /conmebol.*(copa america|qualif)/,
  /ofc.*(nations cup|qualif)/,
  /copa america/,
  /africa cup of nations|afcon/,
  /asian cup/,
  /gold cup/,
  /nations league/,
  /european championship/,
  /international friendlies?/,
  /دوستانه بین المللی|دوستانه بین‌المللی/,
  /جام جهانی|انتخابی جام جهانی/,
  /لیگ ملت(?:ها|‌ها)?ی اروپا|جام ملت(?:ها|‌ها)?ی اروپا|یورو/,
  /جام ملت(?:ها|‌ها)?ی آسیا/,
  /جام ملت(?:ها|‌ها)?ی آفریقا/,
  /جام طلایی/,
  /کوپا آمریکا/,
];

const SELECTED_NATIONAL_TEAM_PATTERNS = [
  /\biran\b|ایران/,
  /\bengland\b|انگلیس/,
  /\bspain\b|اسپانیا/,
  /\bitaly\b|ایتالیا/,
  /\bgermany\b|آلمان/,
  /\bfrance\b|فرانسه/,
  /\bnetherlands\b|هلند/,
  /\bportugal\b|پرتغال/,
  /\bturkey\b|\bturkiye\b|\bturkiye\b|ترکیه/,
  /\bsaudi arabia\b|عربستان/,
  /\bargentina\b|آرژانتین/,
  /\bbrazil\b|\bbrasil\b|برزیل/,
];

const normalizeScopeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function hasSelectedNationalTeam(match) {
  const home = normalizeScopeText(match?.home || match?.homeTeam || match?.teams?.home?.name);
  const away = normalizeScopeText(match?.away || match?.awayTeam || match?.teams?.away?.name);
  return SELECTED_NATIONAL_TEAM_PATTERNS.some((pattern) => pattern.test(home) || pattern.test(away));
}

export function getMatchCenterScope(match) {
  const clubLeague = getClubLeagueScope(match);
  if (clubLeague) return { kind: "club-league", key: clubLeague.key, label: clubLeague.label, entry: clubLeague };

  const league = normalizeScopeText(match?.league);
  if (YOUTH_NATIONAL_MARKER.test(league)) return null;
  const nationalCompetition = NATIONAL_COMPETITION_PATTERNS.some((pattern) => pattern.test(league));

  if (nationalCompetition && hasSelectedNationalTeam(match)) {
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
