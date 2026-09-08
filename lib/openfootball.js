const DATASETS = [
  { country: "انگلیس", league: "Premier League", code: "en.1" },
  { country: "انگلیس", league: "Championship", code: "en.2" },
  { country: "انگلیس", league: "League One", code: "en.3" },
  { country: "انگلیس", league: "League Two", code: "en.4" },
  { country: "آلمان", league: "Bundesliga", code: "de.1" },
  { country: "آلمان", league: "2. Bundesliga", code: "de.2" },
  { country: "آلمان", league: "3. Liga", code: "de.3" },
  { country: "اسپانیا", league: "La Liga", code: "es.1" },
  { country: "اسپانیا", league: "Segunda División", code: "es.2" },
  { country: "ایتالیا", league: "Serie A", code: "it.1" },
  { country: "ایتالیا", league: "Serie B", code: "it.2" },
  { country: "فرانسه", league: "Ligue 1", code: "fr.1" },
  { country: "فرانسه", league: "Ligue 2", code: "fr.2" },
  { country: "هلند", league: "Eredivisie", code: "nl.1" },
  { country: "پرتغال", league: "Liga Portugal", code: "pt.1" },
  { country: "بلژیک", league: "Belgian Pro League", code: "be.1" },
  { country: "اتریش", league: "Bundesliga", code: "at.1" },
  { country: "دانمارک", league: "Superliga", code: "dk.1" },
  { country: "اسکاتلند", league: "Premiership", code: "sc.1" },
  { country: "چک", league: "First League", code: "cz.1" },
  { country: "ترکیه", league: "Süper Lig", code: "tr.1" },
  { country: "سوئد", league: "Allsvenskan", code: "se.1" },
  { country: "کرواسی", league: "HNL", code: "hr.1" },
  { country: "یونان", league: "Super League", code: "gr.1" },
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
    statusShort: hasScore ? "FT" : "NS",
    status: hasScore ? "پایان" : "برنامه‌ریزی‌شده",
    elapsed: null,
    homeScore: hasScore ? Number(scores[0]) : null,
    awayScore: hasScore ? Number(scores[1]) : null,
    venue: null,
    city: null,
  };
}

export async function getOpenFootballMatches(date) {
  const year = new Date(`${date}T12:00:00Z`).getUTCFullYear();
  const season = `${year}-${String(year + 1).slice(-2)}`;
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
