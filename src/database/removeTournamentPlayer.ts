"use server"

import { Result } from "@/types/result";
import { db } from "./database";

export async function removeTournamentPlayer(
  tournamentId: number,
  playerName: string,
): Promise<Result<string, string>> {
  try {
    const res = await db
      .deleteFrom("tournament_players")
      .where("tournament_id", "=", tournamentId)
      .where("player_name", "=", playerName)
      .executeTakeFirst();

    const count = Number(res.numDeletedRows)
    if (!count) {
      return { success: false, error: "No players deleted" };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error deleting player" };
  }

  return { success: true, value: "Succesfully deleted player" };
}
