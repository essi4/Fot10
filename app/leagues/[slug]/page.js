import League360PageV2 from "./League360PageV2";
import styles from "./league.module.css";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params, searchParams }) {
  return (
    <div className={styles.page}>
      <League360PageV2 params={params} searchParams={searchParams} />
    </div>
  );
}
