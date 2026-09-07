import { getTeamSquad } from "./sports-data";

/**
 * FOT10 rule: a player is included only when the registered shirt number is 10.
 * Tactical position alone never qualifies a player for the #10 universe.
 */
export function isNumber10(player) {
  return Number(player?.number) === 10;
}

export function normalizeNumber10(player, team) {
  return {
    id: player?.id ?? null,
    name: player?.name ?? "شماره ۱۰",
    age: player?.age ?? null,
    number: 10,
    position: player?.position ?? null,
    photo: player?.photo ?? null,
    team: team ? { id: team.id, name: team.name, logo: team.logo, national: Boolean(team.national) } : null,
  };
}

export async function getNumber10ForTeam(teamId) {
  const squad = await getTeamSquad(teamId);
  return squad.filter(isNumber10).map((player) => normalizeNumber10(player));
}
