const MAJOR_LEAGUES = [
  ["iran", ["persian gulf pro league", "iranian pro league"]],
  ["england", ["premier league"]],
  ["spain", ["la liga", "laliga"]],
  ["italy", ["serie a"]],
  ["germany", ["bundesliga"]],
  ["france", ["ligue 1"]],
  ["netherlands", ["eredivisie"]],
  ["portugal", ["liga portugal", "primeira liga"]],
  ["turkey", ["super lig", "süper lig"]],
  ["saudi arabia", ["saudi pro league", "saudi professional league"]],
  ["brazil", ["brasileirao", "serie a"]],
  ["argentina", ["liga profesional", "primera division"]],
  ["belgium", ["pro league"]],
  ["scotland", ["premiership"]],
  ["usa", ["mls"]],
  ["mexico", ["liga mx"]],
  ["japan", ["j1 league"]],
  ["south korea", ["k league 1", "k1 league"]],
];

const COUNTRY_ALIASES = {
  iran: ["iran", "islamic republic of iran"],
  england: ["england"],
  spain: ["spain"],
  italy: ["italy"],
  germany: ["germany"],
  france: ["france"],
  netherlands: ["netherlands", "holland"],
  portugal: ["portugal"],
  turkey: ["turkey", "turkiye"],
  "saudi arabia": ["saudi arabia", "saudi-arabia", "saudi"],
  brazil: ["brazil", "brasil"],
  argentina: ["argentina"],
  belgium: ["belgium"],
  scotland: ["scotland"],
  usa: ["usa", "united states", "united states of america", "us"],
  mexico: ["mexico"],
  japan: ["japan"],
  "south korea": ["south korea", "korea republic", "republic of korea"],
};

const MAJOR_CONTINENTAL = [
  "uefa champions league",
  "champions league",
  "uefa europa league",
  "europa league",
  "uefa conference league",
  "conference league",
  "copa libertadores",
  "copa sudamericana",
];

const normalize = (value = "") => String(value)
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[\u2010-\u2015-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const countryMatches = (country, countryName) => {
  const aliases = COUNTRY_ALIASES[countryName] || [countryName];
  return aliases.some((alias) => {
    const normalizedAlias = normalize(alias);
    return country.includes(normalizedAlias) || normalizedAlias.includes(country);
  });
};

export function isMajorLeague(match) {
  const league = normalize(match?.league);
  const country = normalize(match?.country);
  if (!league) return false;
  if (MAJOR_CONTINENTAL.some((name) => league.includes(normalize(name)))) return true;

  return MAJOR_LEAGUES.some(([countryName, leagues]) => {
    const leagueMatches = leagues.some((name) => league.includes(normalize(name)));
    return leagueMatches && (!country || countryMatches(country, countryName));
  });
}

export function filterMajorLeagues(matches = []) {
  return Array.isArray(matches) ? matches.filter(isMajorLeague) : [];
}
