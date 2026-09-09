const MAJOR = [
  ["Iran", ["Persian Gulf Pro League", "Iranian Pro League", "خلیج فارس"]],
  ["England", ["Premier League"]],
  ["Spain", ["La Liga", "Laliga"]],
  ["Italy", ["Serie A"]],
  ["Germany", ["Bundesliga"]],
  ["France", ["Ligue 1"]],
  ["Netherlands", ["Eredivisie"]],
  ["Portugal", ["Liga Portugal", "Primeira Liga"]],
  ["Turkey", ["Super Lig", "Süper Lig"]],
  ["Saudi Arabia", ["Saudi Pro League", "Saudi Professional League"]],
  ["Brazil", ["Brasileirao", "Serie A"]],
  ["Argentina", ["Liga Profesional", "Primera Division"]],
  ["Belgium", ["Pro League"]],
  ["Scotland", ["Premiership"]],
  ["USA", ["MLS"]],
  ["Mexico", ["Liga MX"]],
  ["Japan", ["J1 League"]],
  ["South Korea", ["K League 1", "K1 League"]],
];

const CONTINENTAL = [
  "UEFA Champions League", "Champions League",
  "UEFA Europa League", "Europa League",
  "UEFA Conference League", "Conference League",
  "Copa Libertadores", "Copa Sudamericana",
];

const COUNTRY_ALIASES = {
  Iran: ["iran", "islamic republic of iran"],
  England: ["england"], Spain: ["spain"], Italy: ["italy"], Germany: ["germany"], France: ["france"],
  Netherlands: ["netherlands", "holland"], Portugal: ["portugal"], Turkey: ["turkey", "türkiye", "turkiye"],
  "Saudi Arabia": ["saudi arabia", "saudi-arabia", "saudi"], Brazil: ["brazil", "brasil"], Argentina: ["argentina"],
  Belgium: ["belgium"], Scotland: ["scotland"], USA: ["usa", "united states", "united states of america", "us"],
  Mexico: ["mexico"], Japan: ["japan"], "South Korea": ["south korea", "korea republic", "republic of korea"],
};

const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[‐‑‒–—]/g, "-").replace(/\s+/g, " ").trim();
const countryMatches = (country, expected) => {
  const value = normalize(country);
  return (COUNTRY_ALIASES[expected] || [normalize(expected)]).some((alias) => value === normalize(alias));
};

export function isMajorLeague(match) {
  const league = normalize(match?.league);
  const country = match?.country;
  if (!league) return false;
  if (CONTINENTAL.some((name) => league === normalize(name))) return true;
  for (const [expectedCountry, names] of MAJOR) {
    if (!countryMatches(country, expectedCountry)) continue;
    if (names.some((name) => league === normalize(name))) return true;
  }
  return false;
}

export function filterMajorLeagues(matches) {
  return Array.isArray(matches) ? matches.filter(isMajorLeague) : [];
}
