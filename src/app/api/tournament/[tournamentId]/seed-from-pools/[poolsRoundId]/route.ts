"use server";

import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { updatePlayersBracketSeeding } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";
import winPercentage from "@/helpers/winPercentage";
import { Player } from "@/types/Player";

type Params = {
  params: Promise<{
    tournamentId: string;
    poolsRoundId: string;
  }>;
};

function seeding(players: Player[]) {
  const participantsCount = players.length;
  const rounds = Math.ceil(Math.log(participantsCount) / Math.log(2));
  const bracketSize = Math.pow(2, rounds);

  if (participantsCount < 2) {
    return [];
  }

  let matches = [[1, 2]];

  for (let round = 1; round < rounds; round++) {
    const roundMatches: number[][] = [];
    const sum = Math.pow(2, round + 1) + 1;

    for (let i = 0; i < matches.length; i++) {
      const home = changeIntoBye(matches[i][0], participantsCount);
      const away = changeIntoBye(sum - matches[i][0], participantsCount);
      roundMatches.push([home, away]);

      const home2 = changeIntoBye(sum - matches[i][1], participantsCount);
      const away2 = changeIntoBye(matches[i][1], participantsCount);
      roundMatches.push([home2, away2]);
    }
    matches = roundMatches;
  }

  // suppress unused variable warning from bracketSize
  void bracketSize;

  return matches;
}

function changeIntoBye(seed: number, playerCount: number) {
  return seed <= playerCount ? seed : -1;
}

export async function GET(request: Request, { params }: Params) {
  const { tournamentId, poolsRoundId } = await params;

  const token = await getSession();
  if (!token.success || token.value.role !== "admin") {
    return new Response("Unauthorized access", { status: 403 });
  }

  const tid = Number(tournamentId);
  const rid = Number(poolsRoundId);

  if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(rid)) {
    return new Response("Invalid parameters", { status: 400 });
  }

  const status = await getTournamentPlayers(tid);
  if (!status.success) {
    return new Response(status.error, { status: 400 });
  }

  // Filter each player's matches to only those from the pools round
  const playersWithPoolMatches: Player[] = status.value.map((p) => ({
    ...p,
    matches: p.matches.filter((m) => m.round_id === rid),
  }));

  // Sort by win percentage in the pools round (descending)
  playersWithPoolMatches.sort((a, b) => {
    const aRate = winPercentage(a);
    const bRate = winPercentage(b);
    if (aRate !== bRate) return bRate - aRate;
    return 0;
  });

  const seedPairs = seeding(playersWithPoolMatches);
  if (seedPairs.length === 0) {
    return new Response("Not enough players to seed", { status: 400 });
  }

  // Assign bracket_match and bracket_seed to each player in-memory
  const seededPlayers: Player[] = seedPairs
    .flatMap((seeds, i) => {
      const p1 = playersWithPoolMatches[seeds[0] - 1] ?? null;
      const p2 = playersWithPoolMatches[seeds[1] - 1] ?? null;

      if (p1) {
        p1.player.bracket_match = i + 1;
        p1.player.bracket_seed = seeds[0];
      }
      if (p2) {
        p2.player.bracket_match = i + 1;
        p2.player.bracket_seed = seeds[1];
      }

      return [p1, p2];
    })
    .filter((p): p is Player => p !== null);

  const updated = await updatePlayersBracketSeeding(seededPlayers);
  if (!updated.success) {
    return new Response(updated.error, { status: 400 });
  }

  // Build a map of updated bracket data to apply to the full player list
  const bracketMap = new Map(
    seededPlayers.map((p) => [
      p.player.player_name,
      { bracket_match: p.player.bracket_match, bracket_seed: p.player.bracket_seed },
    ]),
  );

  const result = status.value.map((p) => {
    const bracket = bracketMap.get(p.player.player_name);
    if (bracket) {
      return { ...p, player: { ...p.player, ...bracket } };
    }
    return p;
  });

  return new Response(JSON.stringify(result), { status: 200 });
}
