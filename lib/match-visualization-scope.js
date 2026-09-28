import {
  MATCH_CENTER_CLUB_LEAGUES,
  MATCH_CENTER_LEAGUE_IDS,
  getMatchCenterScope,
  isMatchCenterScope,
  normalizeScopeText,
} from "./match-center-scope";

export const MATCH_VISUALIZATION_SCOPE = MATCH_CENTER_CLUB_LEAGUES;
export const MATCH_VISUALIZATION_LEAGUE_IDS = MATCH_CENTER_LEAGUE_IDS;

export function getMatchVisualizationLeague(match) {
  const scope = getMatchCenterScope(match);
  return scope?.kind === "club-league" ? scope.entry : null;
}

export function isMatchVisualizationScope(match) {
  return isMatchCenterScope(match);
}

export { normalizeScopeText };
