"use server";
import { db } from "@/database/database";
import { Result } from "@/types/result";
import { TournamentPlayers } from "@/types/Kysely";
import { Player } from "@/types/Player";

// this function adds a new player to the players table
export async function newPlayer(
  name: string,
): Promise<Result<undefined, string>> {
  try {
    const user = await db
      .selectFrom("players")
      .select("player_name")
      .where((eb) =>
        eb(eb.fn("lower", ["player_name"]), "=", name.toLowerCase()),
      )
      .executeTakeFirst();

    if (user) {
      return {
        success: false,
        error: "Player already exists in players table",
      };
    }

    const result = await db
      .insertInto("players")
      .values({
        player_name: name.toString(),
      })
      .executeTakeFirst();
    console.log(result);

    if (!result) {
      return { success: false, error: "Error adding player" };
    }
    return { success: true, value: undefined };
  } catch (error) {
    return { success: false, error: "Error adding player" };
  }
}

// this function adds an existing player from the players table to the tournament_players table
export async function addPlayer(
  name: string,
  tournamentId: number,
): Promise<Result<Player, string>> {
  try {
    const user = await db
      .selectFrom("players")
      .select("player_name")
      .where((eb) =>
        eb(eb.fn("lower", ["player_name"]), "=", name.toLowerCase()),
      )
      .executeTakeFirst();

    if (!user) {
      return {
        success: false,
        error: "No player found in players table",
      };
    }

    const result = (await db
      .insertInto("tournament_players")
      .values({
        player_name: user.player_name,
        tournament_id: tournamentId,
      })
      .returningAll()
      .executeTakeFirst()) as TournamentPlayers | undefined;

    if (!result) {
      return { success: false, error: "Error adding player to tournament" };
    }

    const player: Player = {
      player: result,
      matches: [],
    };

    return { success: true, value: player };
  } catch (error) {
    return {
      success: false,
      error: "Error adding player to tournament (catch)",
    };
  }
}
