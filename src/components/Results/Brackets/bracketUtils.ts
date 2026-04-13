import type { Player } from "@/types/Player";
import type { MatchRow } from "@/types/MatchTypes";

// These types describe a match on the frontend, not 1:1 with database data,
// as they are also used for displaying matches that have not been played yet.
export type Match = Omit<MatchRow, "id" | "player1" | "player2"> & {
  player1: Player | null;
  player2: Player | null;
};

export type Round = { id: number; matches: Match[] };

type PlayerInfo = {
  player: Player | null;
  futurePlayer: boolean;
};

type Pair = [PlayerInfo, PlayerInfo];

function getMatchByPlayer(player: Player, round: Round) {
  return round.matches.find(
    (match) => match.player1 === player || match.player2 === player,
  );
}

/**
 * Converts a database MatchRow into a frontend Match, resolving player names
 * to Player objects using the provided allPlayers list.
 */
export function castToMatch(
  match: MatchRow,
  allPlayers: (Player | null)[],
): Match {
  const { id: _id, player1, player2, ...rest } = match;
  return {
    ...rest,
    player1:
      allPlayers.find((p) => p && p.player.player_name === player1) ?? null,
    player2:
      allPlayers.find((p) => p && p.player.player_name === player2) ?? null,
  };
}

/**
 * Builds a single tournament round from a list of player pairs. Matches
 * already played (found via shared match IDs) are populated from context;
 * unplayed matches receive placeholder data so the bracket renders fully.
 */
export function buildRound(
  roundNumber: number,
  tournamentId: number,
  pairs: Pair[],
  allPlayers: (Player | null)[],
): Round | undefined {
  if (!tournamentId) return undefined;
  const matches = new Map<number, Match>();

  for (const pair of pairs) {
    const [i1, i2] = pair;
    const p1 = i1.player;
    const p2 = i2.player;

    if (!p1 || !p2) continue;

    const matchIds = p1.matches.map((match) => match.id);
    const hasMatch = p2.matches.find((match) => matchIds.includes(match.id));

    if (!hasMatch) continue;
    if (hasMatch.round !== roundNumber) continue;

    matches.set(hasMatch.match, castToMatch(hasMatch, allPlayers));
  }

  for (const i in pairs) {
    const matchId = Number(i) + 1;
    if (matches.has(matchId)) continue;

    const match: Match = {
      match: matchId,
      player1: pairs[i][0].player,
      player2: pairs[i][1].player,
      player1_hits: 0,
      player2_hits: 0,
      round: roundNumber,
      tournament_id: tournamentId,
      round_id: null,
      winner: "",
      submitted_by_token: null,
      submitted_at: null,
    };

    matches.set(matchId, match);
  }

  return {
    id: roundNumber,
    matches: Array.from(matches.values()).sort((a, b) => a.match - b.match),
  };
}

interface BuildRoundsParams {
  capacity: number | undefined;
  tournamentId: number;
  /** Ordered list of players for seeding/pairing */
  players: (Player | null)[];
  /** Full player list used to resolve names to Player objects in matches */
  allPlayers: (Player | null)[];
}

/**
 * Builds all rounds of a bracket tournament. Uses a standard single-elimination
 * format: players are paired in order, winners advance each round.
 */
export function buildRounds({
  capacity,
  tournamentId,
  players,
  allPlayers,
}: BuildRoundsParams): Round[] {
  if (!players || players.length < 2) return [];

  const rounds: Round[] = [];

  let playerInfo: PlayerInfo[];
  if (capacity) {
    playerInfo = new Array<PlayerInfo>(capacity).fill({
      player: null,
      futurePlayer: false,
    });
  } else {
    playerInfo = [];
  }

  players.forEach((player, i) => {
    playerInfo[i] = { player, futurePlayer: Boolean(player) };
  });

  const roundCount = Math.ceil(Math.log2(players.length));

  for (let i = 1; i <= roundCount; i++) {
    const pairs: Pair[] = [];
    let latest: PlayerInfo = { player: null, futurePlayer: false };

    playerInfo.forEach((player, j) => {
      if ((j + 1) % 2 === 0) {
        pairs.push([latest, player]);
        latest = { player: null, futurePlayer: false };
        return;
      }
      latest = player;
    });

    if (latest.player) {
      pairs.push([latest, { player: null, futurePlayer: false }]);
    }

    const round = buildRound(i, tournamentId, pairs, allPlayers);
    if (!round) continue;
    rounds.push(round);

    const advancers = new Map<number, PlayerInfo>();
    pairs.forEach((pair, j) => {
      const p1 = pair[0];
      const p2 = pair[1];

      // Pick whichever side has a player (handles byes)
      const p = p1.player ? p1 : p2;

      if (!p.player) {
        advancers.set(j, { player: null, futurePlayer: false });
        return;
      }

      if (!p1.futurePlayer || !p2.futurePlayer) {
        advancers.set(j, p);
        return;
      }

      const match = getMatchByPlayer(p.player, round);

      if (!match) {
        advancers.set(j, { player: null, futurePlayer: true });
        return;
      }

      if (!match.winner) {
        advancers.set(j, { player: null, futurePlayer: true });
        return;
      }

      if (!p1.player || !p2.player) {
        advancers.set(j, { player: null, futurePlayer: false });
        return;
      }

      const winner =
        p1.player.player.player_name === match.winner ? p1 : p2;
      advancers.set(j, winner);
    });

    playerInfo = Array.from(advancers.values());
  }

  return rounds;
}
