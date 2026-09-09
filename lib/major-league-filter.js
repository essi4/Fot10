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
  .replace(/\s+/g, " ")
  .trim();

export function isMajorLeague(match) {
  const league = normalize(match?.league);
  const country = normalize(match?.country);
  if (!league) return false;
  if (MAJOR_CONTINENTAL.some((name) => league.includes(name))) return true;
  return MAJOR_LEAGUES.some(([countryName, leagues]) => {
    const countryMatches = country.includes(countryName) || countryName.includes(country);
    return countryMatches && leagues.some((name) => league.includes(normalize(name)));
  });
}

export function filterMajorLeagues(matches = []) {
  return Array.isArray(matches) ? matches.filter(isMajorLeague) : [];
}
