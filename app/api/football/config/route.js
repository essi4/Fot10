import { getSportsDataConfig } from "../../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getSportsDataConfig();
  return Response.json({ ok: true, ...config, demo: config.demoMode });
}
