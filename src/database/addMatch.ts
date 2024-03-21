"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { Matches } from "./types";

// add match
export async function addMatch(
  tournamentId: number,
  player1: string,
  player2: string,
  round: number,
  winner: string | null,
): Promise<Result<Matches, string>> {
  try {
    const res = await db
      .insertInto("matches")
      .values({
        match: 4,
        player1: player1,
        player2: player2,
        round: round,
        tournament_id: tournamentId,
        winner: winner,
      })
      .returningAll()
      .executeTakeFirst();

    if (!res) {
      return { success: false, error: "Could not insert match" };
    }

    return { success: true, value: res };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert match" };
  }
}

// update hits given and hits received
export async function updateHgAndHr(
  player: string,
  tournamentId: number,
  hits_given: number,
  hits_received: number,
): Promise<Result<undefined, string>> {
  try {
    await db
      .updateTable("tournament_players")
      .set((eb) => ({
        hits_given: eb("hits_given", "+", hits_given),
        hits_received: eb("hits_received", "+", hits_received),
      }))
      .where("player_name", "=", player)
      .where("tournament_id", "=", tournamentId)
      .executeTakeFirst();

    return { success: true, value: undefined };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "Could not update tournament players HG and HR values",
    };
  }
}
