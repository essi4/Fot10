import League360PageV2 from "./League360PageV2";

export const dynamic = "force-dynamic";

export default function LeagueDetailPage({ params, searchParams }) {
  return <League360PageV2 params={params} searchParams={searchParams} />;
}
