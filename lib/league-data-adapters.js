import {
  getMatchesResilient,
  getPlayerStatsResilient,
  getStandingsResilient,
} from "./football-resilient";
import { getTopAssists, getTopScorers } from "./sports-data";
import { MATCH_CENTER_CLUB_LEAGUES } from "./match-center-scope";

const byKey = Object.fromEntries(
  MATCH_CENTER_CLUB_LEAGUES.map((league) => [league.key, league]),
);

const makeAdapter = (key) => {
  const scope = byKey[key];
  if (!scope) throw new Error(`Unknown FOT10 league adapter: ${key}`);

  return {
    id: key,
    leagueId: scope.leagueIds[0],
    nameFa: scope.label,
    countryFa: scope.label,
    async standings(season) {
      return getStandingsResilient(scope.leagueIds[0], season);
    },
    async fixtures(season) {
      return getMatchesResilient({
        league: scope.leagueIds[0],
        season,
      });
    },
    async scorers(season) {
      return getPlayerStatsResilient(
        "scorers",
        scope.leagueIds[0],
        season,
        getTopScorers,
      );
    },
    async assists(season) {
      return getPlayerStatsResilient(
        "assists",
        scope.leagueIds[0],
        season,
        getTopAssists,
      );
    },
  };
};

// Explicit adapters keep the 12-league boundary visible while sharing the
// same validated provider contract. No fixture/table/player values are stored
// here; every value comes from a provider at request time.
export const LEAGUE_DATA_ADAPTERS = {
  Iran: makeAdapter("Iran"),
  England: makeAdapter("England"),
  Spain: makeAdapter("Spain"),
  Italy: makeAdapter("Italy"),
  Germany: makeAdapter("Germany"),
  France: makeAdapter("France"),
  Netherlands: makeAdapter("Netherlands"),
  Portugal: makeAdapter("Portugal"),
  Turkey: makeAdapter("Turkey"),
  "Saudi Arabia": makeAdapter("Saudi Arabia"),
  Argentina: makeAdapter("Argentina"),
  Brazil: makeAdapter("Brazil"),
};

export function getLeagueDataAdapter(key) {
  return LEAGUE_DATA_ADAPTERS[key] || null;
}

export function toLeagueDataRecord(data, sourceOverride = null) {
  const source = sourceOverride || data?.source || "none";
  const fetchedAt = data?.fetchedAt || null;
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    source,
    fetchedAt,
    valid: Boolean(
      source !== "none" &&
      fetchedAt &&
      !Number.isNaN(new Date(fetchedAt).getTime()),
    ),
  };
}
