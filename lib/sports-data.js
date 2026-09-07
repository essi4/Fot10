export const DEMO_MODE = process.env.NEXT_PUBLIC_FOT10_DEMO !== "false";

export function getSportsDataConfig() {
  return {
    provider: process.env.SPORTS_DATA_PROVIDER || "demo",
    hasApiKey: Boolean(process.env.SPORTS_API_KEY),
    demoMode: DEMO_MODE,
  };
}

export async function getMatches() {
  if (DEMO_MODE || !process.env.SPORTS_API_KEY) return [];
  throw new Error("Sports provider adapter is not configured yet.");
}
