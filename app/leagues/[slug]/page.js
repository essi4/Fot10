import League360PageV2 from "./League360PageV2";
import LeagueStandingsLive from "./LeagueStandingsLive";
import LeagueNews from "../../../components/LeagueNews";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../lib/fot10-universe";
import { getLeagueCurrentSeason } from "../../../lib/sports-data";
import styles from "./league.module.css";

export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({ params, searchParams }) {
  const entry = LEAGUE_ENTRIES.find(item => item.slug === params.slug);
  const cup = CLUB_CUPS.find(item => item.slug === params.slug);
  const league = entry || cup;
  const competitionId = league?.leagueId ?? league?.id;

  let liveSeason = 2026;
  if (competitionId) {
    try {
      const resolvedSeason = await getLeagueCurrentSeason(competitionId);
      if (resolvedSeason) liveSeason = Number(resolvedSeason);
    } catch {
      liveSeason = 2026;
    }
  }

  return (
    <div className={styles.page}>
      {searchParams?.tab === "news" && league ? (
        <main className="fot-shell min-h-screen pb-12">
          <div className="fot-container space-y-3 sm:space-y-4">
            <LeagueNews leagueName={league.leagueName || league.name} country={league.apiCountry || league.country} />
          </div>
        </main>
      ) : searchParams?.tab === "table" && competitionId ? (
        <LeagueStandingsLive
          leagueId={competitionId}
          leagueName={league.leagueName || league.name}
          country={league.apiCountry || league.country}
          season={liveSeason}
        />
      ) : (
        <League360PageV2 params={params} searchParams={searchParams} />
      )}
    </div>
  );
}
