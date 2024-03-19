"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { Tournaments } from "./types";

export async function getTournament(
  name: string,
): Promise<Result<Tournaments, string>> {
  try {
    const tournaments = (await db
      .selectFrom("tournaments")
      .where("name", "=", name)
      .selectAll()
      .executeTakeFirst()) as Tournaments | undefined;

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

export async function getTournamentWithId(
  id: number,
): Promise<Result<Tournaments, string>> {
  try {
    const tournaments = (await db
      .selectFrom("tournaments")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst()) as Tournaments | undefined;

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

// get tournament with Date
export async function getTournamentToday(
  dateToday: Date,
): Promise<Result<Tournaments, string>> {
  try {
    const tournament = (await db
      .selectFrom("tournaments")
      .selectAll()
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
