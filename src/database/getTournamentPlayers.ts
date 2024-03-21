"use server";

import { db } from "./database";
import { Result } from "@/types/result";
import { Matches, TournamentPlayers } from "./types";
import { Player } from "@/types/Player";

// Get tournament players and matches and return
// list of players with their corresponding matches
export async function getTournamentPlayers(
  tournamentId: number,
): Promise<Result<Player[], string>> {
  let tournamentPlayers: TournamentPlayers[] = [];
  let matches: Matches[] = [];

  //TODO: Combine query with selecting matches to prevent N+1 querying
  // https://docs.sentry.io/product/issues/issue-details/performance-issues/n-one-queries/
  try {
    tournamentPlayers = await db
      .selectFrom("tournament_players")
      .selectAll()
      .where("tournament_id", "=", tournamentId)
      .execute();

    if (!tournamentPlayers.length) {
      return { success: false, error: "No players found in tournament" };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournament players" };
  }

  try {
    matches = await db
      .selectFrom("matches")
      .selectAll()
      .where("tournament_id", "=", tournamentId)
      .execute();

    if (!matches) {
      return { success: false, error: "No tournament matches found" };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournament matches" };
  }

  const players: Player[] = [];

  // Attach matces to player
  tournamentPlayers.forEach((tp) => {
    const player: Player = {
      player: tp,
      matches: matches.filter((m) => {
        if (tp.player_name === m.player1) return true;
        if (tp.player_name === m.player2) return true;
        return false;
      })
    };

    players.push(player);
  });

  return { success: true, value: players };
}
