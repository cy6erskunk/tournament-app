"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";

export async function getTournament(
  name: string,
): Promise<Result<Tournament, string>> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .where("name", "=", name)
      .selectAll()
      .executeTakeFirst()

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

export async function getTournamentWithId(
  id: number,
): Promise<Result<Tournament, string>> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst()

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

// get tournament with Date
export async function getTournamentToday(
  dateToday: Date,
): Promise<Result<Tournament, string>> {
  try {
    const tournament = await db
      .selectFrom("tournaments")
      .selectAll()
      .where("date", "=", dateToday)
      .executeTakeFirst()

    if (!tournament) {
      return { success: false, error: "No tournament found" };
    }

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournament players" };
  }
}

// get recent tournaments
export async function getRecentTournaments(): Promise<
  Result<Tournament[], string>
> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .selectAll()
      .limit(5)
      .orderBy("id desc")
      .execute();

    if (!tournaments.length) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament[] };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournaments" };
  }
}
