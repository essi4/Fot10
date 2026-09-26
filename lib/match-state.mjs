export function reconcileMatchGames({ currentKey, previousKey, previousGames = [], incomingGames = [] }) {
  if (incomingGames.length > 0) {
    return { games: incomingGames, lastGoodKey: currentKey };
  }

  if (previousKey !== currentKey) {
    return { games: [], lastGoodKey: null };
  }

  return { games: previousGames, lastGoodKey: previousKey };
}
