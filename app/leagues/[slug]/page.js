import League360Page from "./League360Page";
import styles from "./league.module.css";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params, searchParams }) {
  return (
    <div className={styles.page}>
      <League360Page params={params} searchParams={searchParams} />
    </div>
  );
}
