import League360Page from "./League360Page";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params, searchParams }) {
  return <League360Page params={params} searchParams={searchParams} />;
}
