export const MATCH_VISUALIZATION_SCOPE = [
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

export const MATCH_VISUALIZATION_LEAGUE_IDS = new Set(
  MATCH_VISUALIZATION_SCOPE.flatMap((item) => item.leagueIds)
);

const normalizeScopeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export function getMatchVisualizationLeague(match) {
  if (!match) return null;
  const leagueId = Number(match.leagueId);
  const byId = MATCH_VISUALIZATION_SCOPE.find((item) => item.leagueIds.includes(leagueId));
  if (byId) return byId;

  const league = normalizeScopeText(match.league);
  const country = normalizeScopeText(match.country);
  return (
    MATCH_VISUALIZATION_SCOPE.find(
      (item) =>
        item.leagueNames.some((name) => normalizeScopeText(name) === league) &&
        (item.key !== "Iran" || country.includes("iran") || country.includes("ایران"))
    ) || null
  );
}

export function isMatchVisualizationScope(match) {
  return Boolean(getMatchVisualizationLeague(match));
}
