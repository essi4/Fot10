import League360PageV2 from "./League360PageV2";
import LeagueStandingsLive from "./LeagueStandingsLive";
import LeagueNews from "../../../components/LeagueNews";
import { CLUB_CUPS, LEAGUE_ENTRIES } from "../../../lib/fot10-universe";
import styles from "./league.module.css";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params, searchParams }) {
  const entry = LEAGUE_ENTRIES.find(item => item.slug === params.slug);
  const cup = CLUB_CUPS.find(item => item.slug === params.slug);
  const league = entry || cup;

  return (
    <div className={styles.page}>
      {searchParams?.tab === "news" && league ? (
        <main className="fot-shell min-h-screen pb-12">
          <div className="fot-container space-y-3 sm:space-y-4">
            <LeagueNews leagueName={league.leagueName || league.name} country={league.apiCountry || league.country} />
          </div>
        </main>
      ) : searchParams?.tab === "table" && league?.leagueId ? (
        <LeagueStandingsLive
          leagueId={league.leagueId}
          leagueName={league.leagueName || league.name}
          country={league.apiCountry || league.country}
          season={Number(league.leagueId) === 195 ? 2026 : undefined}
        />
      ) : (
        <League360PageV2 params={params} searchParams={searchParams} />
      )}
    </div>
  );
}
