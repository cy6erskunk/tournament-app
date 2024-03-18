"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { Matches, Tournaments } from "./types";

// add match
export async function addMatch(
  tournamentId: number,
  player1: string,
  player2: string,
  winner: string | null,
): Promise<Result<Matches, string>> {
  try {
    const res = await db
      .insertInto("matches")
      .values({
        match: 4,
        player1: player1,
        player2: player2,
        round: 1,
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

// get tournament with Date
export async function getTournamentToday(
  dateToday: Date,
): Promise<Result<Tournaments, string>> {
  try {
    const tournament = (await db
      .selectFrom("tournaments")
      .select("id")
      .where("date", "=", dateToday)
      .executeTakeFirst()) as Tournaments | undefined;

    if (!tournament) {
      return { success: false, error: "No tournament found" };
    }

    return { success: true, value: tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournament players" };
  }
}

// create new tournament with Date
export async function createTournamentToday(
  dateToday: Date,
): Promise<Result<number, string>> {
  try {
    const tournament = await db
      .insertInto("tournaments")
      .values({
        name: "Tournament " + dateToday,
        date: dateToday,
        format: "old",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return { success: true, value: tournament.id };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert new tournament" };
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
