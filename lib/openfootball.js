const DATASETS = [
  { country: "انگلیس", league: "Premier League", code: "en.1" },
  { country: "آلمان", league: "Bundesliga", code: "de.1" },
  { country: "اسپانیا", league: "La Liga", code: "es.1" },
  { country: "ایتالیا", league: "Serie A", code: "it.1" },
  { country: "فرانسه", league: "Ligue 1", code: "fr.1" },
];

const BASE = "https://raw.githubusercontent.com/openfootball/football.json/master";

function scoreValue(score) {
  if (Array.isArray(score)) return score;
  if (Array.isArray(score?.ft)) return score.ft;
  return null;
}

function normalize(match, dataset, season) {
  const scores = scoreValue(match.score);
  const hasScore = Array.isArray(scores) && scores.length >= 2 && scores.every((v) => Number.isFinite(Number(v)));
  const id = `openfootball-${season}-${dataset.code}-${match.date}-${encodeURIComponent(match.team1)}-${encodeURIComponent(match.team2)}`;
  const date = match.date && match.time ? `${match.date}T${match.time}:00+00:00` : `${match.date}T12:00:00+00:00`;
  const isPast = new Date(date).getTime() < Date.now();
  return {
    id,
    league: dataset.league,
    country: dataset.country,
    leagueId: dataset.code,
    season: Number(season.slice(0, 4)),
    home: match.team1,
    away: match.team2,
    homeId: null,
    awayId: null,
    homeLogo: null,
    awayLogo: null,
    date,
    statusShort: hasScore ? "FT" : isPast ? "NS" : "NS",
    status: hasScore ? "پایان" : "برنامه‌ریزی‌شده",
    elapsed: null,
    homeScore: hasScore ? Number(scores[0]) : null,
    awayScore: hasScore ? Number(scores[1]) : null,
    venue: null,
    city: null,
  };
}

export async function getOpenFootballMatches(date) {
  const season = `${new Date(`${date}T12:00:00Z`).getUTCFullYear()}-${String(new Date(`${date}T12:00:00Z`).getUTCFullYear() + 1).slice(-2)}`;
  const datasets = DATASETS.map(async (dataset) => {
    const url = `${BASE}/${season}/${dataset.code}.json`;
    try {
      const response = await fetch(url, { next: { revalidate: 21600 } });
      if (!response.ok) return [];
      const payload = await response.json();
      return (payload.matches || []).filter((match) => match.date === date).map((match) => normalize(match, dataset, season));
    } catch {
      return [];
    }
  });
  const results = (await Promise.all(datasets)).flat();
  return results.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
