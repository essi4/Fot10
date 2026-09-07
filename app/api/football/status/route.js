import { NextResponse } from "next/server";
import { checkSportsApiConnection } from "../../../../lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const result = await checkSportsApiConnection();

  return NextResponse.json(
    {
      ...result,
      checkedAt,
      keyConfigured: Boolean(result.hasApiKey),
      secretExposed: false,
    },
    { status: result.ok ? 200 : 503 },
  );
}
